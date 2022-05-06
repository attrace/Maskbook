import { padStart } from 'lodash-unified'
import { BigNumber } from '@ethersproject/bignumber'
import type { PrefixedHexString } from 'ethereumjs-util'
import type { ChainId } from '@masknet/web3-shared-evm'
import { createTypedMessageMetadataReader } from '@masknet/typed-message'

import { META_KEY, supportedChainId } from './constants'
import type { ReferralMetaData, ChainAddress, ChainAddressProps, EvmAddress, Bytes32, Bytes24 } from './types'
import schema from './schema.json'

// Fast convert internal types to Buffer
// Ensure we only convert values if we need them
export function buf(b: Buffer | Uint8Array | PrefixedHexString | BigNumber | number | bigint): Buffer | undefined {
    if (b === null) return undefined

    if (b instanceof Buffer) return b

    if (b instanceof Uint8Array) return Buffer.from(b)

    if (typeof b === 'number') {
        return Buffer.from(BigNumber.from(b).toHexString().substring(2), 'hex')
    }

    if (typeof b === 'bigint') return Buffer.from(toEvenLength(b.toString(16)), 'hex')

    if (typeof b === 'string') {
        if (!b.startsWith('0x')) throw new Error('unsupported')
        const hex = b.substring(2)
        if (hex.length % 2 !== 0 || !isHexString(b)) {
            // Buffer.from(hex, 'hex') will throw on invalid hex, should we do it?
            throw new Error('invalid hex string')
        }

        return Buffer.from(hex, 'hex')
    }

    // This should return the most compact buffer version without leading zeros, so safe for RLP encodings.
    if (b instanceof BigNumber || (b as any)?._isBigNumber === true)
        return Buffer.from((b as any).toHexString().substring(2), 'hex')

    throw new Error('unsupported')
}

export function bi(b: Buffer | BigNumber | bigint | Uint8Array | PrefixedHexString): bigint {
    if (typeof b === 'bigint') return b
    if (b instanceof Buffer) return BigInt('0x' + b.toString('hex'))

    const bufValue = buf(b)
    if (!buf) throw new Error('wrong buf')

    if ((b instanceof Uint8Array || typeof b === 'string') && bufValue) return bi(bufValue)
    if (b instanceof BigNumber || (b as any)?._isBigNumber === true) return (b as any).toBigInt() as bigint

    throw new Error('unsupported')
}

function toEvenLength(str: string): string {
    if (str.length % 2 !== 0) {
        return '0' + str
    }
    return str
}

function isHexString(value: string): boolean {
    return !!value.match(/^0x[\dA-Fa-f]*$/)
}

export function toChainAddress(chainId: BigNumber | bigint, address: Buffer): Buffer {
    if (address.byteLength !== 20) throw new Error('invalid address')
    const b = Buffer.alloc(24)
    // Only numeric network id's are supported in the chain address, with max of uint32.
    b.writeUint32BE(Number(bi(chainId)))
    b.fill(address, 4)
    return b
}

export function toChainAddressEthers(chainId: number, address: string): string {
    return '0x' + toChainAddress(BigNumber.from(chainId), Buffer.from(address.substring(2), 'hex')).toString('hex')
}

export const referralMetadataReader = createTypedMessageMetadataReader<ReferralMetaData>(META_KEY, schema)

export function parseChainAddress(chainAddress: ChainAddress): ChainAddressProps {
    const chainId = toChainId(chainAddress)
    const address = toEvmAddress(chainAddress)
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
    return toChainAddressEthers(chainId, nativeTokenAddr)
}

export function roundValue(value: string | number, tokenDecimals?: number) {
    const valueStr = tokenDecimals === 0 ? Math.ceil(Number(value)).toString() : Number(value).toFixed(5)
    return Number.parseFloat(valueStr)
}

export function getRequiredChainId(currentChainId: ChainId) {
    return supportedChainId === currentChainId ? currentChainId : supportedChainId
}
