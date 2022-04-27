import type {
    ChainAddress,
    FarmExistsEvent,
    FarmDepositChange,
    ChainId,
    Farm,
    FarmHash,
    RewardsHarvestedEvent,
} from '../../types'
import type { ERC20TokenDetailed } from '@masknet/web3-shared-evm'
import { keccak256, fromWei, asciiToHex, padRight } from 'web3-utils'
import { defaultAbiCoder, Interface } from '@ethersproject/abi'
import { orderBy } from 'lodash-unified'
import { TokenList } from '@masknet/web3-providers'
import { formatUnits } from '@ethersproject/units'

import { expandBytes24ToBytes32, expandEvmAddressToBytes32, parseChainAddress } from '../../helpers'
import { queryIndexersWithNearestQuorum } from './indexers'
import { REFERRAL_FARMS_V1_ABI } from './abis'
import { REFERRAL_FARMS_V1_ADDR } from '../../constants'

const REFERRAL_FARMS_V1_IFACE = new Interface(REFERRAL_FARMS_V1_ABI)

// Index the events name => id
const eventIds: any = {}
Object.entries(REFERRAL_FARMS_V1_IFACE.events).forEach(([k, v]) => (eventIds[v.name] = keccak256(k)))

function parseEvents(items: Array<any>): Array<any> {
    const itemsSorted = orderBy(items, ['chainId', 'blockNumber', 'logIndex'], ['asc', 'asc', 'asc'])
    const parsed = itemsSorted.map((row) => {
        return REFERRAL_FARMS_V1_IFACE.parseLog({
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

    // select unique farms(uniq farmHash)
    const uniqueFarms = farms.filter(
        (val, index) => index === farms.findIndex((elem) => elem.farmHash === val.farmHash),
    )

    return uniqueFarms
}
function parseFarmDepositChangeEvents(unparsed: any) {
    const parsed = parseEvents(unparsed)

    const farms: Array<FarmDepositChange> = parsed.map((e) => {
        const { delta, farmHash } = e.args
        return { farmHash, delta }
    })

    return farms
}
function parseFarmMetaStateChangeEvents(unparsed: any) {
    const parsed = parseEvents(unparsed)

    const farmMetastateMap = new Map<string, { dailyFarmReward: string }>()

    parsed.forEach((e) => {
        const { farmHash, key, value } = e.args

        const periodRewardKey = padRight(asciiToHex('periodReward'), 64)
        let dailyFarmReward = '0'

        if (key === periodRewardKey) {
            const periodReward = defaultAbiCoder.decode(['uint128', 'int128'], value)[0]
            dailyFarmReward = periodReward.toString()
        }

        // set the last value(newest) of dailyFarmReward
        farmMetastateMap.set(farmHash, { dailyFarmReward })
    })

    return farmMetastateMap
}
function parseBasicFarmEvents(unparsed: any, tokens: ERC20TokenDetailed[]) {
    const allTokensMap = new Map(tokens.map((token) => [token.address.toLowerCase(), token]))
    const parsed = parseEvents(unparsed)
    const farms: Array<Farm> = []

    // select unique farms
    const allEventsFarmExists = parsed.filter((e) => e.topic === eventIds.FarmExists)
    const uniqueFarms = allEventsFarmExists.filter(
        (val, index) => index === allEventsFarmExists.findIndex((event) => event.args.farmHash === val.args.farmHash),
    )
    const farmExistsEventsMap = new Map(uniqueFarms.map((e) => [e.args.farmHash, e.args]))

    // group all deposit and dailyRewardRate for farmHash
    const farmMap = new Map<string, { totalFarmRewards?: number; dailyFarmReward?: number }>()
    parsed.forEach((e) => {
        const { farmHash } = e.args
        const prevFarmState = farmMap.get(farmHash)

        const farmData = farmExistsEventsMap.get(farmHash)
        const rewardTokenAddr = parseChainAddress(farmData.rewardTokenDefn).address
        const rewardTokenDec = allTokensMap.get(rewardTokenAddr)?.decimals ?? 18

        if (e.topic === eventIds.FarmDepositChange) {
            const prevTotalFarmRewards = prevFarmState?.totalFarmRewards || 0

            const totalFarmRewards =
                prevTotalFarmRewards + Number.parseFloat(formatUnits(e.args.delta.toString(), rewardTokenDec))
            farmMap.set(farmHash, { ...prevFarmState, totalFarmRewards })
        }
        if (e.topic === eventIds.FarmMetastate) {
            const { key, value } = e.args

            const periodRewardKey = padRight(asciiToHex('periodReward'), 64)
            if (key === periodRewardKey) {
                const periodReward = defaultAbiCoder.decode(['uint128', 'int128'], value)[0]

                farmMap.set(farmHash, {
                    ...prevFarmState,
                    dailyFarmReward: Number.parseFloat(formatUnits(periodReward, rewardTokenDec)),
                })
            }
        }
    })

    uniqueFarms.forEach((event) => {
        const { farmHash, referredTokenDefn, rewardTokenDefn, sponsor } = event.args
        const farm: Farm = {
            farmHash,
            referredTokenDefn,
            rewardTokenDefn,
            sponsor,
            totalFarmRewards: farmMap.get(farmHash)?.totalFarmRewards || 0,
            dailyFarmReward: farmMap.get(farmHash)?.dailyFarmReward || 0,
        }

        farms.push(farm)
    })

    return farms
}
function parseRewardsHarvestedEvents(unparsed: any) {
    const parsed = parseEvents(unparsed)

    const rewards: Array<RewardsHarvestedEvent> = parsed.map((e) => {
        const { farmHash, caller, rewardTokenDefn, leafHash, value } = e.args
        return { farmHash, caller, rewardTokenDefn, leafHash, value: Number.parseFloat(fromWei(value.toString())) }
    })

    return rewards
}

interface TokenFilter {
    rewardTokens?: ChainAddress[]
    referredTokens?: ChainAddress[]
}
export async function getMyFarms(
    account: string,
    chainId: ChainId,
    filter?: TokenFilter,
): Promise<Array<FarmExistsEvent>> {
    const farmsAddr = REFERRAL_FARMS_V1_ADDR

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
        chainId: [chainId],
    })

    return parseFarmExistsEvents(res.items)
}

export async function getFarmsDeposits(chainId: ChainId): Promise<Array<FarmDepositChange>> {
    const farmsAddr = REFERRAL_FARMS_V1_ADDR

    const res = await queryIndexersWithNearestQuorum({
        addresses: [farmsAddr],
        topics: [eventIds.FarmDepositChange],
        chainId: [chainId],
    })

    return parseFarmDepositChangeEvents(res.items)
}

type FarmsMetaStateMap = Map<string, { dailyFarmReward: string }>
export async function getFarmsMetaState(
    chainId: ChainId,
    farmHashes?: FarmHash[],
): Promise<FarmsMetaStateMap | undefined> {
    const farmsAddr = REFERRAL_FARMS_V1_ADDR

    // Allow filter by farmHash
    let topic2
    if (farmHashes?.length) {
        topic2 = farmHashes.map((farmHash) => farmHash)
    }

    const res = await queryIndexersWithNearestQuorum({
        addresses: [farmsAddr],
        topic1: [eventIds.FarmMetastate],
        topic2,
        chainId: [chainId],
    })

    return parseFarmMetaStateChangeEvents(res.items)
}

export async function getAllFarms(chainId: ChainId, tokenLists?: string[]): Promise<Array<Farm>> {
    const farmsAddr = REFERRAL_FARMS_V1_ADDR

    // Query indexers
    const farmEvents = await queryIndexersWithNearestQuorum({
        addresses: [farmsAddr],
        topic1: [eventIds.FarmExists, eventIds.FarmTokenChange, eventIds.FarmDepositChange, eventIds.FarmMetastate],
        chainId: [chainId],
    })
    // Query tokens
    const tokens = tokenLists?.length ? await TokenList.fetchERC20TokensFromTokenLists(tokenLists, chainId) : []

    return parseBasicFarmEvents(farmEvents.items, tokens)
}
export async function getMyRewardsHarvested(
    account: string,
    chainId: ChainId,
    filter?: { rewardTokens?: ChainAddress[] },
): Promise<Array<RewardsHarvestedEvent>> {
    const farmsAddr = REFERRAL_FARMS_V1_ADDR

    // Allow filtering by reward tokens
    let topic3
    if (filter?.rewardTokens) {
        topic3 = filter.rewardTokens.map((t) => expandBytes24ToBytes32(t))
    }

    // Query indexers
    const res = await queryIndexersWithNearestQuorum({
        addresses: [farmsAddr],
        topic1: [eventIds.RewardsHarvested],
        topic2: [expandEvmAddressToBytes32(account)],
        topic3,
        chainId: [chainId],
    })

    return parseRewardsHarvestedEvents(res.items)
}
