import {
    ChainAddress,
    FarmExistsEvent,
    ReferralFarmsV1,
    expandBytes24ToBytes32,
    expandEvmAddressToBytes32,
    FarmDepositChange,
} from '../../types'
import type Web3 from 'web3'
import { keccak256 } from 'web3-utils'

import { Interface } from '@ethersproject/abi'

import { getDaoAddress } from './discovery'
import { queryIndexersWithNearestQuorum } from './indexers'
import { FARM_ABI } from './abis'

const iface = new Interface(FARM_ABI)

// Index the events name => id
const eventIds: any = {}
Object.entries(iface.events).forEach(([k, v]) => (eventIds[v.name] = keccak256(k)))

function parseEvents(items: Array<any>): Array<any> {
    const parsed = items.map((row) => {
        return iface.parseLog({
            data: row.data,
            topics: JSON.parse(row.topics),
        })
    })
    return parsed
}

function parseFarmExistsEvents(unparsed: any) {
    const parsed = parseEvents(unparsed)

    const farms: Array<FarmExistsEvent> = parsed.map((e) => {
        const { farmHash, referredTokenDefn, rewardTokenDefn, sponsor } = e.args
        return { farmHash, referredTokenDefn, rewardTokenDefn, sponsor }
    })

    return farms
}

function parseFarmDepositChangeEvents(unparsed: any) {
    const parsed = parseEvents(unparsed)

    const farms: Array<FarmDepositChange> = parsed.map((e) => {
        const { delta, farmHash } = e.args
        return { farmHash, delta }
    })

    return farms
}

interface TokenFilter {
    rewardTokens?: [ChainAddress]
    referredTokens?: [ChainAddress]
}

export async function getMyFarms(web3: Web3, account: string, filter?: TokenFilter): Promise<Array<FarmExistsEvent>> {
    console.log('getMyFarms')
    const farmsAddr = await getDaoAddress(web3, ReferralFarmsV1)
    console.log('farmsAddr', farmsAddr)
    // Query for existing farms and their deposits
    // TODO paging

    // Allow filtering your own tokens
    let topic3, topic4
    if (filter?.rewardTokens) {
        topic3 = filter.rewardTokens.map((t) => expandBytes24ToBytes32(t))
    }
    if (filter?.referredTokens) {
        topic4 = filter.referredTokens.map((t) => expandBytes24ToBytes32(t))
    }

    // Query indexers
    const res = await queryIndexersWithNearestQuorum({
        addresses: [farmsAddr],
        topic1: [eventIds.FarmExists],
        topic2: [expandEvmAddressToBytes32(account)],
        topic3,
        topic4,
    })

    return parseFarmExistsEvents(res.items)
}

export async function getFarmsDeposits(web3: Web3): Promise<Array<FarmDepositChange>> {
    const farmsAddr = await getDaoAddress(web3, ReferralFarmsV1)

    const res = await queryIndexersWithNearestQuorum({
        addresses: [farmsAddr],
        topics: [eventIds.FarmDepositChange],
    })

    return parseFarmDepositChangeEvents(res.items)
}
