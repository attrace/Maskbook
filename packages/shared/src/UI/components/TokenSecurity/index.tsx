import { Stack, Typography } from '@mui/material'
import { useSharedI18N } from '../../../locales'
import { memo, useMemo, useState } from 'react'
import { DefineMapping, SecurityMessageLevel } from './Common'
import { CheckSecurityDialog } from './CheckSecurityDialog'
import { RightArrowIcon } from '@masknet/icons'
import type { SecurityAPI } from '@masknet/web3-providers'
import type { ChainId } from '@masknet/web3-shared-evm'
import { getMessageList, isHighRisk } from './utils'

interface TokenCardProps {
    tokenSecurity: TokenSecurity
}

export type TokenSecurity = SecurityAPI.ContractSecurity &
    SecurityAPI.TokenSecurity &
    SecurityAPI.TradingSecurity & { contract: string; chainId: ChainId }

export { getMessageList, isHighRisk }

export const TokenSecurityBar = memo<TokenCardProps>(({ tokenSecurity }) => {
    const t = useSharedI18N()
    const [open, setOpen] = useState(false)

    const { riskyFactors, attentionFactors } = useMemo(() => {
        const makeMessageList = getMessageList(tokenSecurity)

        const riskyFactors = makeMessageList.filter((x) => x.level === SecurityMessageLevel.High).length
        const attentionFactors = makeMessageList.filter((x) => x.level === SecurityMessageLevel.Medium).length
        return {
            riskyFactors,
            attentionFactors,
        }
    }, [tokenSecurity])

    return (
        <Stack direction="row" alignItems="center" spacing={1.5}>
            {riskyFactors !== 0 && (
                <Stack
                    direction="row"
                    alignItems="center"
                    borderRadius="4px"
                    padding="4px 8px"
                    bgcolor={DefineMapping[SecurityMessageLevel.High].bgColor}
                    spacing={0.5}>
                    {DefineMapping[SecurityMessageLevel.High].icon(14)}
                    <Typography
                        component="span"
                        fontSize="12px"
                        color={DefineMapping[SecurityMessageLevel.High].titleColor}>
                        {riskyFactors > 1
                            ? t.risky_items({ quantity: riskyFactors.toString() })
                            : t.risky_item({ quantity: riskyFactors.toString() })}
                    </Typography>
                </Stack>
            )}
            {attentionFactors !== 0 && (
                <Stack
                    direction="row"
                    alignItems="center"
                    borderRadius="4px"
                    padding="4px 8px"
                    bgcolor={DefineMapping[SecurityMessageLevel.Medium].bgColor}
                    spacing={0.5}>
                    {DefineMapping[SecurityMessageLevel.Medium].icon(14)}
                    <Typography
                        component="span"
                        fontSize="12px"
                        color={DefineMapping[SecurityMessageLevel.Medium].titleColor}>
                        {attentionFactors > 1
                            ? t.attention_items({ quantity: attentionFactors.toString() })
                            : t.attention_item({ quantity: attentionFactors.toString() })}
                    </Typography>
                </Stack>
            )}
            {(attentionFactors !== 0 || riskyFactors !== 0) && (
                <Stack
                    direction="row"
                    alignItems="center"
                    borderRadius="4px"
                    padding="4px 8px"
                    bgcolor="rgba(28, 104, 243, 0.1)"
                    sx={{ cursor: 'pointer' }}
                    onClick={() => setOpen(true)}
                    spacing={0.5}>
                    <Typography component="span" fontSize="12px" color="#1C68F3">
                        {t.more()}
                    </Typography>
                    <RightArrowIcon sx={{ fontSize: '14px', color: '#1C68F3' }} />
                </Stack>
            )}
            <CheckSecurityDialog tokenSecurity={tokenSecurity} open={open} onClose={() => setOpen(false)} />
        </Stack>
    )
})
