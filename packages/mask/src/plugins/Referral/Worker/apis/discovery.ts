import type { Discovery } from '../../types'
import { createContract } from '@masknet/web3-shared-evm'
import type Web3 from 'web3'
import type { AbiItem } from 'web3-utils'

const daoABI = ['function addresses(string key) view returns (address addr)']
const daoABIT = [
    {
        inputs: [
            {
                internalType: 'string',
                name: 'key',
                type: 'string',
            },
        ],
        name: 'addresses',
        outputs: [
            {
                internalType: 'address',
                name: 'addr',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
]

export async function getDiscovery(): Promise<{
    discovery: Discovery
    pop: string
}> {
    const response = await fetch('https://discovery.attrace.com/mainnet/full.json')

    const discovery = await response.json()
    const pop = response.headers.get('x-amz-cf-pop') || ''
    return {
        discovery,
        pop,
    }
}
export async function getDaoAddress(web3: Web3, key: string, chainId: number) {
    const {
        discovery: { daos },
    } = await getDiscovery()

    const daoConfig = daos.filter((d) => d.chainId === chainId)[0]
    const dao = createContract(web3, daoConfig?.address ?? '', daoABIT as AbiItem[])

    const val = await dao?.methods.addresses(key).call()

    return val
}
