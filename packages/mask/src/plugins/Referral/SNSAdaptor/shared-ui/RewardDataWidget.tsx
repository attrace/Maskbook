import { Typography, Box, Grid } from '@mui/material'

import { useI18N } from '../../../../utils'
import { APR } from '../../constants'
import type { Icons, RewardData } from '../../types'

import { SvgIcons } from '../Icons'

export interface RewardDataWidgetWidgetProps extends React.PropsWithChildren<{}> {
    title?: string
    icon?: Icons
    rewardData?: RewardData
    tokenSymbol?: string
}

export function RewardDataWidget({ title, icon, rewardData, tokenSymbol }: RewardDataWidgetWidgetProps) {
    const { t } = useI18N()

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
            <Grid item xs={4} display="flex" alignItems="center">
                <Box>
                    <Typography>{t('plugin_referral_estimated_apr')}</Typography>
                    <Typography fontWeight={600} marginTop="4px">
                        {rewardData ? APR : '-'}
                    </Typography>
                </Box>
            </Grid>
            <Grid item xs={4} display="flex" alignItems="center">
                <Box>
                    <Typography>{t('plugin_referral_daily_farm_reward')}</Typography>
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
                    <Typography>{t('plugin_referral_total_farm_rewards')}</Typography>
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
