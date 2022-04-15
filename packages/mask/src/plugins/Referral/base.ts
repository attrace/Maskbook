import { type Plugin, PluginId } from '@masknet/plugin-infra'

import { META_KEY } from './constants'

export const base: Plugin.Shared.Definition = {
    ID: PluginId.Referral,
    name: { fallback: 'Referral Farms' },
    description: { fallback: 'A plugin for Referral Farms.' },
    publisher: { name: { fallback: 'Mask Network' }, link: 'https://mask.io/' },
    enableRequirement: {
        architecture: { app: true, web: true },
        networks: { type: 'opt-out', networks: {} },
        target: 'stable',
    },
    contribution: { metadataKeys: new Set([META_KEY]) },
}
