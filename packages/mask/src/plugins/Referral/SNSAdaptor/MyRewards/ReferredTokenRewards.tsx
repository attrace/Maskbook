import { useMemo } from 'react'
import { groupBy } from 'lodash-unified'
import BigNumber from 'bignumber.js'
import { formatUnits } from '@ethersproject/units'
import { Grid, Typography } from '@mui/material'

import { useI18N } from '../../../../utils'
import { roundValue } from '../../helpers'
import { APR } from '../../constants'
import type { RewardDetailed } from '../../types'

import { FarmTokenDetailed } from '../shared-ui/FarmTokenDetailed'

export interface ReferredTokenRewardsProps extends React.PropsWithChildren<{}> {
    rewards: RewardDetailed[]
}

export function ReferredTokenRewards({ rewards }: ReferredTokenRewardsProps) {
    const { t } = useI18N()

    const referredTokenRewards = useMemo(() => {
        return Object.entries(groupBy(rewards, (reward) => reward.referredTokenDefn))
    }, [rewards])

    return (
        <>
            <Grid container justifyContent="space-between" marginBottom="12px">
                <Grid item xs={6}>
                    <Typography fontWeight={600}>{t('plugin_referral_referral_farm')}</Typography>
                </Grid>
                <Grid item xs={2}>
                    <Typography fontWeight={600}>{t('plugin_referral_apr')}</Typography>
                </Grid>
                <Grid item xs={4}>
                    <Typography fontWeight={600}>{t('plugin_referral_rewards_earned')}</Typography>
                </Grid>
            </Grid>
            {referredTokenRewards.map(([referredTokenDefn, rewards]) => {
                const totalRewards = rewards.reduce(function (accumulator, current) {
                    return accumulator.plus(new BigNumber(formatUnits(current.rewardValue)))
                }, new BigNumber(0))

                return (
                    <Grid container justifyContent="space-between" marginBottom="8px" key={referredTokenDefn}>
                        <Grid item xs={6}>
                            <FarmTokenDetailed token={rewards[0].referredToken} hideFarmTypeIcon />
                        </Grid>
                        <Grid item xs={2}>
                            <Typography>{APR}</Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <Typography>
                                {roundValue(totalRewards.toNumber(), rewards[0].rewardToken?.decimals)}{' '}
                                {rewards[0].rewardToken?.symbol}
                            </Typography>
                        </Grid>
                    </Grid>
                )
            })}
        </>
    )
}
