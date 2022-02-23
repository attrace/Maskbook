import type { EvmAddress, RewardProof } from '../../types'

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

// fetch user rewards
export async function getAccountRewardsProofs(account: EvmAddress): Promise<RewardProof[] | undefined> {
    const urlPath = `v1/proofs?sender=${account}`

    const res = await getFromVerifier(urlPath)

    return res?.proofs
}
