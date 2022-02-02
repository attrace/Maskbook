import { useEffect, useState } from 'react'

import { Grid, Typography } from '@mui/material'

import { useI18N } from '../../../utils'
import { fromWei } from 'web3-utils'
import { useAccount, useChainId, useWeb3 } from '@masknet/web3-shared-evm'
import { makeStyles } from '@masknet/theme'
import { getMyFarms, getFarmsDeposits } from '../Worker/apis/farms'
import { parseChainAddress } from './helpers'

import type { FarmEvent } from '../types'

import { FarmItemDetailed } from './FarmItemDetailed'
import { TokenSymbol } from './TokenSymbol'

const useStyles = makeStyles()((theme) => ({
    container: {
        lineHeight: '22px',
        fontWeight: 300,
    },
    col: {
        color: theme.palette.text.secondary,
        fontWeight: 500,
    },
    content: {
        height: 320,
        overflowY: 'scroll',
        marginTop: 20,
        color: theme.palette.text.strong,
    },
    farm: {
        marginBottom: '20px',
    },
    noFarm: {
        borderRadius: '12px',
        background: theme.palette.background.default,
        height: '44px',
        color: theme.palette.text.strong,
    },
    noFarmText: {
        fontWeight: 500,
    },
    total: {
        marginRight: '4px',
    },
}))

export function CreatedFarms() {
    const { t } = useI18N()
    const { classes } = useStyles()
    const chainId = useChainId()
    const account = useAccount()
    const web3 = useWeb3({ chainId })

    const [loading, setLoading] = useState(true)
    const [farms, setFarms] = useState<FarmEvent[]>([])

    useEffect(() => {
        async function fetchFarms() {
            setLoading(true)
            const farms: FarmEvent[] = []

            // fetch farms created by sponsor and all farms deposits
            const [myFarms, farmsDeposits] = await Promise.allSettled([
                getMyFarms(web3, account),
                getFarmsDeposits(web3),
            ])

            if (myFarms.status === 'fulfilled' && farmsDeposits.status === 'fulfilled') {
                farmsDeposits.value.forEach((deposit) => {
                    myFarms.value.forEach((farm) => {
                        if (!(deposit.farmHash === farm.farmHash)) return

                        farms.push({ ...deposit, ...farm })
                    })
                })

                setFarms(farms)
            }
            setLoading(false)
        }
        fetchFarms()
    }, [])

    return (
        <div className={classes.container}>
            <Grid container justifyContent="space-between" rowSpacing="20px">
                <Grid item xs={6}>
                    <Typography fontWeight={500} className={classes.col}>
                        {t('plugin_referral_referral_farm')}
                    </Typography>
                </Grid>
                <Grid item xs={2}>
                    <Typography fontWeight={500} className={classes.col}>
                        {t('plugin_referral_apr')}
                    </Typography>
                </Grid>
                <Grid item xs={4}>
                    <Typography fontWeight={500} className={classes.col}>
                        {t('plugin_referral_total_rewards')}
                    </Typography>
                </Grid>
            </Grid>
            <div className={classes.content}>
                {!loading && (
                    <>
                        {farms.length === 0 ? (
                            <Grid container justifyContent="center" alignItems="center" className={classes.noFarm}>
                                <Typography className={classes.noFarmText}>
                                    {t('plugin_referral_no_created_farm')}
                                </Typography>
                            </Grid>
                        ) : (
                            farms.map((farm) => (
                                <Grid
                                    container
                                    justifyContent="space-between"
                                    key={farm.farmHash}
                                    className={classes.farm}>
                                    <Grid item xs={6}>
                                        <FarmItemDetailed
                                            address={parseChainAddress(chainId, farm.referredTokenDefn)}
                                        />
                                    </Grid>
                                    <Grid item xs={2} display="flex" alignItems="center">
                                        <Typography className={classes.total}>{t('plugin_referral_apr')}</Typography>
                                    </Grid>
                                    <Grid item xs={4} display="flex" alignItems="center">
                                        <Typography className={classes.total}>
                                            {fromWei(farm.delta.toString())}
                                        </Typography>
                                        <TokenSymbol address={parseChainAddress(chainId, farm.rewardTokenDefn)} />
                                    </Grid>
                                </Grid>
                            ))
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
