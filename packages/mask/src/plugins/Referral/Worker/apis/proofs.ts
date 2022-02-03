import { getAddress } from '@ethersproject/address'

import { MASK_REFERRER, ZERO_HASH, ZERO_ADDR } from '../../constants'
import {
    postToWomOracle,
    getWomOracle,
    createLegacyProofOfRecommandationOriginMessage,
    createLegacyProofOfRecommandationMessage,
} from './wom'

import type Web3 from 'web3'
import type { EvmAddress } from '../../types'

// create proof by referrer, referrer = ZERO_ADDR
export async function singAndPostProofOrigin(web3: Web3, account: string, token: string, dapp = '') {
    const host = await getWomOracle()

    const { time, sig: timePromise } = await postToWomOracle(host, '/v4/time-promise', {
        signer: account,
        token,
        dapp: ZERO_HASH,
        referrer: ZERO_ADDR,
        router: MASK_REFERRER,
    })
    const sig = await web3.eth.personal.sign(
        createLegacyProofOfRecommandationOriginMessage(account, token, time, MASK_REFERRER, timePromise),
        account,
        '',
    )

    // Post signed proof of recommendation origin
    await postToWomOracle(host, '/v4/proofs', {
        data: {
            signer: getAddress(account),
            token: getAddress(token),
            referrer: ZERO_ADDR,
            dapp: ZERO_HASH,
            router: getAddress(MASK_REFERRER),
            time,
            timePromise,
            sig,
        },
        linkReferrer: document.referrer,
    })
}

// similar to singAndPostProofOrigin, only we pass in the referral and sign by the participant instead, referrer = Promoter addr
export async function singAndPostProofWithReferrer(
    web3: Web3,
    account: string,
    token: EvmAddress,
    referrer: EvmAddress,
) {
    console.log(token, referrer)
    // Interact with a single oracle
    const host = await getWomOracle()
    const dapp = ZERO_HASH
    // Collect a time promise
    const { time, sig: timePromise } = await postToWomOracle(host, '/v4/time-promise', {
        signer: account,
        token,
        dapp,
        referrer,
        router: MASK_REFERRER,
    })

    const sig = await web3.eth.personal.sign(
        createLegacyProofOfRecommandationMessage(account, token, time, referrer, dapp, MASK_REFERRER, timePromise),
        account,
        '',
    )

    // Post signed proof of recommendation
    await postToWomOracle(host, '/v4/proofs', {
        data: {
            signer: getAddress(account),
            token: getAddress(token),
            referrer: getAddress(referrer),
            dapp,
            router: getAddress(MASK_REFERRER),
            time,
            timePromise,
            sig,
        },
        // Set linkReferrer to request Referer header, who linked into the extension. Capture this by storing inbound referrer (document.referrer for sites) in some session storage when the user arrives into the app.
        linkReferrer: document.referrer,
    })
}
