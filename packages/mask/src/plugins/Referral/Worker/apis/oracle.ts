import type { JsonRpcResponse } from 'web3-core-helpers'

const ORACLE_URL = 'https://oracle-4470-dub.attrace.com'

export async function getOracle(): Promise<string> {
    // TODO: add oracle selection
    // const {
    //     discovery: { womOracles },
    // } = await getDiscovery()
    // return womOracles[Math.floor(Math.random() * womOracles.length)].url
    return ORACLE_URL
}

export async function jsonReq(url: string, opts: any) {
    if (!opts?.headers) opts.headers = {}

    Object.assign(opts.headers, { 'content-type': 'application/json' })
    const res = await fetch(url, opts)

    if (res.status !== 200) {
        throw new Error(res.statusText)
    }

    const json: JsonRpcResponse = await res.json()
    if (json.error) {
        throw new Error(`Code: ${json.error.code}. ${json.error?.message || ''}`)
    }

    return json
}

/**
 *
 * @param host url of the Oracle
 * @param method get/post/put
 * @param params params
 * @param porRequest true if this is Proof of Recommendations request (requires different route for max uptime)
 * @returns result of request
 */
export async function rpcCall(host: string, method: string, params: any, porRequest = false) {
    const url = porRequest ? `${host}/v1/rpc` : `${host}/v1/recommendations/rpc`
    const res = await jsonReq(url, {
        method: 'POST',
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: crypto.randomUUID(),
            method,
            params: params || [],
        }),
    })

    return res
}
