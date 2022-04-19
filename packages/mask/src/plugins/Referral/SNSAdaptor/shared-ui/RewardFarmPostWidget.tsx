import { Typography, Grid } from '@mui/material'
import { makeStyles } from '@masknet/theme'
import { isDashboardPage } from '@masknet/shared-base'

import { useI18N } from '../../../../utils'
import { APR } from '../../constants'
import type { Icons, RewardData } from '../../types'

import { SvgIcons } from '../Icons'

const useStyles = makeStyles<{ isDashboard: boolean }>()((theme, { isDashboard }) => ({
    dataContainer: {
        flexFlow: 'wrap',
    },
}))

export interface RewardFarmPostWidgetProps extends React.PropsWithChildren<{}> {
    title?: string
    icon?: Icons
    rewardData?: RewardData
    tokenSymbol?: string
}

export function RewardFarmPostWidget({ title, icon, rewardData, tokenSymbol }: RewardFarmPostWidgetProps) {
    const { t } = useI18N()
    const isDashboard = isDashboardPage()
    const { classes } = useStyles({ isDashboard })

    return (
        <Grid container marginTop="24px">
            {title && (
                <Grid item xs={12} container marginBottom="12px" alignItems="center">
                    <SvgIcons icon={icon} />
                    <Grid item paddingX={1}>
                        <Typography fontWeight={600}>{title}</Typography>
                    </Grid>
                </Grid>
            )}
            <Grid container display="flex" flexDirection="column" className={classes.dataContainer}>
                <Grid item xs={12} display="flex" alignItems="center">
                    <Typography fontWeight={600}>
                        {t('plugin_referral_apr')}: {rewardData ? APR : '-'}
                    </Typography>
                </Grid>
                <Grid item xs={12} display="flex" alignItems="center">
                    <Typography fontWeight={600}>
                        {t('plugin_referral_daily_reward')}:{' '}
                        {rewardData ? (
                            <>
                                {Number.parseFloat(rewardData.dailyReward.toFixed(5))} {tokenSymbol ?? '-'}
                            </>
                        ) : (
                            '-'
                        )}
                    </Typography>
                </Grid>
                <Grid item xs={12} display="flex" alignItems="center">
                    <Typography fontWeight={600}>
                        {t('plugin_referral_total_rewards')}:{' '}
                        {rewardData ? (
                            <>
                                {Number.parseFloat(rewardData.totalReward.toFixed(5))} {tokenSymbol ?? '-'}
                            </>
                        ) : (
                            '-'
                        )}
                    </Typography>
                </Grid>
            </Grid>
        </Grid>
    )
}
