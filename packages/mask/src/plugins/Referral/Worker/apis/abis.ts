export const FARM_ABI = [
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'bytes32',
                name: 'farmHash',
                type: 'bytes32',
            },
            {
                indexed: false,
                internalType: 'int256',
                name: 'delta',
                type: 'int256',
            },
        ],
        name: 'FarmDepositChange',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'sponsor',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'bytes24',
                name: 'rewardTokenDefn',
                type: 'bytes24',
            },
            {
                indexed: true,
                internalType: 'bytes24',
                name: 'referredTokenDefn',
                type: 'bytes24',
            },
            {
                indexed: false,
                internalType: 'bytes32',
                name: 'farmHash',
                type: 'bytes32',
            },
        ],
        name: 'FarmExists',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'bytes32',
                name: 'farmHash',
                type: 'bytes32',
            },
            {
                indexed: true,
                internalType: 'bytes32',
                name: 'key',
                type: 'bytes32',
            },
            {
                indexed: false,
                internalType: 'bytes',
                name: 'value',
                type: 'bytes',
            },
        ],
        name: 'FarmMetastate',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'bytes32',
                name: 'farmHash',
                type: 'bytes32',
            },
            {
                indexed: true,
                internalType: 'bytes24',
                name: 'token',
                type: 'bytes24',
            },
            {
                indexed: false,
                internalType: 'uint8',
                name: 'change',
                type: 'uint8',
            },
        ],
        name: 'FarmTokenChange',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'previousOwner',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'newOwner',
                type: 'address',
            },
        ],
        name: 'OwnershipTransferred',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'caller',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'bytes24',
                name: 'rewardTokenDefn',
                type: 'bytes24',
            },
            {
                indexed: true,
                internalType: 'bytes32',
                name: 'farmHash',
                type: 'bytes32',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'value',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'bytes32',
                name: 'leafHash',
                type: 'bytes32',
            },
        ],
        name: 'RewardsHarvested',
        type: 'event',
    },
    {
        inputs: [
            {
                internalType: 'bytes24',
                name: 'rewardTokenDefn',
                type: 'bytes24',
            },
            {
                internalType: 'bytes24',
                name: 'referredTokenDefn',
                type: 'bytes24',
            },
            {
                components: [
                    {
                        internalType: 'bytes32',
                        name: 'key',
                        type: 'bytes32',
                    },
                    {
                        internalType: 'bytes',
                        name: 'value',
                        type: 'bytes',
                    },
                ],
                internalType: 'struct KeyVal[]',
                name: 'metastate',
                type: 'tuple[]',
            },
        ],
        name: 'configureMetastate',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'bytes24',
                name: 'rewardTokenDefn',
                type: 'bytes24',
            },
            {
                internalType: 'bytes24',
                name: 'referredTokenDefn',
                type: 'bytes24',
            },
            {
                internalType: 'bytes24[]',
                name: 'addedTokens',
                type: 'bytes24[]',
            },
            {
                internalType: 'bytes24[]',
                name: 'removedTokens',
                type: 'bytes24[]',
            },
        ],
        name: 'configureMultiTokenFarmTokens',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'account',
                type: 'address',
            },
        ],
        name: 'getAccountNonce',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'bytes32',
                name: 'farmHash',
                type: 'bytes32',
            },
        ],
        name: 'getFarmDepositRemaining',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'bytes32',
                name: 'farmHash',
                type: 'bytes32',
            },
            {
                internalType: 'bytes24',
                name: 'referredTokenDefn',
                type: 'bytes24',
            },
        ],
        name: 'getFarmReferredTokenStatus',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                components: [
                    {
                        internalType: 'bytes24',
                        name: 'rewardTokenDefn',
                        type: 'bytes24',
                    },
                    {
                        components: [
                            {
                                internalType: 'bytes32',
                                name: 'farmHash',
                                type: 'bytes32',
                            },
                            {
                                internalType: 'uint256',
                                name: 'value',
                                type: 'uint256',
                            },
                        ],
                        internalType: 'struct ReferralFarmsV1.FarmReward[]',
                        name: 'rewards',
                        type: 'tuple[]',
                    },
                ],
                internalType: 'struct ReferralFarmsV1.HarvestRequest[]',
                name: 'reqs',
                type: 'tuple[]',
            },
            {
                components: [
                    {
                        internalType: 'uint64',
                        name: 'nonce',
                        type: 'uint64',
                    },
                    {
                        internalType: 'bytes32[]',
                        name: 'proof',
                        type: 'bytes32[]',
                    },
                ],
                internalType: 'struct VerifierEffectsV1.VerifierEffect[]',
                name: 'effects',
                type: 'tuple[]',
            },
            {
                internalType: 'uint64[]',
                name: 'skipEffectNonces',
                type: 'uint64[]',
            },
        ],
        name: 'harvestRewards',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'bytes24',
                name: 'rewardToken',
                type: 'bytes24',
            },
            {
                internalType: 'bytes24',
                name: 'referredTokenDefn',
                type: 'bytes24',
            },
            {
                internalType: 'uint256',
                name: 'rewardDeposit',
                type: 'uint256',
            },
            {
                components: [
                    {
                        internalType: 'bytes32',
                        name: 'key',
                        type: 'bytes32',
                    },
                    {
                        internalType: 'bytes',
                        name: 'value',
                        type: 'bytes',
                    },
                ],
                internalType: 'struct KeyVal[]',
                name: 'metastate',
                type: 'tuple[]',
            },
        ],
        name: 'increaseReferralFarm',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'bytes24',
                name: 'referredTokenDefn',
                type: 'bytes24',
            },
            {
                components: [
                    {
                        internalType: 'bytes32',
                        name: 'key',
                        type: 'bytes32',
                    },
                    {
                        internalType: 'bytes',
                        name: 'value',
                        type: 'bytes',
                    },
                ],
                internalType: 'struct KeyVal[]',
                name: 'metastate',
                type: 'tuple[]',
            },
        ],
        name: 'increaseReferralFarmNative',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'initialize',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'owner',
        outputs: [
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'processDAOChanges',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'renounceOwnership',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'sponsor',
                type: 'address',
            },
            {
                internalType: 'bytes24',
                name: 'rewardTokenDefn',
                type: 'bytes24',
            },
            {
                internalType: 'bytes24',
                name: 'referredTokenDefn',
                type: 'bytes24',
            },
            {
                internalType: 'bytes24[]',
                name: 'referredTokens',
                type: 'bytes24[]',
            },
        ],
        name: 'testnetMigrate',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'newOwner',
                type: 'address',
            },
        ],
        name: 'transferOwnership',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
]
