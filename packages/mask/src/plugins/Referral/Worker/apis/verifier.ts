import type { ChainAddress, EvmAddress, FarmsAPR, RewardProof } from '../../types'

import { fromWei } from 'web3-utils'
import { PROPORTIONAL_FARM_REFERRED_TOKEN_DEFN } from '../../constants'

// TODO: replace to real API
const VERIFIER_BASE_URL = 'https://verifier0.test.attrace.com/'

export async function getFromVerifier(urlPath: string): Promise<any> {
    const res = await fetch(`${VERIFIER_BASE_URL}${urlPath}`)
    if (res.status !== 200) {
        throw new Error(res.statusText)
    }
    const val = await res.json()
    return val
}

// fetch farms positions
type FarmPosition = {
    state: {
        sponsor: EvmAddress
        rewardTokenDefn: ChainAddress
        referredTokenDefn: ChainAddress
        farmHash: string
        rewardDeposit: string
        metaState: {
            key: string
            value: string
        }
        tokens?: ChainAddress[]
    }
    APR?: string
}
export async function getFarmsPositions(sponsor?: EvmAddress): Promise<{ farms: FarmPosition[] } | undefined> {
    const urlPath = `v1/farm-positions${sponsor ? `?sponsor=${sponsor}` : ''}`

    const res = await getFromVerifier(urlPath)
    return res
}

export async function getReferredTokensAPR({
    excludeProportionalFarms,
    sponsor,
}: {
    excludeProportionalFarms?: boolean
    sponsor?: EvmAddress
}) {
    const referredTokensMap = new Map<ChainAddress, { APR?: number }>()
    const res = await getFarmsPositions(sponsor)

    if (!res?.farms) {
        return referredTokensMap
    }

    res.farms.forEach((farm) => {
        const { referredTokenDefn } = farm.state

        // Pair farms
        if (referredTokenDefn !== PROPORTIONAL_FARM_REFERRED_TOKEN_DEFN) {
            const prevReferredTokenState = referredTokensMap.get(referredTokenDefn)?.APR || 0

            const currentAPR = farm?.APR ? Number(fromWei(farm.APR)) : 0
            const totalAPR = prevReferredTokenState + currentAPR
            referredTokensMap.set(referredTokenDefn, { APR: totalAPR })
        }

        // Proportional farms
        if (
            !excludeProportionalFarms &&
            referredTokenDefn === PROPORTIONAL_FARM_REFERRED_TOKEN_DEFN &&
            farm.state.tokens
        ) {
            farm.state.tokens.forEach((tokenDef) => {
                const prevReferredTokenState = referredTokensMap.get(tokenDef)?.APR || 0

                const currentAPR = farm?.APR ? Number(fromWei(farm.APR)) : 0
                const totalAPR = prevReferredTokenState + currentAPR
                referredTokensMap.set(tokenDef, { APR: totalAPR })
            })
        }
    })

    return referredTokensMap
}

export async function getFarmsAPR({ sponsor }: { sponsor?: EvmAddress }): Promise<FarmsAPR> {
    const farmsMap = new Map<string, { APR?: number }>()
    const res = await getFarmsPositions(sponsor)

    if (!res?.farms) {
        return farmsMap
    }

    res.farms.forEach((farm) => {
        const { farmHash } = farm.state

        const preFarmState = farmsMap.get(farmHash)?.APR || 0

        const currentAPR = farm?.APR ? Number(fromWei(farm.APR)) : 0
        const totalAPR = preFarmState + currentAPR
        farmsMap.set(farmHash, { APR: totalAPR })
    })

    return farmsMap
}

// fetch user rewards
export async function getAccountRewardsProofs(account: EvmAddress): Promise<RewardProof[] | undefined> {
    const urlPath = `v1/proofs?sender=${account}`

    const res = await getFromVerifier(urlPath)

    return res?.proofs
}
