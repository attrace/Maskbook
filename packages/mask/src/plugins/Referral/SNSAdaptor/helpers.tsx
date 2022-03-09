import { createTypedMessageMetadataReader, createRenderWithMetadata } from '@masknet/typed-message'
import { REFERRAL_META_KEY } from '../constants'
import type { ReferralMetaData, RewardData, Farm } from '../types'
import schema from '../schema.json'
import { defaultAbiCoder } from '@ethersproject/abi'
import { keccak256 } from 'web3-utils'
import { padStart } from 'lodash-unified'
import type { ChainId } from '@masknet/web3-shared-evm'

export const ReferralMetadataReader = createTypedMessageMetadataReader<ReferralMetaData>(REFERRAL_META_KEY, schema)
export const renderWithReferralMetadata = createRenderWithMetadata(ReferralMetadataReader)

export function toFarmHash(sponsor: string, rewardTokenDefn: string, referredTokenDefn: string): string {
    return keccak256(
        defaultAbiCoder.encode(['address', 'bytes24', 'bytes24'], [sponsor, rewardTokenDefn, referredTokenDefn]),
    )
}

export function toChainAddress(chainId: ChainId, address: string): string {
    const chaddr = '0x' + padStart(Number(chainId).toString(16), 8, '0') + address.substring(2).toLowerCase()
    return chaddr
}

export function toNativeRewardTokenDefn(chainId: ChainId): string {
    const nativeTokenAddr = '0x' + padStart(Number(chainId).toString(16), 40, '0')
    return toChainAddress(chainId, nativeTokenAddr)
}

// farms
export function getFarmsRewardData(farms?: Farm[]): RewardData {
    const dailyReward = farms?.reduce(function (previousValue, currentValue) {
        return previousValue + currentValue.dailyFarmReward
    }, 0)
    const totalReward = farms?.reduce(function (previousValue, currentValue) {
        return previousValue + currentValue.totalFarmRewards
    }, 0)

    return {
        dailyReward: dailyReward || 0,
        totalReward: totalReward || 0,
        // TODO: add APR in the next iteration
        apr: 0,
    }
}
export function getSponsoredFarmsForReferredToken(chainId?: number, referredToken?: string, farms?: Farm[]) {
    if (!farms?.length || !referredToken || !chainId) return undefined

    return farms.filter((farm) => farm.referredTokenDefn === toChainAddress(chainId, referredToken))
}
