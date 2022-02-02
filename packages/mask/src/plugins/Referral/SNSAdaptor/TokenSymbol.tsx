import { useERC20TokenDetailed } from '@masknet/web3-shared-evm'
import { useI18N } from '../../../utils'

import { Typography } from '@mui/material'

export function TokenSymbol({ address }: { address: string }) {
    const { t } = useI18N()
    const { value, loading, error, retry } = useERC20TokenDetailed(address)

    if (!value || value?.symbol === t('unknown')) return <Typography>-</Typography>

    return <Typography>{value.symbol}</Typography>
}
