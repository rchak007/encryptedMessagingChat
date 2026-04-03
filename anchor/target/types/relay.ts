/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/relay.json`.
 */
export type Relay = {
  "address": "6rAhthMf4epVSGp1K6iFVdsZMMftGgK2iVyhxLu5mjhC",
  "metadata": {
    "name": "relay",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "createGroup",
      "discriminator": [
        79,
        60,
        158,
        134,
        61,
        199,
        56,
        248
      ],
      "accounts": [
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "group",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  114,
                  111,
                  117,
                  112
                ]
              },
              {
                "kind": "arg",
                "path": "groupId"
              }
            ]
          }
        },
        {
          "name": "counter",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  114,
                  111,
                  117,
                  112,
                  95,
                  99,
                  111,
                  117,
                  110,
                  116,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "group"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "groupId",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "members",
          "type": {
            "vec": "pubkey"
          }
        },
        {
          "name": "wrappedKeys",
          "type": {
            "vec": {
              "defined": {
                "name": "memberWrappedKey"
              }
            }
          }
        }
      ]
    },
    {
      "name": "registerPart1",
      "discriminator": [
        108,
        200,
        83,
        107,
        124,
        40,
        109,
        171
      ],
      "accounts": [
        {
          "name": "registry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "keyChunk",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "registerPart2",
      "discriminator": [
        106,
        118,
        24,
        117,
        207,
        134,
        219,
        242
      ],
      "accounts": [
        {
          "name": "registry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "keyChunk",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "rotateGroupKey",
      "discriminator": [
        238,
        175,
        55,
        223,
        174,
        8,
        54,
        34
      ],
      "accounts": [
        {
          "name": "member",
          "writable": true,
          "signer": true
        },
        {
          "name": "group",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  114,
                  111,
                  117,
                  112
                ]
              },
              {
                "kind": "arg",
                "path": "groupId"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "groupId",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "wrappedKeys",
          "type": {
            "vec": {
              "defined": {
                "name": "memberWrappedKey"
              }
            }
          }
        }
      ]
    },
    {
      "name": "sendGroupMessage",
      "discriminator": [
        140,
        132,
        193,
        112,
        163,
        204,
        84,
        254
      ],
      "accounts": [
        {
          "name": "sender",
          "writable": true,
          "signer": true
        },
        {
          "name": "group",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  114,
                  111,
                  117,
                  112
                ]
              },
              {
                "kind": "arg",
                "path": "groupId"
              }
            ]
          }
        },
        {
          "name": "counter",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  114,
                  111,
                  117,
                  112,
                  95,
                  99,
                  111,
                  117,
                  110,
                  116,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "group"
              }
            ]
          }
        },
        {
          "name": "gmsg",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  109,
                  115,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "group"
              },
              {
                "kind": "account",
                "path": "counter.next_id",
                "account": "groupCounter"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "groupId",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "keyVersion",
          "type": "u64"
        },
        {
          "name": "ciphertext",
          "type": "bytes"
        },
        {
          "name": "nonce",
          "type": "bytes"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "groupCounter",
      "discriminator": [
        51,
        121,
        217,
        187,
        211,
        36,
        92,
        39
      ]
    },
    {
      "name": "groupMessage",
      "discriminator": [
        114,
        199,
        46,
        234,
        132,
        64,
        35,
        136
      ]
    },
    {
      "name": "groupState",
      "discriminator": [
        55,
        178,
        239,
        222,
        83,
        210,
        195,
        67
      ]
    },
    {
      "name": "registry",
      "discriminator": [
        47,
        174,
        110,
        246,
        184,
        182,
        252,
        218
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidPqPublicKey",
      "msg": "Invalid post-quantum public key."
    },
    {
      "code": 6001,
      "name": "invalidChunkSize",
      "msg": "Invalid chunk size — expected exactly 592 bytes."
    },
    {
      "code": 6002,
      "name": "ownerMismatch",
      "msg": "Owner mismatch — signer does not own this registry."
    },
    {
      "code": 6003,
      "name": "alreadyComplete",
      "msg": "Registration already complete."
    },
    {
      "code": 6004,
      "name": "noMembers",
      "msg": "No members provided."
    },
    {
      "code": 6005,
      "name": "tooManyMembers",
      "msg": "Too many members."
    },
    {
      "code": 6006,
      "name": "creatorNotMember",
      "msg": "Creator must be a member."
    },
    {
      "code": 6007,
      "name": "groupIdMismatch",
      "msg": "Group id mismatch."
    },
    {
      "code": 6008,
      "name": "notGroupMember",
      "msg": "Signer is not a group member."
    },
    {
      "code": 6009,
      "name": "wrappedKeysCountMismatch",
      "msg": "Wrapped keys count must equal members count."
    },
    {
      "code": 6010,
      "name": "wrappedKeyNotMember",
      "msg": "Wrapped key refers to a wallet not in members."
    },
    {
      "code": 6011,
      "name": "wrappedKeyTooLong",
      "msg": "Wrapped key too long."
    },
    {
      "code": 6012,
      "name": "wrappedKeysMissingOrDuplicate",
      "msg": "Wrapped keys missing or duplicate for a member."
    },
    {
      "code": 6013,
      "name": "ciphertextTooLong",
      "msg": "Ciphertext too long."
    },
    {
      "code": 6014,
      "name": "nonceTooLong",
      "msg": "Nonce too long."
    },
    {
      "code": 6015,
      "name": "keyVersionMismatch",
      "msg": "Key version mismatch."
    },
    {
      "code": 6016,
      "name": "mathOverflow",
      "msg": "Math overflow."
    }
  ],
  "types": [
    {
      "name": "groupCounter",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "group",
            "type": "pubkey"
          },
          {
            "name": "nextId",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "groupMessage",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "group",
            "type": "pubkey"
          },
          {
            "name": "sender",
            "type": "pubkey"
          },
          {
            "name": "msgId",
            "type": "u64"
          },
          {
            "name": "keyVersion",
            "type": "u64"
          },
          {
            "name": "ciphertext",
            "type": "bytes"
          },
          {
            "name": "nonce",
            "type": "bytes"
          },
          {
            "name": "createdAtSlot",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "groupState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "groupId",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "members",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "keyVersion",
            "type": "u64"
          },
          {
            "name": "wrappedKeys",
            "type": {
              "vec": {
                "defined": {
                  "name": "memberWrappedKey"
                }
              }
            }
          },
          {
            "name": "createdAtSlot",
            "type": "u64"
          },
          {
            "name": "updatedAtSlot",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "memberWrappedKey",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "member",
            "type": "pubkey"
          },
          {
            "name": "wrappedKey",
            "type": "bytes"
          }
        ]
      }
    },
    {
      "name": "registry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "pqPublicKey",
            "type": {
              "array": [
                "u8",
                1184
              ]
            }
          },
          {
            "name": "isComplete",
            "type": "bool"
          },
          {
            "name": "updatedAtSlot",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
