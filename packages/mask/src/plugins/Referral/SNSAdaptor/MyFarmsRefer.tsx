import { useAsync } from 'react-use'

import { Grid, Typography, CircularProgress } from '@mui/material'

import { useI18N } from '../../../utils'
import { v4 as uuid } from 'uuid'
import {
    useAccount,
    useChainId,
    useWeb3,
    useTokenListConstants,
    useNativeTokenDetailed,
} from '@masknet/web3-shared-evm'
import { makeStyles } from '@masknet/theme'
import { getAllFarms } from '../Worker/apis/farms'
import { parseChainAddress, Proof } from '../types'
import { fetchAccountProofs } from '../Worker/apis/proofs'
import { fetchERC20TokensFromTokenLists } from '../../../extension/background-script/EthereumService'
import { ZERO_ADDR } from '../constants'
import { toChainAddress, toNativeRewardTokenDefn } from './helpers'
import { ReferredFarmTokenDetailed } from './shared-ui/ReferredFarmTokenDetailed'

const useStyles = makeStyles()((theme) => ({
    container: {
        lineHeight: '22px',
        fontWeight: 300,
        '& > div::-webkit-scrollbar': {
            width: '7px',
        },
        '& > div::-webkit-scrollbar-track': {
            boxShadow: 'inset 0 0 6px rgba(0,0,0,0.00)',
            webkitBoxShadow: 'inset 0 0 6px rgba(0,0,0,0.00)',
        },
        '& > div::-webkit-scrollbar-thumb': {
            borderRadius: '4px',
            backgroundColor: theme.palette.background.default,
        },
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
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
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
        marginRight: '5px',
    },
}))

export function MyFarmsRefer() {
    const { t } = useI18N()
    const { classes } = useStyles()
    const chainId = useChainId()
    const account = useAccount()
    const web3 = useWeb3({ chainId })
    const { ERC20 } = useTokenListConstants()
    const { value: nativeToken } = useNativeTokenDetailed()

    const { value: allTokens = [], loading: loadingAllTokens } = useAsync(
        async () => (!ERC20 || ERC20.length === 0 ? [] : fetchERC20TokensFromTokenLists(ERC20, chainId)),
        [chainId, ERC20?.sort().join()],
    )
    const { value: proofsData, loading: loadingProofs } = useAsync(async () => fetchAccountProofs(account), [])
    const accountProofs: Proof[] = proofsData?.items || []

    // filter out Buyer proofs
    const referProofs = accountProofs.filter((proof) => proof.referrer.toLowerCase() === ZERO_ADDR)
    // select uniq referred tokens
    const referredTokens = referProofs?.map((proof) => toChainAddress(chainId, proof.token))
    const uniqReferredTokens = [...new Set(referredTokens)]

    // fetch farm for buyer's referred tokens
    const { value: farms = [], loading: loadingFarms } = useAsync(
        async () =>
            !uniqReferredTokens || uniqReferredTokens.length === 0
                ? []
                : getAllFarms(web3, chainId, { referredTokens: uniqReferredTokens }),
        [uniqReferredTokens?.sort().join()],
    )

    const allTokensMap = new Map(allTokens.map((token) => [token.address.toLowerCase(), token]))

    // TODO: check it
    const uniqueFarms = farms.filter(
        (val, index) => index === farms.findIndex((elem) => elem.referredTokenDefn === val.referredTokenDefn),
    )
    const nativeRewardToken = toNativeRewardTokenDefn(chainId)

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
                        {t('plugin_referral_rewards_earned')}
                    </Typography>
                </Grid>
            </Grid>
            <div className={classes.content}>
                {loadingProofs || loadingAllTokens || loadingFarms ? (
                    <CircularProgress size={50} />
                ) : (
                    <>
                        {uniqueFarms.length === 0 ? (
                            <Typography className={classes.noFarm}>{t('plugin_referral_no_created_farm')}</Typography>
                        ) : (
                            uniqueFarms.map((farm) => (
                                <Grid container justifyContent="space-between" key={uuid()} className={classes.farm}>
                                    <Grid item xs={6}>
                                        <ReferredFarmTokenDetailed
                                            token={
                                                farm.rewardTokenDefn === nativeRewardToken
                                                    ? nativeToken
                                                    : allTokensMap.get(
                                                          parseChainAddress(farm.referredTokenDefn).address,
                                                      )
                                            }
                                            referredTokenDefn={farm.referredTokenDefn}
                                            rewardTokenDefn={farm.rewardTokenDefn}
                                            chainId={chainId}
                                        />
                                    </Grid>
                                    <Grid item xs={2} display="flex" alignItems="center">
                                        <Typography className={classes.total}>-</Typography>
                                    </Grid>
                                    <Grid item xs={4} display="flex" alignItems="center">
                                        <Typography className={classes.total}>0</Typography>
                                        <Typography className={classes.total}>
                                            {farm.rewardTokenDefn === nativeRewardToken
                                                ? nativeToken?.symbol
                                                : allTokensMap.get(parseChainAddress(farm.rewardTokenDefn).address)
                                                      ?.symbol}
                                        </Typography>
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
