import { useCallback, useState } from 'react'
import { useAsync } from 'react-use'
import BigNumber from 'bignumber.js'
import { TokenIcon } from '@masknet/shared'
import { Chip, Grid, InputAdornment, TextField, Typography } from '@mui/material'
import { makeStyles } from '@masknet/theme'
import { Box } from '@mui/system'
import {
    EthereumTokenType,
    formatBalance,
    useAccount,
    useChainId,
    useFungibleTokenBalance,
    useWeb3,
    FungibleTokenDetailed,
} from '@masknet/web3-shared-evm'

import { AdjustFarmRewardsInterface, TransactionStatus, Icons, PagesType, TabsReferralFarms } from '../types'
import { useI18N } from '../../../utils'
import { EthereumChainBoundary } from '../../../web3/UI/EthereumChainBoundary'
import ActionButton from '../../../extension/options-page/DashboardComponents/ActionButton'
import { useRequiredChainId } from './hooks/useRequiredChainId'
import { parseChainAddress } from './helpers'
import { APR, ATTRACE_FEE_PERCENT } from '../constants'
import { adjustFarmRewards } from '../Worker/apis/referralFarm'
import { getFarmsMetaState } from '../Worker/apis/farms'

import { SvgIcons } from './Icons'

import { useSharedStyles } from './styles'

const useStyles = makeStyles()((theme) => ({
    container: {
        display: 'flex',
        alignItems: 'center',
    },
    logo: {
        display: 'flex',
        justifyContent: 'center',
        width: '44px',
        height: '44px',
        marginRight: '16px',
    },
    details: {
        marginLeft: '16px',
        fontWeight: 500,
    },
    nameFarm: {
        display: 'flex',
        alignItems: 'center',
        '& img': {
            marginLeft: '7px',
            height: '16px',
            width: '16px',
        },
    },
    name: {
        color: theme.palette.text.secondary,
        fontWeight: 400,
    },
    balance: {
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        maxWidth: '80%',
        fontSize: 12,
        top: theme.spacing(0.5),
    },
    textField: {
        '& input[type=number]': {
            '-moz-appearance': 'textfield',
        },
        '& input[type=number]::-webkit-outer-spin-button': {
            '-webkit-appearance': 'none',
            margin: 0,
        },
        '& input[type=number]::-webkit-inner-spin-button': {
            '-webkit-appearance': 'none',
            margin: 0,
        },
    },
    switchButton: {
        width: '100%',
    },
    tokenIcon: {
        width: '40px',
        height: '40px',
        backgroundColor: theme.palette.background.default,
        borderRadius: '50%',
    },
}))

export function AdjustFarmRewards(props: AdjustFarmRewardsInterface) {
    const { farm, rewardToken, referredToken } = props
    localStorage.setItem('adjustFarmRewardsData', JSON.stringify({ farm, rewardToken, referredToken }))

    const { t } = useI18N()
    const { classes } = useStyles()
    const { classes: sharedClasses } = useSharedStyles()
    const chainId = useChainId()
    const web3 = useWeb3({ chainId })
    const account = useAccount()

    const [attraceFee, setAttraceFee] = useState<BigNumber>(new BigNumber(0))
    const [dailyFarmReward, setDailyFarmReward] = useState<string>('')
    const [totalFarmReward, setTotalFarmReward] = useState<string>('')

    const {
        value: rewardBalance = '0',
        loading: loadingRewardBalance,
        retry: retryLoadRewardBalance,
    } = useFungibleTokenBalance(rewardToken?.type ?? EthereumTokenType.Native, rewardToken?.address ?? '')
    const requiredChainId = useRequiredChainId(chainId)

    const { value: farmsMetaState } = useAsync(
        async () => (farm?.farmHash ? getFarmsMetaState(web3, chainId, [farm.farmHash]) : undefined),
        [web3, farm, chainId],
    )

    const onChangeTotalFarmReward = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const totalFarmReward = e.currentTarget.value
        const totalFarmRewardNum = new BigNumber(totalFarmReward)
        const attraceFee = totalFarmRewardNum.multipliedBy(ATTRACE_FEE_PERCENT).dividedBy(100)

        setTotalFarmReward(totalFarmReward)
        setAttraceFee(attraceFee)
    }, [])

    const onAdjustFarmReward = useCallback(async () => {
        const referredTokenAddr =
            referredToken?.address || (farm?.referredTokenDefn && parseChainAddress(farm.referredTokenDefn).address)
        const rewardTokenAddr =
            rewardToken?.address || (farm?.rewardTokenDefn && parseChainAddress(farm.rewardTokenDefn).address)

        if (!referredTokenAddr || !rewardTokenAddr) {
            return onErrorDeposit()
        }

        const totalFarmRewardNum = !totalFarmReward
            ? new BigNumber(0)
            : new BigNumber(totalFarmReward ?? 0).plus(attraceFee)
        const dailyFarmRewardNum = !dailyFarmReward ? new BigNumber(0) : new BigNumber(dailyFarmReward)

        adjustFarmRewards(
            (val: boolean) => {
                if (!val) {
                    onErrorDeposit()
                }
            },
            (val: boolean) => {
                if (val) {
                    onConfirmAdjustFarm()
                } else {
                    onErrorDeposit()
                }
            },
            (txHash: string) => {
                onConfirmedAdjustFarm(txHash)
            },
            web3,
            account,
            chainId,
            rewardTokenAddr,
            referredTokenAddr,
            totalFarmRewardNum,
            dailyFarmRewardNum,
        )
    }, [web3, account, chainId, farm, referredToken, rewardToken, totalFarmReward, dailyFarmReward])

    const onClickAdjustRewards = useCallback(() => {
        if (totalFarmReward && Number(totalFarmReward) > 0) {
            onOpenDepositDialog()
        } else {
            onAdjustFarmReward()
        }
    }, [totalFarmReward, dailyFarmReward])

    const onOpenDepositDialog = useCallback(() => {
        props.continue(
            PagesType.ADJUST_REWARDS,
            PagesType.DEPOSIT,
            TabsReferralFarms.TOKENS + ': ' + PagesType.ADJUST_REWARDS,
            {
                hideAttrLogo: true,
                depositDialog: {
                    deposit: {
                        totalFarmReward: totalFarmReward,
                        tokenSymbol: rewardToken?.symbol,
                        attraceFee: attraceFee,
                        requiredChainId: requiredChainId,
                        onDeposit: onAdjustFarmReward,
                    },
                },
            },
        )
    }, [props, attraceFee, totalFarmReward, rewardToken, requiredChainId])

    const getTransactionTitles = useCallback(
        (
            totalFarmReward: number,
            dailyFarmReward: number,
            attraceFee: BigNumber,
            rewardToken?: FungibleTokenDetailed,
        ) => {
            if (totalFarmReward && dailyFarmReward) {
                return {
                    title: t('plugin_referral_confirm_transaction'),
                    subtitle: t('plugin_referral_adjust_daily_and_total_reward_desc', {
                        totalReward: attraceFee.plus(totalFarmReward),
                        dailyReward: dailyFarmReward,
                        symbol: rewardToken?.symbol ?? '',
                    }),
                }
            }

            if (totalFarmReward) {
                return {
                    title: t('plugin_referral_confirm_deposit'),
                    subtitle: t('plugin_referral_adjust_total_reward_desc', {
                        reward: attraceFee.plus(totalFarmReward),
                        symbol: rewardToken?.symbol ?? '',
                    }),
                }
            }

            return {
                title: t('plugin_referral_confirm_transaction'),
                subtitle: t('plugin_referral_adjust_daily_reward_desc', {
                    reward: dailyFarmReward,
                    symbol: rewardToken?.symbol ?? '',
                }),
            }
        },
        [t],
    )

    const onConfirmAdjustFarm = useCallback(() => {
        const { title, subtitle } = getTransactionTitles(
            Number(totalFarmReward),
            Number(dailyFarmReward),
            attraceFee,
            props.rewardToken,
        )

        props?.onChangePage?.(PagesType.TRANSACTION, t('plugin_referral_transaction'), {
            hideAttrLogo: true,
            hideBackBtn: true,
            transactionDialog: {
                transaction: {
                    status: TransactionStatus.CONFIRMATION,
                    title: title,
                    subtitle: subtitle,
                },
            },
        })
    }, [props, totalFarmReward, dailyFarmReward, attraceFee])

    const onConfirmedAdjustFarm = useCallback(
        (txHash: string) => {
            props?.onChangePage?.(PagesType.TRANSACTION, t('plugin_referral_transaction'), {
                hideAttrLogo: true,
                hideBackBtn: true,
                transactionDialog: {
                    transaction: {
                        status: TransactionStatus.CONFIRMED,
                        actionButton: {
                            label: t('dismiss'),
                            onClick: onErrorDeposit,
                        },
                        transactionHash: txHash,
                    },
                },
            })
        },
        [props],
    )

    const onErrorDeposit = useCallback(() => {
        props?.onChangePage?.(PagesType.ADJUST_REWARDS, TabsReferralFarms.TOKENS + ': ' + PagesType.ADJUST_REWARDS, {
            adjustFarmDialog: {
                farm: farm,
                rewardToken,
                referredToken,
                continue: () => {},
            },
        })
    }, [props, farm, rewardToken, referredToken])

    const farmMetaState = farm?.farmHash ? farmsMetaState?.get(farm.farmHash) : undefined

    const rewardData = {
        apr: APR,
        dailyReward: Number.parseFloat(farmMetaState?.dailyFarmReward?.toFixed(5) ?? '0'),
        totalReward: Number.parseFloat(farm?.totalFarmRewards?.toFixed(5) ?? '0'),
    }

    const disableAdjustRewardsButton = !Number(dailyFarmReward) && !Number(totalFarmReward)
    const balance = formatBalance(rewardBalance ?? '', rewardToken?.decimals, 6)

    return rewardToken ? (
        <Typography display="flex" flexDirection="column">
            <Grid container marginY={3}>
                <Grid item marginBottom="24px">
                    <Typography fontWeight={600} variant="h6">
                        {t('plugin_referral_adjust_rewards_desc')}
                    </Typography>
                </Grid>
                <Grid item marginBottom="24px">
                    <div className={classes.container}>
                        {referredToken ? <TokenIcon {...referredToken} /> : <div className={classes.tokenIcon} />}
                        <div className={classes.details}>
                            <div className={classes.nameFarm}>
                                {referredToken?.symbol} {t('plugin_referral_referral_farm')}{' '}
                                <Box paddingLeft={1}>
                                    <SvgIcons icon={Icons.SponsoredFarmIcon} />
                                </Box>
                            </div>
                            <span className={classes.name}>{referredToken?.name}</span>
                        </div>
                    </div>
                </Grid>
                <Grid item xs={12} container marginBottom="24px">
                    <Grid item xs={4} display="flex" alignItems="center">
                        <Box>
                            {t('plugin_referral_estimated_apr')}
                            <Typography fontWeight={600} marginTop="4px">
                                {rewardData.apr}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={4} display="flex" alignItems="center">
                        <Box>
                            {t('plugin_referral_daily_rewards')}
                            <Typography fontWeight={600} marginTop="4px">
                                {rewardData ? (
                                    <>
                                        {Number.parseFloat(rewardData.dailyReward.toFixed(5))}{' '}
                                        {rewardToken?.symbol ?? '-'}
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
                                        {Number.parseFloat(rewardData.totalReward.toFixed(5))}{' '}
                                        {rewardToken?.symbol ?? '-'}
                                    </>
                                ) : (
                                    '-'
                                )}
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
                <Grid item xs={6} display="flex">
                    <Box>
                        <TextField
                            label={t('plugin_referral_daily_farm_reward')}
                            value={dailyFarmReward}
                            placeholder={rewardData.dailyReward.toString()}
                            onChange={(e) => setDailyFarmReward(e.currentTarget.value)}
                            inputMode="numeric"
                            type="number"
                            InputLabelProps={{
                                shrink: true,
                            }}
                            variant="standard"
                            className={classes.textField}
                            InputProps={{
                                disableUnderline: true,
                                endAdornment: <InputAdornment position="end">{rewardToken?.symbol}</InputAdornment>,
                            }}
                        />
                    </Box>
                </Grid>
                <Grid item xs={6} display="flex" alignItems="end">
                    <Box justifyContent="center">
                        <TextField
                            label={t('plugin_referral_additional_farm_rewards')}
                            value={totalFarmReward}
                            inputMode="numeric"
                            type="number"
                            placeholder="0"
                            onChange={onChangeTotalFarmReward}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            variant="standard"
                            className={classes.textField}
                            InputProps={{
                                disableUnderline: true,
                                endAdornment: (
                                    <InputAdornment position="start">
                                        <Box>
                                            <Typography
                                                className={classes.balance}
                                                color="textSecondary"
                                                variant="body2"
                                                component="span">
                                                {t('wallet_balance')}: {balance}
                                            </Typography>
                                            {rewardToken && (
                                                <Box display="flex" alignItems="center">
                                                    {rewardToken?.symbol}
                                                    <Chip
                                                        size="small"
                                                        label="MAX"
                                                        clickable
                                                        color="primary"
                                                        className={sharedClasses.maxChip}
                                                        variant="outlined"
                                                        onClick={() => setTotalFarmReward(balance)}
                                                    />
                                                </Box>
                                            )}
                                        </Box>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>
                </Grid>
                <Grid item xs={12} marginTop="24px">
                    <EthereumChainBoundary
                        chainId={requiredChainId}
                        noSwitchNetworkTip
                        classes={{
                            switchButton: sharedClasses.switchButton,
                        }}>
                        <ActionButton
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={disableAdjustRewardsButton}
                            onClick={onClickAdjustRewards}>
                            {t('plugin_referral_adjust_rewards')}
                        </ActionButton>
                    </EthereumChainBoundary>
                </Grid>
            </Grid>
        </Typography>
    ) : (
        <Typography>{t('plugin_referral_adjust_rewards_error')}</Typography>
    )
}
