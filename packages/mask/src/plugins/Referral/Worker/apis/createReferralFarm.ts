import { defaultAbiCoder } from '@ethersproject/abi'
import { ChainId, createContract, TransactionEventType } from '@masknet/web3-shared-evm'
import type Web3 from 'web3'
import { AbiItem, asciiToHex, padRight, toWei } from 'web3-utils'
import { toChainAddress, toNativeRewardTokenDefn } from '../../SNSAdaptor/helpers'
import { Metastate, ReferralFarmsV1 } from '../../types'
import { getDaoAddress } from './discovery'
import { FARM_ABI } from './abis'

export const getChainId = ChainId.Rinkeby

export const erc20ABI = [
    {
        inputs: [
            {
                internalType: 'address',
                name: 'spender',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
            },
        ],
        name: 'approve',
        outputs: [
            {
                internalType: 'bool',
                name: '',
                type: 'bool',
            },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
    },
]
export async function runCreateERC20PairFarm(
    onConfirm: (type: boolean) => void,
    onStart: (type: boolean) => void,
    onTransactionHash: (type: string) => void,
    web3: Web3,
    account: string,
    rewardTokenAddr: string,
    referredTokenAddr: string,
    totalFarmReward: number,
    dailyFarmReward: number,
) {
    try {
        onStart(true)
        let tx: any

        const chainId = getChainId
        const referredTokenDefn = toChainAddress(chainId, referredTokenAddr)
        const rewardTokenDefn = toChainAddress(chainId, rewardTokenAddr)

        const farmsAddr = await getDaoAddress(web3, ReferralFarmsV1)
        const farms = createContract(web3, farmsAddr, FARM_ABI as AbiItem[])

        const rewardTokenInstance = createContract(web3, rewardTokenAddr, erc20ABI as AbiItem[])
        const config = {
            from: account,
        }
        totalFarmReward = Number.parseFloat(toWei(totalFarmReward.toString(), 'ether'))
        const estimatedGas = await rewardTokenInstance?.methods.approve(farmsAddr, totalFarmReward).estimateGas(config)
        tx = await rewardTokenInstance?.methods.approve(farmsAddr, totalFarmReward).send({
            ...config,
            gas: estimatedGas,
        })

        const metastate = [
            {
                key: padRight(asciiToHex('dailyRewardRate'), 64),
                value: defaultAbiCoder.encode(['uint256'], [toWei(dailyFarmReward.toString(), 'ether')]),
            },
        ]

        const estimatedGas2 = await farms?.methods
            .increaseReferralFarm(rewardTokenDefn, referredTokenDefn, totalFarmReward, metastate)
            .estimateGas(config)

        tx = await farms?.methods
            .increaseReferralFarm(rewardTokenDefn, referredTokenDefn, totalFarmReward, metastate)
            .send({
                ...config,
                gas: estimatedGas2,
            })
            .on(TransactionEventType.RECEIPT, (onSucceed: () => void) => {
                onStart(true)
            })
            .on(TransactionEventType.TRANSACTION_HASH, (hash: string) => {
                onTransactionHash(hash)
            })
            .on(TransactionEventType.CONFIRMATION, (onSucceed: () => void) => {
                onConfirm(true)
            })
            .on(TransactionEventType.ERROR, (error: Error) => {
                alert(error)
                onConfirm(false)
                onStart(false)
            })
    } catch (error) {
        onConfirm(false)
        onStart(false)
        alert(error)
    }
}

export async function runCreateNativeFarm(
    onConfirm: (type: boolean) => void,
    onStart: (type: boolean) => void,
    onTransactionHash: (type: string) => void,
    web3: Web3,
    account: string,
    rewardTokenAddr: string,
    referredTokenAddr: string,
    totalFarmReward: number,
    dailyFarmReward: number,
) {
    try {
        onStart(true)
        let tx: any, metastate: Metastate

        const chainId = getChainId
        const referredTokenDefn = toChainAddress(chainId, referredTokenAddr)
        const rewardTokenDefn = toNativeRewardTokenDefn(chainId)
        const farmsAddr = await getDaoAddress(web3, ReferralFarmsV1)
        const farms = createContract(web3, farmsAddr, FARM_ABI as AbiItem[])
        metastate = [
            {
                key: padRight(asciiToHex('dailyRewardRate'), 64),
                value: defaultAbiCoder.encode(['uint256'], [toWei(dailyFarmReward.toString(), 'ether')]),
            },
        ]

        const config = {
            from: account,
            value: toWei(totalFarmReward.toString(), 'ether'),
        }
        const estimatedGas = await farms?.methods
            .increaseReferralFarmNative(referredTokenDefn, metastate)
            .estimateGas(config)

        tx = await farms?.methods
            .increaseReferralFarmNative(referredTokenDefn, metastate)
            .send({
                ...config,
                gas: estimatedGas,
            })
            .on(TransactionEventType.RECEIPT, (onSucceed: () => void) => {
                onStart(true)
            })
            .on(TransactionEventType.TRANSACTION_HASH, (hash: string) => {
                onTransactionHash(hash)
            })
            .on(TransactionEventType.CONFIRMATION, (onSucceed: () => void) => {
                onConfirm(true)
            })
            .on(TransactionEventType.ERROR, (error: Error) => {
                onConfirm(false)
                onStart(false)
            })
    } catch (error) {
        onConfirm(false)
        onStart(false)
        alert(error)
    }
}
