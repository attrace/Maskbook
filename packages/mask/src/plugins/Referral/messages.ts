import { createPluginMessage, createPluginRPC } from '@masknet/plugin-infra'
import { REFERRAL_META_KEY } from './constants'

if (import.meta.webpackHot) import.meta.webpackHot.accept()
const PluginSavingsMessages = createPluginMessage(REFERRAL_META_KEY)
export const PluginSavingsRPC = createPluginRPC(
    REFERRAL_META_KEY,
    () => import('./Worker/services'),
    PluginSavingsMessages.rpc,
)
