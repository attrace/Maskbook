import type { Plugin } from '@masknet/plugin-infra'
import { REFERRAL_META_KEY, REFERRAL_PLUGIN_ID } from './constants'

export const base: Plugin.Shared.Definition = {
    ID: REFERRAL_PLUGIN_ID,
    icon: '\u{1F4B0}',
    name: { fallback: 'Referral' },
    description: {
        fallback: 'A plugin for Referral Farms',
    },
    publisher: { name: { fallback: 'Mask Network' }, link: 'https://mask.io/' },
    enableRequirement: {
        architecture: { app: true, web: true },
        networks: { type: 'opt-out', networks: {} },
        target: 'stable',
    },

    contribution: { metadataKeys: new Set([REFERRAL_META_KEY]) },
}
