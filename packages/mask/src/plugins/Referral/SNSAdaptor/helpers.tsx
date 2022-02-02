import { createRenderWithMetadata, createTypedMessageMetadataReader } from '@masknet/shared-base'
import { REFERRAL_META_KEY } from '../constants'
import type { ChainAddress, ReferralMetaData } from '../types'
import schema from '../schema.json'
import { defaultAbiCoder } from '@ethersproject/abi'
import { keccak256 } from 'web3-utils'
import { padStart } from 'lodash-unified'
import type { ChainId } from '@masknet/web3-shared-evm'
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
export function parseChainAddress(chainAddress: ChainAddress): string {
    const address = '0x' + chainAddress.substring(10).toLowerCase()
    return address
}
