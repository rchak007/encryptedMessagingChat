/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/relay.json`.
 */
export type Relay = {
  "address": "DevpMzGDfkVPuzkGY19S1KDP86YWKECqJ1cSwuVieiD4",
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
      "name": "register",
      "discriminator": [
        211,
        124,
        67,
        15,
        211,
        194,
        178,
        240
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
          "name": "naclPublicKey",
          "type": "string"
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
      "name": "invalidNaClPublicKey",
      "msg": "Invalid NaCl public key."
    },
    {
      "code": 6001,
      "name": "noMembers",
      "msg": "No members provided."
    },
    {
      "code": 6002,
      "name": "tooManyMembers",
      "msg": "Too many members."
    },
    {
      "code": 6003,
      "name": "creatorNotMember",
      "msg": "Creator must be a member."
    },
    {
      "code": 6004,
      "name": "groupIdMismatch",
      "msg": "Group id mismatch."
    },
    {
      "code": 6005,
      "name": "notGroupMember",
      "msg": "Signer is not a group member."
    },
    {
      "code": 6006,
      "name": "wrappedKeysCountMismatch",
      "msg": "Wrapped keys count must equal members count."
    },
    {
      "code": 6007,
      "name": "wrappedKeyNotMember",
      "msg": "Wrapped key refers to a wallet not in members."
    },
    {
      "code": 6008,
      "name": "wrappedKeyTooLong",
      "msg": "Wrapped key too long."
    },
    {
      "code": 6009,
      "name": "wrappedKeysMissingOrDuplicate",
      "msg": "Wrapped keys missing or duplicate for a member."
    },
    {
      "code": 6010,
      "name": "ciphertextTooLong",
      "msg": "Ciphertext too long."
    },
    {
      "code": 6011,
      "name": "nonceTooLong",
      "msg": "Nonce too long."
    },
    {
      "code": 6012,
      "name": "keyVersionMismatch",
      "msg": "Key version mismatch."
    },
    {
      "code": 6013,
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
            "name": "naclPublicKey",
            "type": "string"
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
