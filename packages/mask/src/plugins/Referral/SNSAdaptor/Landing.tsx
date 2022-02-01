import { useState } from 'react'
import { Typography, Button, Grid } from '@mui/material'
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
    wrapper: {
        padding: theme.spacing(3, 0, 3),
    },
    walletStatusBox: {
        width: 535,
        margin: '24px auto',
    },
    img: {
        width: 50,
        marginRight: 4,
        justifyContent: 'center',
        display: 'flex',
    },
    smallText: {
        fontSize: '15px',
    },
}))
const data = [
    {
        name: 'Refer to Farm',
        desc: 'earn farming rewards for tokens purchased via your referrals.',
    },
    {
        name: 'Buy to Farm',
        desc: 'buy & hold sponsored tokens and earn farming rewards.',
    },
    {
        name: 'Manage Farms',
        desc: 'incentivize referrals for the purchase of crypto tokens or NFT collection.',
    },
]
export function Landing(props) {
    const { t } = useI18N()
    const currentChainId = useChainId()
    const [chainId, setChainId] = useState<ChainId>(currentChainId)
    const isDashboard = isDashboardPage()
    const { classes } = useStyles({ isDashboard })
    // const [selectedProtocol, setSelectedProtocol] = useState<ProtocolType | null>(null)

    return (
        <div className={classes.wrapper}>
            <Grid container>
                <Grid xs={12} display="flex" justifyContent="center">
                    <img className={classes.img} src={IconURLS.referral} />
                </Grid>
            </Grid>
            <br />
            <Typography variant="h6" textAlign="center">
                <b>{t('plugin_referral')}</b>
                {t('referral_farms_short_desc')}
                <br />
                <br />
                <h4 align="left">{t('how_it_works')}</h4>
                <Grid textAlign="left" direction="row" container className={classes.smallText} rowSpacing="10px">
                    {data.map((e) => {
                        return (
                            <Grid key={e.name} item xs={12} alignContent="flex-start" justifyItems="flex-start">
                                <b>{e.name}</b> -{e.desc}
                            </Grid>
                        )
                    })}
                    <Grid item xs={12} direction="row" textAlign="right">
                        <Button
                            onClick={() => {
                                props.continue(PagesType.LANDING, PagesType.REFERRAL_FARMS)
                            }}
                            variant="contained">
                            Continue
                        </Button>
                    </Grid>
                </Grid>
            </Typography>
        </div>
    )
}
