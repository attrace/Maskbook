import { FormattedBalance, TokenIcon, useRemoteControlledDialog } from '@masknet/shared'
import { getFarmTypeIconByReferredToken } from './helpers'
import { AdjustFarmRewardsInterface, RewardData, TransactionStatus } from '../types'
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
import { ATTRACE_FEE_PERCENT, REFERRAL_META_KEY } from '../constants'
import BigNumber from 'bignumber.js'
import { adjustFarmRewards } from '../Worker/apis/createReferralFarm'
import { Transaction } from './shared-ui/Transaction'

import { WalletMessages } from '@masknet/plugin-wallet'
import { useCurrentIdentity } from '../../../components/DataSource/useActivatedUI'
import { useCompositionContext } from '@masknet/plugin-infra'
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
}))

export function AdjustFarmRewards({ farm, token, onClose }: AdjustFarmRewardsInterface) {
    const { t } = useI18N()
    const { classes } = useStyles()
    const chainId = useChainId()
    const web3 = useWeb3({ chainId })
    const account = useAccount()
    const rewardData: RewardData = {
        apr: 0,
        dailyReward: Number.parseFloat(farm?.dailyFarmReward?.toFixed(5) ?? '0'),
        totalReward: Number.parseFloat(farm?.totalFarmRewards?.toFixed(5) ?? '0'),
    }

    const farmTypeIcon = getFarmTypeIconByReferredToken(
        farm?.referredTokenDefn ?? '',
        farm?.rewardTokenDefn ?? '',
        chainId,
    )

    const [attraceFee, setAttraceFee] = useState<BigNumber>(new BigNumber(0))

    const [dailyFarmReward, setDailyFarmReward] = useState<string>('')
    const [totalFarmReward, setTotalFarmReward] = useState<string>('')
    const [transactionHash, setTransactionHash] = useState<string | null>(null)
    const [transactionTitle, setTransactionTitle] = useState<string>('')
    const [transactionSubTitle, setTransactionSubTitle] = useState<string>('')
    const [isTransactionConfirmed, setTransactionConfirmed] = useState(false)
    const [isTransactionProcessing, setTransactionProcessing] = useState(false)
    const [onDepositPage, setOnDepositPage] = useState<boolean>(false)

    const {
        value: rewardBalance = '0',
        loading: loadingRewardBalance,
        retry: retryLoadRewardBalance,
    } = useFungibleTokenBalance(token?.type ?? EthereumTokenType.Native, token?.address ?? '')
    const requiredChainId = useRequiredChainId(chainId)

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

    const onInsertData = useCallback(() => {
        if (!token?.address) {
            return alert('REFERRED TOKEN DID NOT SELECT')
        }

        const { address, name = '', symbol = '', logoURI = [''] } = token
        const selectedReferralData = {
            referral_token: address,
            referral_token_name: name,
            referral_token_symbol: symbol,
            referral_token_icon: logoURI,
            referral_token_chain_id: chainId,
            sender: senderName ?? '',
        }
        if (selectedReferralData) {
            attachMetadata(REFERRAL_META_KEY, JSON.parse(JSON.stringify(selectedReferralData)))
        } else {
            dropMetadata(REFERRAL_META_KEY)
        }

        closeWalletStatusDialog()
        onClose?.()
    }, [token, chainId])

    const adjustFarmReward = useCallback(
        async (deposit: boolean) => {
            const tokenAddress = token?.address ?? ''
            const totalFarmRewardNum = !totalFarmReward
                ? new BigNumber(0)
                : new BigNumber(totalFarmReward ?? 0).plus(attraceFee)
            const dailyFarmRewardNum = !dailyFarmReward ? new BigNumber(0) : new BigNumber(dailyFarmReward)
            adjustFarmRewards(
                (val: boolean) => {
                    setTransactionProcessing(!val)
                    setTransactionConfirmed(val)
                },
                (val: boolean) => {
                    setTransactionProcessing(val)
                },
                (val: string) => {
                    setTransactionHash(val)
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
        },
        [web3, account, token, token, totalFarmReward, dailyFarmReward],
    )
    const adjustRewards = useCallback(() => {
        if (totalFarmReward) {
            setOnDepositPage(true)
        } else {
            adjustFarmReward(false)
        }
        if (totalFarmReward !== '' && dailyFarmReward !== '') {
            setTransactionTitle(t('plugin_referral_adjust_daily_and_total_reward'))
            setTransactionSubTitle(
                t('plugin_referral_adjust_daily_and_total_reward_desc', {
                    totalReward: attraceFee.plus(totalFarmReward),
                    dailyReward: dailyFarmReward,
                    symbol: token?.symbol ?? '',
                }),
            )
        } else if (totalFarmReward !== '') {
            setTransactionTitle(t('plugin_referral_confirm_deposit'))
            setTransactionSubTitle(
                t('plugin_referral_confirm_deposit_desc', {
                    reward: attraceFee.plus(totalFarmReward),
                    symbol: token?.symbol ?? '',
                }),
            )
        } else {
            setTransactionTitle(t('plugin_referral_adjust_daily_reward'))
            setTransactionSubTitle(
                t('plugin_referral_adjust_daily_reward_desc', {
                    reward: dailyFarmReward,
                    symbol: token?.symbol ?? '',
                }),
            )
        }
    }, [totalFarmReward])

    if (isTransactionProcessing) {
        return (
            <Transaction
                status={TransactionStatus.CONFIRMATION}
                title={transactionTitle}
                subtitle={transactionSubTitle}
            />
        )
    }
    if (isTransactionConfirmed) {
        return (
            <Transaction
                status={TransactionStatus.CONFIRMED}
                actionButton={{ label: t('plugin_referral_publish_farm'), onClick: onInsertData }}
                transactionHash={transactionHash ?? ''}
            />
        )
    }

    if (onDepositPage) {
        return (
            <Deposit
                totalFarmReward={totalFarmReward}
                tokenSymbol={token?.symbol}
                attraceFee={attraceFee}
                isTransactionProcessing={isTransactionProcessing}
                onDeposit={async () => {
                    await adjustFarmReward(true)
                }}
                requiredChainId={requiredChainId}
            />
        )
    }

    const disableAdjustRewardsButton = !dailyFarmReward && !totalFarmReward

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
                                        {token && rewardBalance ? (
                                            <>
                                                <Grid container>
                                                    <Grid item container>
                                                        <Box>
                                                            <Typography
                                                                className={classes.balance}
                                                                color="textSecondary"
                                                                variant="body2"
                                                                component="span">
                                                                {t('wallet_balance')}:
                                                                <FormattedBalance
                                                                    value={rewardBalance ?? '0'}
                                                                    decimals={token?.decimals}
                                                                    significant={6}
                                                                    formatter={formatBalance}
                                                                />
                                                            </Typography>
                                                        </Box>
                                                    </Grid>
                                                    <Grid item container columnSpacing={1}>
                                                        <Grid item xs={6}>
                                                            {token?.symbol}
                                                        </Grid>
                                                        <Grid item xs={6}>
                                                            <Chip
                                                                size="small"
                                                                label="MAX"
                                                                clickable
                                                                color="primary"
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
                                                </Grid>
                                            </>
                                        ) : null}
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
                    <Grid container rowSpacing={3} marginY={2}>
                        <Grid item>
                            <b>{t('plugin_referral_adjust_rewards_desc')}</b>
                        </Grid>
                        <Grid item>
                            <div className={classes.container}>
                                <TokenIcon {...token} />
                                <div className={classes.details}>
                                    <div className={classes.nameFarm}>
                                        {token.symbol} {t('plugin_referral_referral_farm')} <img src={farmTypeIcon} />
                                    </div>
                                    <span className={classes.name}>{token.name}</span>
                                </div>
                            </div>
                        </Grid>

                        <Grid item xs={12} container>
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
                        <Grid item xs={12}>
                            <EthereumChainBoundary chainId={requiredChainId} noSwitchNetworkTip>
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
