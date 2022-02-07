import { Typography, Box, Grid } from '@mui/material'

import { useI18N } from '../../../../utils'
import { isDashboardPage } from '@masknet/shared-base'
import { makeStyles } from '@masknet/theme'
import type { RewardData } from '../../types'

const useStyles = makeStyles<{ isDashboard: boolean }>()((theme, { isDashboard }) => ({
    icon: {
        maxWidth: '20px',
        maxHeight: '20px',
    },
}))

export interface RewardDataWidgetWidgetProps extends React.PropsWithChildren<{}> {
    title?: string
    icon?: string
    rewardData?: RewardData
    tokenSymbol?: string
}

export function RewardDataWidget({ title, icon, rewardData, tokenSymbol }: RewardDataWidgetWidgetProps) {
    const { t } = useI18N()
    const isDashboard = isDashboardPage()
    const { classes } = useStyles({ isDashboard })

    return (
        <Grid container marginTop="24px">
            {title && (
                <Grid item xs={12} container marginBottom="12px" alignItems="center">
                    <img className={classes.icon} src={icon} />
                    <Grid item paddingX={1}>
                        <Typography fontWeight={600}>{title}</Typography>
                    </Grid>
                </Grid>
            )}
            <Grid item xs={4} display="flex" alignItems="center">
                <Box>
                    {t('plugin_referral_estimated_apr')}
                    <Typography fontWeight={600} marginTop="4px">
                        {rewardData?.apr ? `${rewardData.apr} %` : '-'}
                    </Typography>
                </Box>
            </Grid>
            <Grid item xs={4} display="flex" alignItems="center">
                <Box>
                    {t('plugin_referral_daily_rewards')}
                    <Typography fontWeight={600} marginTop="4px">
                        {rewardData ? (
                            <>
                                {Number.parseFloat(rewardData.dailyReward.toFixed(5))} {tokenSymbol ?? '-'}
                            </>
                        ) : (
                            '-'
                        )}
                    </Typography>
                </Box>
            </Grid>
            <Grid item xs={4} display="flex" alignItems="center">
                <Box>
                    {t('plugin_referral_total_farm_rewards')}
                    <Typography fontWeight={600} marginTop="4px">
                        {rewardData ? (
                            <>
                                {Number.parseFloat(rewardData.totalReward.toFixed(5))} {tokenSymbol ?? '-'}
                            </>
                        ) : (
                            '-'
                        )}
                    </Typography>
                </Box>
            </Grid>
        </Grid>
    )
}
