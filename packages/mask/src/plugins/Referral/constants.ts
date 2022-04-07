import { PluginId } from '@masknet/plugin-infra'
import { ChainId } from '@masknet/web3-shared-evm'

export const REFERRAL_PLUGIN_NAME = 'Referral'
export const REFERRAL_PLUGIN_ID = PluginId.Referral
export const REFERRAL_META_KEY = `${PluginId.Referral}:1`
export const MASK_REFERRER = '0x172059839d80773eC8617C4CB33835175d364cEE'
export const MASK_SWAP_V1 = 'maskswapv1'
export const ATTRACE_FEE_PERCENT = 5

export const REFERRAL_FRAMS_V1 = 'ReferralFarmsV1'

export const NATIVE_TOKEN = '0x0000000000000000000000000000000000000000'
export const ZERO_ADDR = '0x0000000000000000000000000000000000000000'
export const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000'

// TODO: change to Mainnet before mainnet release
export const supportedChainIds = [ChainId.Rinkeby]
export const REFERRAL_FRAMS_V1_ADDR = '0xae450b836C61AcE60e5017f6ba48d468115b349d'
export const CONFIRMATION_V1_ADDR = '0x28D2C20Dd2A8ad4E299C77Dc722e3bA919BAEE05'

// APR = N/A in the first itaration
export const APR = 'N/A'
