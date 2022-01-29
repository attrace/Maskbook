import { getDiscovery } from './discovery'

// Select a wom oracle
export async function getWomOracle(): Promise<string> {
    const {
        discovery: { womOracles },
    } = await getDiscovery()
    return womOracles[Math.floor(Math.random() * womOracles.length)].url
}

export async function postToWomOracle(oracle: string, urlPath: string, body: any): Promise<WomResponse> {
    // oracle = 'http://localhost:3000'; // testing url TODO disable!
    const res = await fetch(`${oracle}${urlPath}`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify(body),
    })
    if (res.status !== 200) {
        throw new Error(res.statusText)
    }
    const val = await res.json()
    return val
}

export function createLegacyProofOfRecommandationOriginMessage(
    signer: string,
    token: string,
    time: number,
    router: string,
    timePromise: string,
): string {
    const preEip721FormatRecommendationOrigin = [
        'Sign this message to register for rewards.',
        '',
        "This won't cost you any Ether.",
        '',
        `Signer: ${signer.toLowerCase()}`,
        `Token: ${token.toLowerCase()}`,
        `Time: ${time}`,
        '',
        `Context: ${router.toLowerCase()},${timePromise}`,
    ].join('\n')

    return preEip721FormatRecommendationOrigin
}

export function createLegacyProofOfRecommandationMessage(
    signer: string,
    token: string,
    time: number,
    referrer: string,
    dapp: string,
    router: string,
    timePromise: string,
): string {
    const preEip721FormatRecommendation = [
        'Sign this message to register for rewards.',
        '',
        "This won't cost you any Ether.",
        '',
        `Signer: ${signer.toLowerCase()}`,
        `Token: ${token.toLowerCase()}`,
        `Time: ${time}`,
        '',
        `Context: ${dapp},${referrer.toLowerCase()},${router.toLowerCase()},${timePromise}`,
    ].join('\n')

    return preEip721FormatRecommendation
}
