import { useAsync } from 'react-use'

import { FormattedBalance, TokenIcon, useRemoteControlledDialog } from '@masknet/shared'
import { AdjustFarmRewardsInterface, TransactionStatus, Icons, PagesType, TabsReferralFarms } from '../types'
import { useI18N } from '../../../utils'
import { Chip, Grid, InputAdornment, TextField, Typography } from '@mui/material'
import { makeStyles } from '@masknet/theme'
import {
    EthereumTokenType,
    formatBalance,
    useAccount,
    useChainId,
    useFungibleTokenBalance,
    useWeb3,
} from '@masknet/web3-shared-evm'
import { Box } from '@mui/system'
import { useCallback, useState } from 'react'
import { EthereumChainBoundary } from '../../../web3/UI/EthereumChainBoundary'
import ActionButton from '../../../extension/options-page/DashboardComponents/ActionButton'
import { useRequiredChainId } from './hooks/useRequiredChainId'
import { Deposit } from './CreateFarm'
import { APR, ATTRACE_FEE_PERCENT } from '../constants'
import BigNumber from 'bignumber.js'
import { adjustFarmRewards } from '../Worker/apis/referralFarm'
import { getFarmsMetaState } from '../Worker/apis/farms'

import { WalletMessages } from '@masknet/plugin-wallet'
import { useCurrentIdentity } from '../../../components/DataSource/useActivatedUI'
import { useCompositionContext } from '@masknet/plugin-infra'
import { useSharedStyles } from './styles'
import { SvgIcons } from './Icons'

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
}))

export function AdjustFarmRewards(props: AdjustFarmRewardsInterface) {
    const { farm, token } = props
    const { t } = useI18N()
    const { classes } = useStyles()
    const { classes: sharedClasses } = useSharedStyles()
    const chainId = useChainId()
    const web3 = useWeb3({ chainId })
    const account = useAccount()

    const [attraceFee, setAttraceFee] = useState<BigNumber>(new BigNumber(0))

    const [dailyFarmReward, setDailyFarmReward] = useState<string>('')
    const [totalFarmReward, setTotalFarmReward] = useState<string>('')
    const [transactionTitle, setTransactionTitle] = useState<string>('')
    const [transactionSubTitle, setTransactionSubTitle] = useState<string>('')
    const [isTransactionProcessing, setTransactionProcessing] = useState(false)
    const [onDepositPage, setOnDepositPage] = useState<boolean>(false)

    const {
        value: rewardBalance = '0',
        loading: loadingRewardBalance,
        retry: retryLoadRewardBalance,
    } = useFungibleTokenBalance(token?.type ?? EthereumTokenType.Native, token?.address ?? '')
    const requiredChainId = useRequiredChainId(chainId)

    const { value: farmsMetaState } = useAsync(
        async () => (farm?.farmHash ? getFarmsMetaState(web3, chainId, [farm.farmHash]) : undefined),
        [web3, farm, chainId],
    )

    const { closeDialog: closeWalletStatusDialog } = useRemoteControlledDialog(
        WalletMessages.events.walletStatusDialogUpdated,
    )
    const currentIdentity = useCurrentIdentity()
    const senderName = currentIdentity?.identifier.userId ?? currentIdentity?.linkedPersona?.nickname ?? 'Unknown User'
    const { attachMetadata, dropMetadata } = useCompositionContext()

    const onChangeTotalFarmReward = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const totalFarmReward = e.currentTarget.value
        const totalFarmRewardNum = new BigNumber(totalFarmReward)
        const attraceFee = totalFarmRewardNum.multipliedBy(ATTRACE_FEE_PERCENT).dividedBy(100)

        setTotalFarmReward(totalFarmReward)
        setAttraceFee(attraceFee)
    }, [])

    const adjustFarmReward = useCallback(async () => {
        const tokenAddress = token?.address ?? ''
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
                    setTransactionProcessing(true)
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
            tokenAddress,
            tokenAddress,
            totalFarmRewardNum,
            dailyFarmRewardNum,
            !totalFarmReward,
            !dailyFarmReward,
        )
    }, [web3, account, chainId, token, totalFarmReward, dailyFarmReward])

    const adjustRewards = useCallback(() => {
        if (totalFarmReward !== '' && dailyFarmReward !== '') {
            setTransactionTitle(t('plugin_referral_confirm_transaction'))
            setTransactionSubTitle(
                t('plugin_referral_adjust_daily_and_total_reward_desc', {
                    totalReward: attraceFee.plus(totalFarmReward),
                    dailyReward: dailyFarmReward,
                    symbol: token?.symbol ?? '',
                }),
            )
            setOnDepositPage(true)
        } else if (totalFarmReward !== '') {
            setTransactionTitle(t('plugin_referral_confirm_deposit'))
            setTransactionSubTitle(
                t('plugin_referral_adjust_total_reward_desc', {
                    reward: attraceFee.plus(totalFarmReward),
                    symbol: token?.symbol ?? '',
                }),
            )
            setOnDepositPage(true)
        } else {
            setTransactionTitle(t('plugin_referral_confirm_transaction'))
            setTransactionSubTitle(
                t('plugin_referral_adjust_daily_reward_desc', {
                    reward: dailyFarmReward,
                    symbol: token?.symbol ?? '',
                }),
            )

            adjustFarmReward()
        }
    }, [totalFarmReward, dailyFarmReward, attraceFee, token])

    const onConfirmAdjustFarm = useCallback(() => {
        props?.onChangePage?.(PagesType.TRANSACTION, t('plugin_referral_transaction'), {
            hideAttrLogo: true,
            hideBackBtn: true,
            transactionDialog: {
                transaction: {
                    status: TransactionStatus.CONFIRMATION,
                    title: transactionTitle,
                    subtitle: transactionSubTitle,
                },
            },
        })
    }, [props, transactionTitle, transactionSubTitle])

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
        props?.onChangePage?.(PagesType.CREATE_FARM, TabsReferralFarms.TOKENS + ': ' + PagesType.CREATE_FARM)
    }, [props])

    if (isTransactionProcessing) {
        onConfirmAdjustFarm()
    }

    if (onDepositPage) {
        return (
            <Deposit
                totalFarmReward={totalFarmReward}
                tokenSymbol={token?.symbol}
                attraceFee={attraceFee}
                onDeposit={async () => {
                    await adjustFarmReward()
                }}
                requiredChainId={requiredChainId}
            />
        )
    }

    const farmMetaState = farm?.farmHash ? farmsMetaState?.get(farm.farmHash) : undefined

    const rewardData = {
        apr: APR,
        dailyReward: Number.parseFloat(farmMetaState?.dailyFarmReward?.toFixed(5) ?? '0'),
        totalReward: Number.parseFloat(farm?.totalFarmRewards?.toFixed(5) ?? '0'),
    }

    const disableAdjustRewardsButton = !Number(dailyFarmReward) && !Number(totalFarmReward)

    const rewardDataFields = () => {
        return (
            <>
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
                                endAdornment: <InputAdornment position="end">{token?.symbol}</InputAdornment>,
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
                                        <Grid container>
                                            <Grid item container>
                                                <Box>
                                                    <Typography
                                                        className={classes.balance}
                                                        color="textSecondary"
                                                        variant="body2"
                                                        component="span">
                                                        {t('wallet_balance')}:{' '}
                                                        <FormattedBalance
                                                            value={rewardBalance ?? '0'}
                                                            decimals={token?.decimals}
                                                            significant={6}
                                                            formatter={formatBalance}
                                                        />
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            {rewardBalance && (
                                                <Grid item container>
                                                    <Grid item xs={6}>
                                                        {token?.symbol}
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Chip
                                                            size="small"
                                                            label="MAX"
                                                            clickable
                                                            color="primary"
                                                            className={sharedClasses.maxChip}
                                                            variant="outlined"
                                                            onClick={() => {
                                                                setTotalFarmReward(
                                                                    formatBalance(
                                                                        rewardBalance ?? '',
                                                                        token?.decimals,
                                                                        6,
                                                                    ),
                                                                )
                                                            }}
                                                        />
                                                    </Grid>
                                                </Grid>
                                            )}
                                        </Grid>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>
                </Grid>
            </>
        )
    }
    return (
        <div>
            {token && (
                <Typography display="flex" flexDirection="column">
                    <Grid container marginY={3}>
                        <Grid item marginBottom="24px">
                            <Typography fontWeight={600} variant="h6">
                                {t('plugin_referral_adjust_rewards_desc')}
                            </Typography>
                        </Grid>
                        <Grid item marginBottom="24px">
                            <div className={classes.container}>
                                <TokenIcon {...token} />
                                <div className={classes.details}>
                                    <div className={classes.nameFarm}>
                                        {token.symbol} {t('plugin_referral_referral_farm')}{' '}
                                        <Box paddingLeft={1}>
                                            <SvgIcons icon={Icons.SponsoredFarmIcon} />
                                        </Box>
                                    </div>
                                    <span className={classes.name}>{token.name}</span>
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
                                                {token?.symbol ?? '-'}
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
                                                {token?.symbol ?? '-'}
                                            </>
                                        ) : (
                                            '-'
                                        )}
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                        {rewardDataFields()}
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
                                    onClick={() => {
                                        adjustRewards()
                                    }}>
                                    {t('plugin_referral_adjust_rewards')}
                                </ActionButton>
                            </EthereumChainBoundary>
                        </Grid>
                    </Grid>
                </Typography>
            )}
        </div>
    )
}
