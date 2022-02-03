import { PluginId } from '@masknet/plugin-infra'
import { asciiToHex, padRight } from 'web3-utils'

export const REFERRAL_PLUGIN_NAME = 'Referral'
export const REFERRAL_PLUGIN_ID = PluginId.Referral
export const REFERRAL_META_KEY = `${PluginId.Referral}:1`
export const MASK_REFERRER = '0x172059839d80773eC8617C4CB33835175d364cEE'
export const MASK_SWAP_V1 = 'maskswapv1'

export const ReferralFarmsV1 = 'ReferralFarmsV1'
export const NATIVE_TOKEN = '0x0000000000000000000000000000000000000000'

export const ZERO_ADDR = '0x0000000000000000000000000000000000000000'
export const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000'

export const PROPORTIONAL_FARM_REFERRED_TOKEN_DEFN = padRight(asciiToHex('prorate'), 64).substring(0, 2 + 24 * 2)

// TODO: get ADDR FOR CURRENT CHAIN ID
export const MASK_TOKEN_ADDR = '0xFD9Eb54f6aC885079e7bB3E207922Bb7256E3fcb'
export const ATTR_TOKEN_ADDR = '0x926362b451a012f72b34240f36c3bdc163d462e0'
