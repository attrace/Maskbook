import type { ChainId } from '@masknet/web3-shared-evm'

import { PluginId, useActivatedPlugin, usePluginIDContext } from '@masknet/plugin-infra'
import { useState } from 'react'
import { supportedChainIds } from '../../constants'

export function useRequiredChainId(currentChainId: ChainId) {
    const Referral_Definition = useActivatedPlugin(PluginId.Referral, 'any')
    const pluginId = usePluginIDContext()

    const [requiredChainId, setRequiredChainId] = useState(
        supportedChainIds.includes(currentChainId) ? currentChainId : supportedChainIds[0],
    )
    return requiredChainId
}
