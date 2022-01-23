import { useState } from 'react'
import { Typography, Button } from '@mui/material'
// import { ProtocolType } from '../types'
import { useI18N } from '../../../utils'
import { ChainId, useChainId } from '@masknet/web3-shared-evm'
import { isDashboardPage } from '@masknet/shared-base'
import { makeStyles } from '@masknet/theme'
import { PagesType } from '../types'
import { IconURLS } from './IconURL'

interface ReferralDialogProps {
    open: boolean
    onClose?: () => void
    onSwapDialogOpen?: () => void
}
const useStyles = makeStyles<{ isDashboard: boolean }>()((theme, { isDashboard }) => ({
    walletStatusBox: {
        width: 535,
        margin: '24px auto',
    },
    bold: {},
    normal: {},
}))

export function Landing(props) {
    const { t } = useI18N()
    const currentChainId = useChainId()
    const [chainId, setChainId] = useState<ChainId>(currentChainId)
    const isDashboard = isDashboardPage()
    const { classes } = useStyles({ isDashboard })
    // const [selectedProtocol, setSelectedProtocol] = useState<ProtocolType | null>(null)

    return (
        <div>
            <center>{IconURLS.referral}</center>
            <br />
            <Typography variant="h6" textAlign="center">
                <b>{t('plugin_referral')}</b>
                {t('referral_farms_short_desc')}
                <br />
                <br />
                <h4 align="left">{t('how_it_works')}</h4>
                <Button
                    onClick={() => {
                        props.continue(PagesType.LANDING, PagesType.REFERRAL_FARMS)
                    }}
                    variant="contained">
                    Continue
                </Button>
            </Typography>
        </div>
    )
}
