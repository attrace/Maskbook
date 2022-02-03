import { createPluginMessage, createPluginRPC, PluginMessageEmitter } from '@masknet/plugin-infra'
import type { FungibleTokenDetailed } from '@masknet/web3-shared-evm'
import { REFERRAL_META_KEY } from './constants'
import type { ChainAddress } from './types'

export type SelectTokenUpdated =
    | {
          open: true
          uuid: string
          title: string
      }
    | {
          open: false
          uuid: string
          token?: FungibleTokenDetailed
      }

export type SelectTokenToBuy =
    | {
          open: true
          uuid: string
          title: string
          tokensChainAddrs: ChainAddress[]
      }
    | {
          open: false
          uuid: string
          token?: FungibleTokenDetailed
      }

interface ReferralMessages {
    /**
     * Open select token dialog
     */
    selectTokenUpdated: SelectTokenUpdated
    selectTokenToBuy: SelectTokenToBuy

    rpc: unknown
}

if (import.meta.webpackHot) import.meta.webpackHot.accept()
export const PluginReferralMessages: PluginMessageEmitter<ReferralMessages> = createPluginMessage(REFERRAL_META_KEY)
export const PluginReferralRPC = createPluginRPC(
    REFERRAL_META_KEY,
    () => import('./Worker/services'),
    PluginReferralMessages.rpc,
)
