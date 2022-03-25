import { defaultAbiCoder } from '@ethersproject/abi'
import BigNumber from 'bignumber.js'
import type { TransactionReceipt } from 'web3-core'
import { ChainId, createContract, TransactionEventType } from '@masknet/web3-shared-evm'
import type Web3 from 'web3'
import { AbiItem, asciiToHex, padRight, toWei } from 'web3-utils'

import { toChainAddress } from '../../SNSAdaptor/helpers'
import { ReferralFarmsV1, VerifierEffect, HarvestRequest } from '../../types'
import { getDaoAddress } from './discovery'
import { ERC20_ABI, REFERRAL_FARMS_V1_ABI } from './abis'
import { NATIVE_TOKEN } from '../../constants'

export async function runCreateERC20PairFarm(
    onConfirm: (type: boolean) => void,
    onStart: (type: boolean) => void,
    onTransactionHash: (type: string) => void,
    web3: Web3,
    account: string,
    chainId: ChainId,
    rewardTokenAddr: string,
    referredTokenAddr: string,
    totalFarmReward: BigNumber,
    dailyFarmReward: BigNumber,
) {
    try {
        onStart(true)
        let tx: any

        const referredTokenDefn = toChainAddress(chainId, referredTokenAddr)
        const rewardTokenDefn = toChainAddress(chainId, rewardTokenAddr)
        const farmsAddr = await getDaoAddress(web3, ReferralFarmsV1, chainId)
        const farms = createContract(web3, farmsAddr, REFERRAL_FARMS_V1_ABI as AbiItem[])
        totalFarmReward = new BigNumber(toWei(totalFarmReward.toString(), 'ether'))

        const config = {
            from: account,
        }

        // Grant permission
        const rewardTokenInstance = createContract(web3, rewardTokenAddr, ERC20_ABI as AbiItem[])
        const allowance = await rewardTokenInstance?.methods.allowance(account, farmsAddr).call()
        const isNeededGrantPermission = new BigNumber(allowance).isLessThan(totalFarmReward)
        if (isNeededGrantPermission) {
            const maxAllowance = new BigNumber(toWei('10000000000000', 'ether'))
            const estimatedGas = await rewardTokenInstance?.methods.approve(farmsAddr, maxAllowance).estimateGas(config)

            tx = await rewardTokenInstance?.methods.approve(farmsAddr, maxAllowance).send({
                ...config,
                gas: estimatedGas,
            })
        }
        const metastate =
            dailyFarmReward.toNumber() > 0
                ? [
                      // Metastate keys ideally are ascii and up to length 31 (ascii, utf8 might be less)
                      {
                          key: padRight(asciiToHex('periodRewardRate'), 64),
                          value: defaultAbiCoder.encode(
                              ['uint128', 'int128'],
                              [toWei(dailyFarmReward.toString(), 'ether'), '-1'],
                          ),
                      },
                  ]
                : []

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
            .on(TransactionEventType.CONFIRMATION, (no: number, receipt: TransactionReceipt) => {
                // show Confirm dialog only at the first time
                if (no === 1) {
                    onTransactionHash(receipt.transactionHash)
                }
            })
            .on(TransactionEventType.ERROR, (error: Error) => {
                onConfirm(false)
                onStart(false)
            })
    } catch (error) {
        onConfirm(false)
        onStart(false)
    }
}
export async function adjustFarmRewards(
    onConfirm: (type: boolean) => void,
    onStart: (type: boolean) => void,
    onTransactionHash: (type: string) => void,
    web3: Web3,
    account: string,
    chainId: ChainId,
    rewardTokenAddr: string,
    referredTokenAddr: string,
    totalFarmReward: BigNumber,
    dailyFarmReward: BigNumber,
) {
    try {
        // Increase/decrease the Daily Farm Reward and deposit Additional Farm Rewards
        if (totalFarmReward && totalFarmReward.toNumber() > 0) {
            if (rewardTokenAddr === NATIVE_TOKEN) {
                return await runCreateNativeFarm(
                    onConfirm,
                    onStart,
                    onTransactionHash,
                    web3,
                    account,
                    chainId,
                    referredTokenAddr,
                    totalFarmReward,
                    dailyFarmReward,
                )
            } else {
                return await runCreateERC20PairFarm(
                    onConfirm,
                    onStart,
                    onTransactionHash,
                    web3,
                    account,
                    chainId,
                    rewardTokenAddr,
                    referredTokenAddr,
                    totalFarmReward,
                    dailyFarmReward,
                )
            }
        }

        // Increase/decrease the Daily Farm Reward
        if (dailyFarmReward.toNumber() > 0) {
            onStart(true)

            const config = {
                from: account,
            }

            const farmsAddr = await getDaoAddress(web3, ReferralFarmsV1, chainId)
            const farms = createContract(web3, farmsAddr, REFERRAL_FARMS_V1_ABI as AbiItem[])
            const referredTokenDefn = toChainAddress(chainId, referredTokenAddr)
            const rewardTokenDefn = toChainAddress(chainId, rewardTokenAddr)
            const metastate = [
                {
                    key: padRight(asciiToHex('periodRewardRate'), 64),
                    value: defaultAbiCoder.encode(
                        ['uint128', 'int128'],
                        [toWei(dailyFarmReward.toString(), 'ether'), '-1'],
                    ),
                },
            ]
            const estimatedGas = await farms?.methods
                .configureMetastate(rewardTokenDefn, referredTokenDefn, metastate)
                .estimateGas(config)

            const tx = await farms?.methods
                .configureMetastate(rewardTokenDefn, referredTokenDefn, metastate)
                .send({
                    ...config,
                    gas: estimatedGas,
                })
                .on(TransactionEventType.RECEIPT, (onSucceed: () => void) => {
                    onStart(true)
                })
                .on(TransactionEventType.CONFIRMATION, (no: number, receipt: TransactionReceipt) => {
                    // show Confirm dialog only at the first time
                    if (no === 1) {
                        onTransactionHash(receipt.transactionHash)
                    }
                })
                .on(TransactionEventType.ERROR, (error: Error) => {
                    onConfirm(false)
                    onStart(false)
                })
        }
    } catch (error) {
        onConfirm(false)
        onStart(false)
    }
}

export async function runCreateNativeFarm(
    onConfirm: (type: boolean) => void,
    onStart: (type: boolean) => void,
    onTransactionHash: (type: string) => void,
    web3: Web3,
    account: string,
    chainId: ChainId,
    referredTokenAddr: string,
    totalFarmReward: BigNumber,
    dailyFarmReward: BigNumber,
) {
    try {
        onStart(true)

        const referredTokenDefn = toChainAddress(chainId, referredTokenAddr)
        const farmsAddr = await getDaoAddress(web3, ReferralFarmsV1, chainId)
        const farms = createContract(web3, farmsAddr, REFERRAL_FARMS_V1_ABI as AbiItem[])
        const metastate =
            dailyFarmReward.toNumber() > 0
                ? [
                      {
                          key: padRight(asciiToHex('periodRewardRate'), 64),
                          value: defaultAbiCoder.encode(
                              ['uint128', 'int128'],
                              [toWei(dailyFarmReward.toString(), 'ether'), '-1'],
                          ),
                      },
                  ]
                : []

        const config = {
            from: account,
            value: toWei(totalFarmReward.toString(), 'ether'),
        }
        const estimatedGas = await farms?.methods
            .increaseReferralFarmNative(referredTokenDefn, metastate)
            .estimateGas(config)

        const tx = await farms?.methods
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
    }
}

export async function harvestRewards(
    onConfirm: (txHash: string) => void,
    onStart: () => void,
    onError: () => void,
    web3: Web3,
    account: string,
    chainId: ChainId,
    effect: VerifierEffect,
    req: HarvestRequest,
) {
    try {
        onStart()

        const config = {
            from: account,
        }

        const farmsAddr = await getDaoAddress(web3, ReferralFarmsV1, chainId)
        const farms = createContract(web3, farmsAddr, REFERRAL_FARMS_V1_ABI as AbiItem[])

        const estimatedGas = await farms?.methods.harvestRewards([req], [effect], []).estimateGas(config)

        const tx = await farms?.methods
            .harvestRewards([req], [effect], [])
            .send({
                ...config,
                gas: estimatedGas,
            })
            .on(TransactionEventType.RECEIPT, (onSucceed: () => void) => {
                onStart()
            })
            .on(TransactionEventType.CONFIRMATION, (no: number, receipt: TransactionReceipt) => {
                // show Confirm dialog only at the first time
                if (no === 1) {
                    onConfirm(receipt.transactionHash)
                }
            })
            .on(TransactionEventType.ERROR, (error: Error) => {
                onError()
            })
    } catch (error) {
        onError()
    }
}
