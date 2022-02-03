import { createRenderWithMetadata, createTypedMessageMetadataReader } from '@masknet/shared-base'
import {
    PROPORTIONAL_FARM_REFERRED_TOKEN_DEFN,
    REFERRAL_META_KEY,
    MASK_TOKEN_ADDR,
    ATTR_TOKEN_ADDR,
} from '../constants'
import type { ReferralMetaData, ChainAddress, TokensGroupedByType } from '../types'
import schema from '../schema.json'
import { defaultAbiCoder } from '@ethersproject/abi'
import { keccak256 } from 'web3-utils'
import { padStart } from 'lodash-unified'
import type { ChainId } from '@masknet/web3-shared-evm'

import { IconURLS } from './IconURL'

export const ReferralMetadataReader = createTypedMessageMetadataReader<ReferralMetaData>(REFERRAL_META_KEY, schema)
export const renderWithReferralMetadata = createRenderWithMetadata(ReferralMetadataReader)

// export function getABIItem(abi: string[]) {
//     const interfaceM = new Interface(abi);
//     const abiJson = interfaceM.format(FormatTypes.json);
//     const abiObject = JSON.parse(JSON.stringify(abiJson));
//     return abiObject
// }

export function toFarmHash(sponsor: string, rewardTokenDefn: string, referredTokenDefn: string): string {
    return keccak256(
        defaultAbiCoder.encode(['address', 'bytes24', 'bytes24'], [sponsor, rewardTokenDefn, referredTokenDefn]),
    )
}

export function toChainAddress(chainId: ChainId, address: string): string {
    //                    chainID (4 bytes)                                address (20 bytes)
    const chaddr = '0x' + padStart(Number(chainId).toString(16), 8, '0') + address.substring(2).toLowerCase()
    return chaddr
}
export function toNativeRewardTokenDefn(chainId: ChainId): string {
    const nativeTokenAddr = '0x' + padStart(Number(chainId).toString(16), 40, '0')
    return toChainAddress(chainId, nativeTokenAddr)
}

export function getTokenTypeIcons(tokenChainAddr: ChainAddress, tokensGroupedByType: TokensGroupedByType) {
    const icons = []
    if (tokensGroupedByType.sponsoredFarmTokens.includes(tokenChainAddr)) {
        icons.push(IconURLS.sponsoredFarmLogo)
    }
    if (tokensGroupedByType.attrFarmsTokens.includes(tokenChainAddr)) {
        icons.push(IconURLS.attrLogo)
    }
    if (tokensGroupedByType.maskFarmsTokens.includes(tokenChainAddr)) {
        icons.push(IconURLS.maskLogo)
    }
    return icons
}

export function getFarmTypeIconByReferredToken(
    referredTokenDefn: ChainAddress,
    rewardTokenDefn: ChainAddress,
    chainId: ChainId,
) {
    if (referredTokenDefn !== PROPORTIONAL_FARM_REFERRED_TOKEN_DEFN) {
        return IconURLS.sponsoredFarmLogo
    }

    if (rewardTokenDefn === toChainAddress(chainId, ATTR_TOKEN_ADDR)) {
        return IconURLS.attrLogo
    }

    if (rewardTokenDefn === toChainAddress(chainId, MASK_TOKEN_ADDR)) {
        return IconURLS.maskLogo
    }
}
