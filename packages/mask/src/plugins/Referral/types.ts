import type { ChainId as ChainIdMain, FungibleTokenDetailed } from '@masknet/web3-shared-evm'
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
    ADJUST_REWARDS = 'Adjust Rewards',
    DEPOSIT = 'Deposit',
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
    referral_token_chain_id: ChainId
    promoter_address?: string
    sender: string
}

// TODO: add new approach to render svg
export enum Icons {
    ReferralIcon = 0,
    SponsoredFarmIcon = 1,
    ReferToFarm = 2,
    CreateFarm = 3,
    BuyToFarm = 4,
    RewardIcon = 5,
    AttrTextIcon = 6,
}
export interface RewardData {
    apr: number
    dailyReward: number
    totalReward: number
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

export interface DepositProps {
    totalFarmReward: string
    tokenSymbol?: string
    attraceFee: BigNumber
    requiredChainId: ChainId
    onDeposit: () => Promise<void>
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
    dailyFarmReward: number
}
export interface FarmDepositAndMetastate {
    farmHash: FarmHash
    delta: BigNumber
    dailyFarmReward: BigNumber
}
export interface FarmTokenChange {
    farmHash: FarmHash
    token: ChainAddress
}
export interface RewardsHarvestedEvent {
    farmHash: FarmHash
    caller: EvmAddress
    rewardTokenDefn: ChainAddress
    value: number
    leafHash: string
}
export interface FarmEvent extends FarmExistsEvent, FarmDepositChange {}

export interface Farm extends FarmExistsEvent {
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

interface AdjustFarm extends FarmExistsEvent {
    totalFarmRewards?: number
    apr?: number
}

export interface AdjustFarmRewardsInterface extends PageInterface {
    farm?: AdjustFarm
    rewardToken?: FungibleTokenDetailed
    referredToken?: FungibleTokenDetailed
}

export interface DepositDialogInterface {
    deposit?: DepositProps
}

type TransactionProps =
    | {
          status: TransactionStatus.CONFIRMATION
          title: string
          subtitle?: string
      }
    | {
          status: TransactionStatus.CONFIRMED
          actionButton: {
              label: string
              onClick: (token?: FungibleTokenDetailed) => void
          }
          transactionHash: string
      }
    | {
          status: TransactionStatus.FAILED
          actionButton: {
              label: string
              onClick: () => void
          }
          subtitle?: string
      }

export interface TransactionDialogInterface {
    onClose?: () => void
    transaction?: TransactionProps
}

export interface DialogInterface {
    hideBackBtn?: boolean
    hideAttrLogo?: boolean
    adjustFarmDialog?: AdjustFarmRewardsInterface
    depositDialog?: DepositDialogInterface
    transactionDialog?: TransactionDialogInterface
}

export interface PageInterface {
    pageType?: PagesType
    onClose?: () => void
    continue: (currentPage: PagesType, nextPage: PagesType, title?: string, props?: DialogInterface) => void
    onChangePage?: (page: PagesType, title?: string, props?: DialogInterface) => void
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

export enum SearchFarmTypes {
    allFarms = '0',
    sponsoredFarm = 'sponsoredFarmTokens',
    maskFarm = 'maskFarmsTokens',
    attrFarm = 'attrFarmsTokens',
}

// effects
export type VerifierEffect = { nonce: number; proof: string[] }
export type FarmRewardStruct = {
    farmHash: FarmHash
    value: {
        type: 'string'
        hex: string
    }
}
export type HarvestRequest = {
    rewardTokenDefn: ChainAddress
    rewards: FarmRewardStruct[]
}
export type RewardProof = {
    sender: EvmAddress
    effect: VerifierEffect
    req: HarvestRequest
    leafHash: string
}

export enum RpcMethod {
    oracle_chainId = 'oracle_chainId',
    oracle_getDerivedBlockByHash = 'oracle_getDerivedBlockByHash',
    oracle_getBundleReceipt = 'oracle_getBundleReceipt',
    oracle_getDerivedBlockByNumber = 'oracle_getDerivedBlockByNumber',
    oracle_getOperationalAddress = 'oracle_getOperationalAddress',
    oracle_getTimePromise = 'oracle_getTimePromise',
    oracle_sendProofOfRecommendationOrigin = 'oracle_sendProofOfRecommendationOrigin',
    oracle_sendProofOfRecommendation = 'oracle_sendProofOfRecommendation',
}
export type JsonRpcRequestId = number | string
export interface JsonRpcResponse {
    jsonrpc: '2.0'
    // Has a value for successful requests, might have a value for failed requests
    id: JsonRpcRequestId | null
    // If result has a value, it indicates success
    result?: any
    // If error has a value, indicates failure
    error?: {
        code: number // Json Rpc compatible code
        message: string
        data?: any
    }
}
