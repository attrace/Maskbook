import { useEffect, useState } from 'react'

import { Grid } from '@mui/material'

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
        fontFamily: 'PingFang SC',
        lineHeight: '22px',
        fontSize: '16px',
        fontWeight: 300,
    },
    heading: {
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
        fontWeight: 500,
        color: theme.palette.text.strong,
    },
}))

export function CreatedFarms(props: any) {
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
            <Grid container justifyContent="space-between" rowSpacing="20px" className={classes.heading}>
                <Grid item xs={6}>
                    {t('referral_farm')}
                </Grid>
                <Grid item xs={2}>
                    {t('apr')}
                </Grid>
                <Grid item xs={4}>
                    {t('total_rewards')}
                </Grid>
            </Grid>
            <div className={classes.content}>
                {!loading && (
                    <>
                        {farms.length === 0 ? (
                            <Grid container justifyContent="center" alignItems="center" className={classes.noFarm}>
                                {t('no_created_farm')}
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
                                    <Grid item xs={2}>
                                        {/* {t('apr')} */}
                                    </Grid>
                                    <Grid item xs={4}>
                                        {fromWei(farm.delta.toString())}{' '}
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
