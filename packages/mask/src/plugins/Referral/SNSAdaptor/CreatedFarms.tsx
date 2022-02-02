import { useEffect, useState } from 'react'
import { useAsync } from 'react-use'

import { Grid, Typography, CircularProgress } from '@mui/material'

import { useI18N } from '../../../utils'
import { v4 as uuid } from 'uuid'
import { fromWei } from 'web3-utils'
import { useAccount, useChainId, useWeb3, useTokenListConstants } from '@masknet/web3-shared-evm'
import { makeStyles } from '@masknet/theme'
import { getMyFarms, getFarmsDeposits } from '../Worker/apis/farms'
import { parseChainAddress } from './helpers'
import type { FarmEvent } from '../types'

import { fetchERC20TokensFromTokenLists } from '../../../extension/background-script/EthereumService'

import { ReferredTokenDetailed } from './shared-ui/ReferredTokenDetailed'

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
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '12px',
        background: theme.palette.background.default,
        height: '44px',
        color: theme.palette.text.strong,
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
    const { ERC20 } = useTokenListConstants()
    const { value: allTokens = [], loading: loadingAllTokens } = useAsync(
        async () => (!ERC20 || ERC20.length === 0 ? [] : fetchERC20TokensFromTokenLists(ERC20, chainId)),
        [chainId, ERC20?.sort().join()],
    )

    const [loadingFarms, setLoadingFarms] = useState(true)
    const [farms, setFarms] = useState<FarmEvent[]>([])

    useEffect(() => {
        async function fetchFarms() {
            setLoadingFarms(true)
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
            setLoadingFarms(false)
        }
        fetchFarms()
    }, [])

    const allTokensMap = new Map(allTokens.map((token) => [token.address.toLowerCase(), token]))

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
            <Grid container justifyContent="center" className={classes.content}>
                {loadingFarms || loadingAllTokens ? (
                    <CircularProgress size={50} />
                ) : (
                    <>
                        {farms.length === 0 ? (
                            <Typography className={classes.noFarm}>{t('plugin_referral_no_created_farm')}</Typography>
                        ) : (
                            farms.map((farm) => (
                                <Grid container justifyContent="space-between" key={uuid()} className={classes.farm}>
                                    <Grid item xs={6}>
                                        <ReferredTokenDetailed
                                            token={allTokensMap.get(parseChainAddress(farm.referredTokenDefn))}
                                        />
                                    </Grid>
                                    <Grid item xs={2} display="flex" alignItems="center">
                                        <Typography className={classes.total}>{t('plugin_referral_apr')}</Typography>
                                    </Grid>
                                    <Grid item xs={4} display="flex" alignItems="center">
                                        <Typography className={classes.total}>
                                            {fromWei(farm.delta.toString())}
                                        </Typography>
                                        <Typography className={classes.total}>
                                            {allTokensMap.get(parseChainAddress(farm.rewardTokenDefn))?.symbol}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            ))
                        )}
                    </>
                )}
            </Grid>
        </div>
    )
}
