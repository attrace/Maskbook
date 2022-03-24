import { Trans } from 'react-i18next'
import { isDashboardPage } from '@masknet/shared-base'
import { makeStyles } from '@masknet/theme'

import { useI18N } from '../../../utils'
import { Icons, PageInterface, PagesType } from '../types'

import { Typography, Button, Grid, Box } from '@mui/material'
import { SvgIcons } from './Icons'

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
    icon: {
        width: '36px',
        height: '36px',
        marginRight: '12px',
    },
    dataItem: {
        '& b': {
            fontWeight: 600,
        },
    },
}))

export function Landing(props: PageInterface) {
    const { t } = useI18N()
    const isDashboard = isDashboardPage()
    const { classes } = useStyles({ isDashboard })

    const data = [
        {
            name: t('plugin_referral_refer_to_farm'),
            desc: t('plugin_referral_refer_to_farm_desc'),
            iconUrl: Icons.ReferToFarm,
        },
        {
            name: t('plugin_referral_buy_to_farm'),
            desc: t('plugin_referral_buy_to_farm_desc'),
            iconUrl: Icons.BuyToFarm,
        },
        {
            name: t('plugin_referral_create_farms'),
            desc: t('plugin_referral_create_farms_desc'),
            iconUrl: Icons.CreateFarm,
        },
        {
            desc: (
                <Trans
                    i18nKey="plugin_referral_create_farms_rewards_desc"
                    components={{
                        strong: <strong />,
                    }}
                />
            ),
            iconUrl: Icons.RewardIcon,
        },
    ]

    return (
        <div className={classes.wrapper}>
            <Grid container className={classes.heading} display="flex" justifyContent="center">
                <Grid item xs={12} display="flex" justifyContent="center">
                    <SvgIcons icon={Icons.ReferralIcon} size={60} />
                </Grid>
                <Typography variant="h6" textAlign="center" fontWeight={400}>
                    <b>{t('plugin_referral_referral_farming')}</b>
                    {t('plugin_referral_referral_farms_short_desc')}
                </Typography>
            </Grid>
            <Typography fontWeight={600} variant="h6" marginBottom="16px">
                {t('plugin_referral_how_it_works')}
            </Typography>
            <Grid textAlign="left" direction="row" container className={classes.smallText} rowSpacing="12px">
                {data.map((e, i) => {
                    return (
                        <Grid
                            key={`${e.name}-${i}`}
                            item
                            xs={12}
                            display="flex"
                            alignContent="center"
                            justifyItems="flex-start"
                            className={classes.dataItem}>
                            <Box className={classes.icon}>
                                <SvgIcons icon={e.iconUrl} />
                            </Box>
                            <Typography>
                                <b>{e.name}</b> {e.name && '-'} {e.desc}
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
                        {t('plugin_referral_continue')}
                    </Button>
                </Grid>
            </Grid>
        </div>
    )
}
