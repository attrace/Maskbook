import type { Discovery } from '../../types'
import { createContract } from '@masknet/web3-shared-evm'
import type Web3 from 'web3'
import type { AbiItem } from 'web3-utils'
import { DAO_ABI } from './abis'

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
    const dao = createContract(web3, daoConfig?.address ?? '', DAO_ABI as AbiItem[])

    const val = await dao?.methods.addresses(key).call()

    // TODO: remove hardcode
    return '0x56c5B893A65033f179910a60243D5f1B75de513A'
}
