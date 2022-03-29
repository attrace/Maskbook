import { PluginId } from '@masknet/plugin-infra'
import { ChainId } from '@masknet/web3-shared-evm'

export const REFERRAL_PLUGIN_NAME = 'Referral'
export const REFERRAL_PLUGIN_ID = PluginId.Referral
export const REFERRAL_META_KEY = `${PluginId.Referral}:1`
export const MASK_REFERRER = '0x172059839d80773eC8617C4CB33835175d364cEE'
export const MASK_SWAP_V1 = 'maskswapv1'
export const ATTRACE_FEE_PERCENT = 5

export const ReferralFarmsV1 = 'ReferralFarmsV1'
export const NATIVE_TOKEN = '0x0000000000000000000000000000000000000000'

export const ZERO_ADDR = '0x0000000000000000000000000000000000000000'
export const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000'

// TODO: change to ChainId.Mainnet before mainnet release
export const supportedChainIds = [ChainId.Rinkeby]

// APR = N/A in the first itaration
export const APR = 'N/A'
