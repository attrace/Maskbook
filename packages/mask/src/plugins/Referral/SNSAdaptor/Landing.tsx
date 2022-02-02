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
        fontSize: '16px',
    },
    heading: {
        background: theme.palette.background.default,
        height: '174px',
        padding: theme.spacing(3, 4, 3),
        borderRadius: '8px',
        marginBottom: '24px',
    },
    headingText: {
        fontSize: '18px',
        lineHeight: '25px',
    },
    subTitle: {
        fontSize: '18px',
        marginBottom: '16px',
    },
    walletStatusBox: {
        width: 535,
        margin: '24px auto',
    },
    img: {
        height: 60,
        width: 60,
        justifyContent: 'center',
        display: 'flex',
        marginBottom: '16px',
    },
    smallText: {
        fontSize: '15px',
    },
    dataItem: {
        '& b': {
            fontWeight: 600,
        },
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
export interface LandingProps {
    continue: (currentPage: PagesType, nextPage: PagesType) => void
}

export function Landing(props: LandingProps) {
    const { t } = useI18N()
    const currentChainId = useChainId()
    const [chainId, setChainId] = useState<ChainId>(currentChainId)
    const isDashboard = isDashboardPage()
    const { classes } = useStyles({ isDashboard })
    // const [selectedProtocol, setSelectedProtocol] = useState<ProtocolType | null>(null)

    return (
        <div className={classes.wrapper}>
            <Grid container className={classes.heading} display="flex" justifyContent="center">
                <Grid item xs={12} display="flex" justifyContent="center">
                    <img className={classes.img} src={IconURLS.referral} />
                </Grid>
                <Typography className={classes.headingText} textAlign="center" fontWeight={400}>
                    <b>{t('plugin_referral_referral_farming')}</b>
                    {t('plugin_referral_referral_farms_short_desc')}
                </Typography>
            </Grid>
            <Typography fontWeight={600} className={classes.subTitle}>
                {t('plugin_referral_how_it_works')}
            </Typography>
            <Grid textAlign="left" direction="row" container className={classes.smallText} rowSpacing="12px">
                {data.map((e) => {
                    return (
                        <Grid
                            key={e.name}
                            item
                            xs={12}
                            alignContent="flex-start"
                            justifyItems="flex-start"
                            className={classes.dataItem}>
                            <Typography>
                                <b>{e.name}</b> - {e.desc}
                            </Typography>
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
        </div>
    )
}
