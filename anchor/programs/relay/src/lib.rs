use anchor_lang::prelude::*;

declare_id!("6rAhthMf4epVSGp1K6iFVdsZMMftGgK2iVyhxLu5mjhC");

pub const REGISTRY_SEED: &[u8] = b"registry";
pub const GROUP_SEED: &[u8] = b"group";
pub const GROUP_COUNTER_SEED: &[u8] = b"group_counter";
pub const GMSG_SEED: &[u8] = b"gmsg";

pub const MAX_MEMBERS: usize = 20;

pub const MAX_WRAPPED_KEY_BYTES: usize = 1200;  // For ML-KEM-768 wrapped keys

pub const MAX_CIPHERTEXT_BYTES: usize = 900;   // Reduced to fit single tx (~900 bytes plaintext)
pub const MAX_NONCE_BYTES: usize = 64;

// ML-KEM-768 public key = 1184 bytes, split into two 592-byte chunks
pub const PQ_KEY_TOTAL: usize = 1184;
pub const PQ_KEY_HALF: usize = 592;

#[program]
pub mod relay {
    use super::*;

    // ----------------------------
    // REGISTRY: Two-part registration
    // ----------------------------
    // Part 1: Creates the registry PDA and writes the first 592 bytes.
    //         Sets is_complete = false.
    // ----------------------------
    pub fn register_part1(ctx: Context<RegisterPart1>, key_chunk: Vec<u8>) -> Result<()> {
        require!(key_chunk.len() == PQ_KEY_HALF, RelayError::InvalidChunkSize);

        let reg = &mut ctx.accounts.registry;
        reg.owner = ctx.accounts.owner.key();
        reg.is_complete = false;

        // Write first half (bytes 0..592)
        reg.pq_public_key[..PQ_KEY_HALF].copy_from_slice(&key_chunk);
        // Zero out second half explicitly
        reg.pq_public_key[PQ_KEY_HALF..].fill(0);

        reg.updated_at_slot = Clock::get()?.slot;
        Ok(())
    }

    // ----------------------------
    // Part 2: Writes the second 592 bytes into the existing registry PDA.
    //         Sets is_complete = true.
    //         Validates that the signer is the same owner.
    // ----------------------------
    pub fn register_part2(ctx: Context<RegisterPart2>, key_chunk: Vec<u8>) -> Result<()> {
        require!(key_chunk.len() == PQ_KEY_HALF, RelayError::InvalidChunkSize);

        let reg = &mut ctx.accounts.registry;

        // Ensure the signer is the original owner who ran part1
        require!(reg.owner == ctx.accounts.owner.key(), RelayError::OwnerMismatch);

        // Ensure part1 was already done (owner is set) but not yet complete
        require!(!reg.is_complete, RelayError::AlreadyComplete);

        // Write second half (bytes 592..1184)
        reg.pq_public_key[PQ_KEY_HALF..].copy_from_slice(&key_chunk);

        reg.is_complete = true;
        reg.updated_at_slot = Clock::get()?.slot;
        Ok(())
    }

    // ----------------------------
    // GROUP (create once)
    // ----------------------------
    pub fn create_group(
        ctx: Context<CreateGroup>,
        group_id: [u8; 32],
        members: Vec<Pubkey>,
        wrapped_keys: Vec<MemberWrappedKey>,
    ) -> Result<()> {
        require!(members.len() > 0, RelayError::NoMembers);
        require!(members.len() <= MAX_MEMBERS, RelayError::TooManyMembers);

        require!(
            members.iter().any(|m| *m == ctx.accounts.creator.key()),
            RelayError::CreatorNotMember
        );

        validate_wrapped_keys(&members, &wrapped_keys)?;

        let g = &mut ctx.accounts.group;
        g.group_id = group_id;
        g.members = members;
        g.key_version = 1;
        g.wrapped_keys = wrapped_keys;
        let slot = Clock::get()?.slot;
        g.created_at_slot = slot;
        g.updated_at_slot = slot;

        let c = &mut ctx.accounts.counter;
        c.group = g.key();
        c.next_id = 0;

        Ok(())
    }

    // ----------------------------
    // GROUP KEY ROTATION
    // ----------------------------
    pub fn rotate_group_key(
        ctx: Context<RotateGroupKey>,
        group_id: [u8; 32],
        wrapped_keys: Vec<MemberWrappedKey>,
    ) -> Result<()> {
        let g = &mut ctx.accounts.group;
        require!(g.group_id == group_id, RelayError::GroupIdMismatch);

        require!(
            g.members.iter().any(|m| *m == ctx.accounts.member.key()),
            RelayError::NotGroupMember
        );

        validate_wrapped_keys(&g.members, &wrapped_keys)?;

        g.key_version = g.key_version.checked_add(1).ok_or(RelayError::MathOverflow)?;
        g.wrapped_keys = wrapped_keys;
        g.updated_at_slot = Clock::get()?.slot;

        Ok(())
    }

    // ----------------------------
    // SEND GROUP MESSAGE
    // ----------------------------
    pub fn send_group_message(
        ctx: Context<SendGroupMessage>,
        group_id: [u8; 32],
        key_version: u64,
        ciphertext: Vec<u8>,
        nonce: Vec<u8>,
    ) -> Result<()> {
        let g = &ctx.accounts.group;
        require!(g.group_id == group_id, RelayError::GroupIdMismatch);

        require!(
            g.members.iter().any(|m| *m == ctx.accounts.sender.key()),
            RelayError::NotGroupMember
        );

        require!(key_version == g.key_version, RelayError::KeyVersionMismatch);

        require!(ciphertext.len() > 0 && ciphertext.len() <= MAX_CIPHERTEXT_BYTES, RelayError::CiphertextTooLong);
        require!(nonce.len() > 0 && nonce.len() <= MAX_NONCE_BYTES, RelayError::NonceTooLong);

        let counter = &mut ctx.accounts.counter;
        let msg_id = counter.next_id;
        counter.next_id = counter.next_id.checked_add(1).ok_or(RelayError::MathOverflow)?;

        let m = &mut ctx.accounts.gmsg;
        m.group = g.key();
        m.sender = ctx.accounts.sender.key();
        m.msg_id = msg_id;
        m.key_version = key_version;
        m.ciphertext = ciphertext;
        m.nonce = nonce;
        m.created_at_slot = Clock::get()?.slot;

        Ok(())
    }
}

// ----------------------------
// Helpers
// ----------------------------
fn validate_wrapped_keys(members: &Vec<Pubkey>, wrapped_keys: &Vec<MemberWrappedKey>) -> Result<()> {
    require!(wrapped_keys.len() == members.len(), RelayError::WrappedKeysCountMismatch);

    for wk in wrapped_keys.iter() {
        require!(
            members.iter().any(|m| *m == wk.member),
            RelayError::WrappedKeyNotMember
        );
        require!(wk.wrapped_key.len() > 0 && wk.wrapped_key.len() <= MAX_WRAPPED_KEY_BYTES, RelayError::WrappedKeyTooLong);
    }

    for member in members.iter() {
        let count = wrapped_keys.iter().filter(|wk| wk.member == *member).count();
        require!(count == 1, RelayError::WrappedKeysMissingOrDuplicate);
    }

    Ok(())
}

// ----------------------------
// Accounts
// ----------------------------

// Part 1: init_if_needed creates the PDA and writes first half
#[derive(Accounts)]
pub struct RegisterPart1<'info> {
    #[account(
        init_if_needed,
        payer = owner,
        seeds = [REGISTRY_SEED, owner.key().as_ref()],
        bump,
        space = Registry::SPACE,
    )]
    pub registry: Account<'info, Registry>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// Part 2: mutates the existing PDA, no init needed
#[derive(Accounts)]
pub struct RegisterPart2<'info> {
    #[account(
        mut,
        seeds = [REGISTRY_SEED, owner.key().as_ref()],
        bump,
    )]
    pub registry: Account<'info, Registry>,
    #[account(mut)]
    pub owner: Signer<'info>,
    // No system_program needed — account already exists
}

#[derive(Accounts)]
#[instruction(group_id: [u8;32])]
pub struct CreateGroup<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        seeds = [GROUP_SEED, group_id.as_ref()],
        bump,
        space = GroupState::SPACE
    )]
    pub group: Account<'info, GroupState>,

    #[account(
        init,
        payer = creator,
        seeds = [GROUP_COUNTER_SEED, group.key().as_ref()],
        bump,
        space = GroupCounter::SPACE
    )]
    pub counter: Account<'info, GroupCounter>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(group_id: [u8;32])]
pub struct RotateGroupKey<'info> {
    #[account(mut)]
    pub member: Signer<'info>,

    #[account(
        mut,
        seeds = [GROUP_SEED, group_id.as_ref()],
        bump,
    )]
    pub group: Account<'info, GroupState>,
}

#[derive(Accounts)]
#[instruction(group_id: [u8;32])]
pub struct SendGroupMessage<'info> {
    #[account(mut)]
    pub sender: Signer<'info>,

    #[account(
        seeds = [GROUP_SEED, group_id.as_ref()],
        bump
    )]
    pub group: Account<'info, GroupState>,

    #[account(
        mut,
        seeds = [GROUP_COUNTER_SEED, group.key().as_ref()],
        bump
    )]
    pub counter: Account<'info, GroupCounter>,

    #[account(
        init,
        payer = sender,
        seeds = [GMSG_SEED, group.key().as_ref(), counter.next_id.to_le_bytes().as_ref()],
        bump,
        space = GroupMessage::SPACE
    )]
    pub gmsg: Account<'info, GroupMessage>,

    pub system_program: Program<'info, System>,
}

// ----------------------------
// State
// ----------------------------

#[account]
pub struct Registry {
    pub owner: Pubkey,              // 32 bytes
    pub pq_public_key: [u8; 1184],  // ML-KEM-768 public key (fixed array)
    pub is_complete: bool,           // true after both parts are written
    pub updated_at_slot: u64,        // 8 bytes
}
impl Registry {
    // 8 (discriminator) + 32 (owner) + 1184 (key) + 1 (is_complete) + 8 (slot) = 1233
    pub const SPACE: usize = 8 + 32 + PQ_KEY_TOTAL + 1 + 8;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MemberWrappedKey {
    pub member: Pubkey,
    pub wrapped_key: Vec<u8>,
}

#[account]
pub struct GroupState {
    pub group_id: [u8; 32],
    pub members: Vec<Pubkey>,
    pub key_version: u64,
    pub wrapped_keys: Vec<MemberWrappedKey>,
    pub created_at_slot: u64,
    pub updated_at_slot: u64,
}
impl GroupState {
    pub const SPACE: usize =
        8 +                 // discr
        32 +                // group_id
        4 + (MAX_MEMBERS * 32) + // members vec
        8 +                 // key_version
        4 + (MAX_MEMBERS * (32 + 4 + MAX_WRAPPED_KEY_BYTES)) + // wrapped_keys vec
        8 +                 // created_at_slot
        8;                  // updated_at_slot
}

#[account]
pub struct GroupCounter {
    pub group: Pubkey,
    pub next_id: u64,
}
impl GroupCounter {
    pub const SPACE: usize = 8 + 32 + 8;
}

#[account]
pub struct GroupMessage {
    pub group: Pubkey,
    pub sender: Pubkey,
    pub msg_id: u64,
    pub key_version: u64,
    pub ciphertext: Vec<u8>,
    pub nonce: Vec<u8>,
    pub created_at_slot: u64,
}
impl GroupMessage {
    pub const SPACE: usize =
        8 +     // discr
        32 +    // group
        32 +    // sender
        8 +     // msg_id
        8 +     // key_version
        4 + MAX_CIPHERTEXT_BYTES + // ciphertext vec
        4 + MAX_NONCE_BYTES +      // nonce vec
        8;     // slot
}

// ----------------------------
// Errors
// ----------------------------
#[error_code]
pub enum RelayError {
    #[msg("Invalid post-quantum public key.")]
    InvalidPQPublicKey,

    #[msg("Invalid chunk size — expected exactly 592 bytes.")]
    InvalidChunkSize,

    #[msg("Owner mismatch — signer does not own this registry.")]
    OwnerMismatch,

    #[msg("Registration already complete.")]
    AlreadyComplete,

    #[msg("No members provided.")]
    NoMembers,
    #[msg("Too many members.")]
    TooManyMembers,
    #[msg("Creator must be a member.")]
    CreatorNotMember,

    #[msg("Group id mismatch.")]
    GroupIdMismatch,
    #[msg("Signer is not a group member.")]
    NotGroupMember,

    #[msg("Wrapped keys count must equal members count.")]
    WrappedKeysCountMismatch,
    #[msg("Wrapped key refers to a wallet not in members.")]
    WrappedKeyNotMember,
    #[msg("Wrapped key too long.")]
    WrappedKeyTooLong,
    #[msg("Wrapped keys missing or duplicate for a member.")]
    WrappedKeysMissingOrDuplicate,

    #[msg("Ciphertext too long.")]
    CiphertextTooLong,
    #[msg("Nonce too long.")]
    NonceTooLong,

    #[msg("Key version mismatch.")]
    KeyVersionMismatch,

    #[msg("Math overflow.")]
    MathOverflow,
}