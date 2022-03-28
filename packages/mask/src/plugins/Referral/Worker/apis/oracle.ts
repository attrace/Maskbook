import { monotonicFactory } from 'ulid'

import { getDiscovery } from './discovery'

// Select a oracle
// TODO: add oracle selection
export async function getOracle(): Promise<string> {
    const {
        discovery: { womOracles },
    } = await getDiscovery()
    // return womOracles[Math.floor(Math.random() * womOracles.length)].url
    return 'https://oracle-4470-dub.attrace.com'
}

export async function jsonReq(url: string, opts: any) {
    if (!opts?.headers) opts.headers = {}

    Object.assign(opts.headers, { 'content-type': 'application/json' })
    const res = await fetch(url, opts)

    if (res.status !== 200) {
        throw new Error(res.statusText)
    }
    const json = await res.json()

    return json
}

export async function rpcCall(host: string, method: string, params: any) {
    const ulid = monotonicFactory()
    const res = await jsonReq(`${host}/v1/rpc`, {
        method: 'POST',
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: ulid(),
            method,
            params: params || [],
        }),
    })

    return res
}
