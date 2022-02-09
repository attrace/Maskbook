import { createRenderWithMetadata, createTypedMessageMetadataReader } from '@masknet/shared-base'
import {
    PROPORTIONAL_FARM_REFERRED_TOKEN_DEFN,
    REFERRAL_META_KEY,
    MASK_TOKEN_ADDR,
    ATTR_TOKEN_ADDR,
} from '../constants'
import type {
    ReferralMetaData,
    ChainAddress,
    TokensGroupedByType,
    RewardData,
    Farm,
    FarmExistsEvent,
    FarmMetastate,
    FarmDepositAndMetastate,
    FarmsAPR,
} from '../types'
import { FARM_TYPE } from '../types'
import schema from '../schema.json'
import { defaultAbiCoder } from '@ethersproject/abi'
import { fromWei, keccak256 } from 'web3-utils'
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
    return IconURLS.underReviewLogo
}
export function groupMetaStateForFarms(farmsMetaState: FarmMetastate[], myFarms?: FarmExistsEvent[]) {
    const farms: FarmExistsEvent[] = []
    const farmDailyDepositMap = new Map<string, number>()

    farmsMetaState.forEach((deposit) => {
        const { farmHash, dailyFarmReward } = deposit
        const prevFarmState = farmDailyDepositMap.get(farmHash) || 0

        const DailyFarmReward = prevFarmState + Number(fromWei(dailyFarmReward.toString()))
        farmDailyDepositMap.set(farmHash, DailyFarmReward)
    })

    myFarms?.forEach((farm) => {
        farms.push({ dailyFarmReward: farmDailyDepositMap.get(farm.farmHash) || 0, ...farm })
    })

    return farms
}
export function groupDepositAndMetaStateForFarms(
    farmsMetaState: FarmDepositAndMetastate[],
    myFarms?: FarmExistsEvent[],
) {
    const farms: FarmExistsEvent[] = []
    const farmTotalAndDailyDepositMap = new Map<string, number[]>()

    farmsMetaState.forEach((deposit) => {
        const { farmHash, dailyFarmReward, delta } = deposit
        const prevFarmState = farmTotalAndDailyDepositMap.get(farmHash) || [0]

        const totalFarmRewards = prevFarmState[0] + Number(fromWei(delta.toString()))
        const DailyFarmReward = prevFarmState[1] + Number(fromWei(dailyFarmReward.toString()))

        farmTotalAndDailyDepositMap.set(farmHash, [totalFarmRewards, DailyFarmReward])
    })

    myFarms?.forEach((farm) => {
        farms.push({
            totalFarmRewards: (farmTotalAndDailyDepositMap.get(farm.farmHash) || [0])[0],
            dailyFarmReward: (farmTotalAndDailyDepositMap.get(farm.farmHash) || [0])[1],
            ...farm,
        })
    })

    return farms
}

export function getFarmsRewardData(farms?: Farm[], farmsAPR?: FarmsAPR): RewardData {
    const dailyReward = farms?.reduce(function (previousValue, currentValue) {
        return previousValue + currentValue.dailyFarmReward
    }, 0)
    const totalReward = farms?.reduce(function (previousValue, currentValue) {
        return previousValue + currentValue.totalFarmRewards
    }, 0)

    let apr = 0
    if (farms && farmsAPR) {
        farms.forEach((farm) => {
            const farmAPR = farmsAPR.get(farm.farmHash)?.APR || 0

            apr = apr + farmAPR
        })
    }

    return {
        dailyReward: dailyReward || 0,
        totalReward: totalReward || 0,
        apr: apr * 100,
    }
}

export function groupReferredTokenFarmsByType(chainId?: number, referredToken?: string, farms?: Farm[]) {
    if (!farms?.length || !referredToken || !chainId) {
        return {
            sponsoredFarms: [],
            attrFarms: [],
            maskFarms: [],
        }
    }
    const sponsoredFarms = farms.filter(
        (farm) =>
            farm.farmType === FARM_TYPE.PAIR_TOKEN && farm.referredTokenDefn === toChainAddress(chainId, referredToken),
    )
    const propotionalFarms = farms.filter(
        (farm) =>
            farm.farmType === FARM_TYPE.PROPORTIONAL && farm.tokens?.includes(toChainAddress(chainId, referredToken)),
    )
    const attrFarms = propotionalFarms.filter(
        (farm) => farm.rewardTokenDefn === toChainAddress(chainId, ATTR_TOKEN_ADDR),
    )
    const maskFarms = propotionalFarms.filter(
        (farm) => farm.rewardTokenDefn === toChainAddress(chainId, MASK_TOKEN_ADDR),
    )

    return {
        sponsoredFarms,
        attrFarms,
        maskFarms,
    }
}

export function groupFarmsByType(farms: Farm[], chainId: number) {
    if (!farms?.length) {
        return {
            sponsoredFarms: [],
            attrFarms: [],
            maskFarms: [],
        }
    }
    const sponsoredFarms = farms.filter((farm) => farm.farmType === FARM_TYPE.PAIR_TOKEN)
    const propotionalFarms = farms.filter((farm) => farm.farmType === FARM_TYPE.PROPORTIONAL)
    const attrFarms = propotionalFarms.filter(
        (farm) => farm.rewardTokenDefn === toChainAddress(chainId, ATTR_TOKEN_ADDR),
    )
    const maskFarms = propotionalFarms.filter(
        (farm) => farm.rewardTokenDefn === toChainAddress(chainId, MASK_TOKEN_ADDR),
    )

    return {
        sponsoredFarms,
        attrFarms,
        maskFarms,
    }
}
