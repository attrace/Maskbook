import type { ChainId as ChainIdMain } from '@masknet/web3-shared-evm'
import type BigNumber from 'bignumber.js'
import { padStart } from 'lodash-unified'

export interface ReferralNetwork {
    chainId: ChainIdMain
    chainName: string
}

export enum ProtocolCategory {
    ETH = 'eth',
}

export enum ProtocolType {
    Lido = 0,
}

export enum TokenType {
    REFER = 0,
    REWARD = 1,
}

export enum PagesType {
    LANDING = 'landing',
    REFERRAL_FARMS = 'Referral Farms',
    CREATE_FARM = 'Create Farm',
    REFER_TO_FARM = 'Refer to Farm',
    BUY_TO_FARM = 'Buy to Farm',
    SELECT_TOKEN = 'Select a Token to Refer',
    TRANSACTION = 'Transaction',
}
export enum TabsReferralFarms {
    TOKENS = 'Crypto Tokens',
    NFT = 'NFTs',
}

export enum TabsCreateFarm {
    NEW = 'New',
    CREATED = 'Created',
}

export enum TabsReferAndBuy {
    NEW = 'New',
    MY_FARMS = 'My Farms',
}
export interface ReferralMetaData {
    referral_token: string
    referral_token_name: string
    referral_token_symbol: string
    referral_token_icon: string | string[]
    sender: string
}
export interface RewardData {
    apr: string
    daily_reward: string
    total_reward: string
}
export interface PageHistory {
    page: PagesType
    title: string
}
export interface MetastateKeyValue {
    key: string

    // Value is the output of coder.encode([...types], [...values])
    value: string
}
export type Metastate = Array<MetastateKeyValue>

export const ReferralFarmsV1 = 'ReferralFarmsV1'

// uint32 integer which represents the network the token is on.
// Eg: 1 for eth-mainnet, 4 for eth-rinkeby, 137 for polygon-mainnet, ...
// Find more on https://chainlist.org/
export type ChainId = number

// 20-byte hex-encoded "normal" Ethereum Virtual Machine public address.
// Eg: 0xaa97fed7413a944118db403ce65116dcc4d381e2
export type EvmAddress = string

// 32-byte hex-encoded string
// Eg: 0x46401a1ea83c45ef34b64281c8161df97eaf1b1b25ed2a5866c7dc6a1503150f
export type Bytes32 = string

// 24-byte hex-encoded string
// Eg: 0x34b64281c8161df97eaf1b1b25ed2a5866c7dc6a1503150f
export type Bytes24 = string

// 24-byte hex-encoded structure which encodes chainId and EvmAddress (or others) into one addressable value while keeping them recognizable and searchable.
// Limited to uint32 chainIds, which includes most of the blockchain networks. [See full list](https://chainlist.org/)
// Eg: 0x00000001aa97fed7413a944118db403ce65116dcc4d381e2
export type ChainAddress = Bytes24

// 32-byte hex-encoded hash of encode(sponsor,rewardToken,referredTokenDefn)
// Eg: 0x7a0bb0f2ee16291cee6e20dfa60968dbb7da4d3b3305bcaeedd5412603ef83b3
export type FarmHash = string

// short string which sends the dapp to a specific target and allows routing around breaking external dapp upgrades without impacting existing links.
// Eg: univ2charts, maskswapv1
export type RedirectTarget = string

// Simple http... string link
// Eg: https://app.attrace.com/l/...
export type Link = string

// A single metastate key-value object

export interface FarmExistsEvent {
    farmHash: FarmHash
    referredTokenDefn: ChainAddress
    rewardTokenDefn: ChainAddress
    sponsor: EvmAddress
}
export interface FarmDepositChange {
    farmHash: FarmHash
    delta: BigNumber
}
export interface FarmMetastate {
    farmHash: FarmHash
    dailyFarmReward: BigNumber
}
export interface FarmTokenChange {
    farmHash: FarmHash
    token: ChainAddress
}
export interface FarmEvent extends FarmExistsEvent, FarmDepositChange {}

export enum FARM_TYPE {
    PAIR_TOKEN = 'PAIR_TOKEN', // named after uniswapv2 pairs, where a pair represents a token pair liquidity pool, in our case it represents a token pair referral farm, no DEX value conversion happens to calculate position in the farm
    PROPORTIONAL = 'PROPORTIONAL', // where multiple referred tokens are watched for added value, complex DEX value conversion happens to calculate proportional position compared to other farm participants
}

export interface Farm extends FarmExistsEvent {
    tokens?: ChainAddress[]
    farmType: FARM_TYPE
    // sum of all delta in FarmDepositChange event
    totalFarmRewards: number
    dailyFarmReward: number
}

export type Node = {
    url: string
    location: Geolocation
}
export type Geolocation = {
    lat: number
    lon: number
}
export type Dao = {
    chainId: number
    address?: string
    startBlockNumber: number
}
export type Airport = {
    iata: string
    lat: number
    lon: number
}
export type Discovery = {
    daos: Dao[]
    indexers: Node[]
    womOracles: Node[]
    airports: Airport[]
}

export function toLinkUrlV1(token: EvmAddress, referrer: EvmAddress, dapp: RedirectTarget = ''): Link {
    const version = padStart(Number(1).toString(16), 2, '0')
    if (dapp && dapp.length > 31) {
        // TODO throw when dapp not [a-zA-Z0-9_.]
        throw new Error('dapp should be below 31 char')
    }
    return `https://app.attrace.com/l/${version}${token.substring(2).toLowerCase()}${referrer
        .substring(2)
        .toLowerCase()}${dapp.length > 0 ? `?d=${encodeURIComponent(dapp)}` : ''}`
}

export interface LinkParams {
    referrer: EvmAddress
    token: EvmAddress
    dapp: string
}

// This assumes a link in style of https://app.attrace.com/l/011f9840a85d5af5bf1d1762f925bdaddc4201f9849a24fe8179a0aa7347f6f9b664f0e3f573212a6d?d=maskswapv1
export function parseLinkUrlPath(fullUrlPath: string) {
    // const { pathname, query } = urlParse(fullUrlPath, true);
    // // Strip off the '/l/
    // const str = pathname.substring(3);
    // // Read the version
    // const version = parseInt(str.substring(0, 2), 16);
    // // Read the token
    // const token = '0x' + str.substring(2,42);
    // // Read the referrer
    // const referrer = '0x' + str.substring(42,82);
    // return {
    //   referrer,
    //   token,
    //   dapp: query.d || null,
    // }
}

export function expandEvmAddressToBytes32(addr: EvmAddress): Bytes32 {
    return `0x000000000000000000000000${addr.substring(2)}`.toLowerCase()
}
export function expandBytes24ToBytes32(b24: Bytes24): Bytes32 {
    return `0x${b24.substring(2)}0000000000000000`.toLowerCase()
}
export function toEvmAddress(addr: ChainAddress): EvmAddress {
    return `0x${addr.substring(2 + 4 * 2)}`
}
export function toChainId(addr: ChainAddress): number {
    return Number.parseInt(addr.substring(2, 2 + 4 * 2), 16)
}

interface ChainAddressProps {
    chainId: number
    address: EvmAddress
    isNative: boolean
}
export function parseChainAddress(chaddr: ChainAddress): ChainAddressProps {
    const chainId = toChainId(chaddr)
    const address = toEvmAddress(chaddr)
    const isNative = chainId === Number.parseInt(address.substring(2 + 16 * 2), 16)
    return {
        chainId,
        address,
        isNative,
    }
}

export enum TransactionStatus {
    CONFIRMATION = 'Confirmation',
    CONFIRMED = 'CONFIRMED',
    FAILED = 'FAILED',
}

export type TokensGroupedByType = {
    sponsoredFarmTokens: string[]
    maskFarmsTokens: string[]
    attrFarmsTokens: string[]
}

export type Proof = {
    id: string
    signer: EvmAddress
    token: EvmAddress
    referrer: EvmAddress
    router: string
    dapp: string
    t: number
    data: string
    reqCtx: string
    reqId: string
}
