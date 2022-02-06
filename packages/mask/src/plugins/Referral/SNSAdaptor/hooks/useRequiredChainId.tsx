import type { ChainId } from '@masknet/web3-shared-evm'

import { PluginId, useActivatedPlugin, usePluginIDContext } from '@masknet/plugin-infra'
import { useState } from 'react'

export function useRequiredChainId(currentChainId: ChainId) {
    const Referral_Definition = useActivatedPlugin(PluginId.Referral, 'any')
    const pluginId = usePluginIDContext()
    const chainIdList = Referral_Definition?.enableRequirement.web3?.[pluginId]?.supportedChainIds ?? []

    const [requiredChainId, setRequiredChainId] = useState(
        chainIdList.includes(currentChainId) ? currentChainId : chainIdList[0],
    )
    return requiredChainId
}
