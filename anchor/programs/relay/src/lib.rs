use anchor_lang::prelude::*;

declare_id!("DevpMzGDfkVPuzkGY19S1KDP86YWKECqJ1cSwuVieiD4");

pub const REGISTRY_SEED: &[u8] = b"registry";
pub const GROUP_SEED: &[u8] = b"group";
pub const GROUP_COUNTER_SEED: &[u8] = b"group_counter";
pub const GMSG_SEED: &[u8] = b"gmsg";

pub const MAX_MEMBERS: usize = 20;

// You can store wrapped keys as bytes (recommended) or as strings.
// If bytes: typical NaCl box output for a 32-byte key is small.
// We'll cap to keep account size bounded.
// pub const MAX_WRAPPED_KEY_BYTES: usize = 128;
pub const MAX_WRAPPED_KEY_BYTES: usize = 1200;  // For ML-KEM-768 wrapped keys -- now quantum safe.

pub const MAX_CIPHERTEXT_BYTES: usize = 1200;
pub const MAX_NONCE_BYTES: usize = 64;

#[program]
pub mod relay {
    use super::*;

    // ----------------------------
    // REGISTRY (per-user)
    // ----------------------------
    // pub fn register(ctx: Context<Register>, nacl_public_key: String) -> Result<()> {
    //     require!(!nacl_public_key.is_empty(), RelayError::InvalidNaClPublicKey);
    //     require!(nacl_public_key.len() <= 64, RelayError::InvalidNaClPublicKey);

    //     let reg = &mut ctx.accounts.registry;
    //     reg.owner = ctx.accounts.owner.key();
    //     reg.nacl_public_key = nacl_public_key;
    //     reg.updated_at_slot = Clock::get()?.slot;
    //     Ok(())
    // }
    pub fn register(ctx: Context<Register>, pq_public_key: String) -> Result<()> {
        require!(!pq_public_key.is_empty(), RelayError::InvalidPQPublicKey);
        require!(pq_public_key.len() <= 2000, RelayError::InvalidPQPublicKey);  // base64 encoded ~1184 bytes
        
        let reg = &mut ctx.accounts.registry;
        reg.owner = ctx.accounts.owner.key();
        reg.pq_public_key = pq_public_key;  // renamed from nacl_public_key
        reg.updated_at_slot = Clock::get()?.slot;
        Ok(())
    }



    // ----------------------------
    // GROUP (create once)
    // group_id should be random [u8;32] from client
    // wrapped_keys must include one entry per member
    // ----------------------------
    pub fn create_group(
        ctx: Context<CreateGroup>,
        group_id: [u8; 32],
        members: Vec<Pubkey>,
        wrapped_keys: Vec<MemberWrappedKey>,
    ) -> Result<()> {
        require!(members.len() > 0, RelayError::NoMembers);
        require!(members.len() <= MAX_MEMBERS, RelayError::TooManyMembers);

        // creator must be a member (product rule)
        require!(
            members.iter().any(|m| *m == ctx.accounts.creator.key()),
            RelayError::CreatorNotMember
        );

        // validate wrapped keys match members exactly
        validate_wrapped_keys(&members, &wrapped_keys)?;

        let g = &mut ctx.accounts.group;
        g.group_id = group_id;
        g.members = members;
        g.key_version = 1;
        g.wrapped_keys = wrapped_keys;
        let slot = Clock::get()?.slot;
        g.created_at_slot = slot;
        g.updated_at_slot = slot;

        // init counter for messages
        let c = &mut ctx.accounts.counter;
        c.group = g.key();
        c.next_id = 0;

        Ok(())
    }

    // ----------------------------
    // GROUP KEY ROTATION
    // Any member can initiate, but cannot exclude others:
    // must provide wrapped_keys for ALL current members.
    // ----------------------------
    pub fn rotate_group_key(
        ctx: Context<RotateGroupKey>,
        group_id: [u8; 32],
        wrapped_keys: Vec<MemberWrappedKey>,
    ) -> Result<()> {
        let g = &mut ctx.accounts.group;
        require!(g.group_id == group_id, RelayError::GroupIdMismatch);

        // signer must be a member
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
    // ciphertext/nonce produced off-chain using the current group key
    // message includes key_version so recipients know which wrapped key to use
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

        // sender must be a member
        require!(
            g.members.iter().any(|m| *m == ctx.accounts.sender.key()),
            RelayError::NotGroupMember
        );

        // ensure sender used current version (or allow older? MVP: require current)
        require!(key_version == g.key_version, RelayError::KeyVersionMismatch);

        require!(ciphertext.len() > 0 && ciphertext.len() <= MAX_CIPHERTEXT_BYTES, RelayError::CiphertextTooLong);
        require!(nonce.len() > 0 && nonce.len() <= MAX_NONCE_BYTES, RelayError::NonceTooLong);

        // increment message id
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

    // Enforce: every wrapped_keys.member is in members, no duplicates, and all members covered.
    // We'll do a simple O(n^2) check since MAX_MEMBERS is small (<= 20).
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

#[derive(Accounts)]
pub struct Register<'info> {
    #[account(
        init_if_needed,
        payer = owner,
        seeds = [REGISTRY_SEED, owner.key().as_ref()],
        bump,
        space = Registry::SPACE
    )]
    pub registry: Account<'info, Registry>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
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

// #[account]
// pub struct Registry {
//     pub owner: Pubkey,
//     pub nacl_public_key: String,
//     pub updated_at_slot: u64,
// }
// impl Registry {
//     pub const SPACE: usize = 8 + 32 + 4 + 64 + 8;
// }

#[account]
pub struct Registry {
    pub owner: Pubkey,
    pub pq_public_key: String,  // Changed from nacl_public_key to Quantum safe
    pub updated_at_slot: u64,
}
impl Registry {
    pub const SPACE: usize = 8 + 32 + 4 + 2000 + 8;  // Increased from 64 to 2000
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
    // Conservative sizing (caps):
    // - members: 4 + MAX_MEMBERS*32
    // - wrapped_keys: 4 + MAX_MEMBERS*(32 + (4 + MAX_WRAPPED_KEY_BYTES))
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
    #[msg("Invalid NaCl public key.")]
    InvalidNaClPublicKey,

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
