import { padStart } from 'lodash-unified'
import type { ChainId } from '@masknet/web3-shared-evm'
import { createTypedMessageMetadataReader } from '@masknet/typed-message'

import { REFERRAL_META_KEY } from '../constants'
import type {
    ReferralMetaData,
    RewardData,
    Farm,
    ChainAddress,
    ChainAddressProps,
    EvmAddress,
    Bytes32,
    Bytes24,
} from '../types'
import schema from '../schema.json'

export const referralMetadataReader = createTypedMessageMetadataReader<ReferralMetaData>(REFERRAL_META_KEY, schema)

export function toChainAddress(chainId: ChainId, address: string): string {
    const chaddr = '0x' + padStart(Number(chainId).toString(16), 8, '0') + address.substring(2).toLowerCase()
    return chaddr
}

export function parseChainAddress(chaddr: ChainAddress): ChainAddressProps {
    const chainId = toChainId(chaddr)
    const address = toEvmAddress(chaddr)
    const isNative = chainId === Number.parseInt(address.substring(2 + 16 * 2), 16)
    return {
        chainId,
        address,
        isNative,
    }
}

export function expandEvmAddressToBytes32(addr: EvmAddress): Bytes32 {
    return `0x000000000000000000000000${addr.substring(2)}`.toLowerCase()
}
export function expandBytes24ToBytes32(b24: Bytes24): Bytes32 {
    return `0x${b24.substring(2)}0000000000000000`.toLowerCase()
}
export function toEvmAddress(addr: ChainAddress): EvmAddress {
    return `0x${addr.substring(2 + 4 * 2)}`
}
export function toChainId(addr: ChainAddress): number {
    return Number.parseInt(addr.substring(2, 2 + 4 * 2), 16)
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
