import { useCallback, useState } from 'react'
import { Typography, Box, Tab, Tabs, Grid, TextField, CircularProgress, Chip } from '@mui/material'
import { TabContext, TabPanel } from '@mui/lab'

import { useI18N } from '../../../utils'
import {
    ChainId,
    formatBalance,
    useAccount,
    useChainId,
    useFungibleTokenWatched,
    useWeb3,
} from '@masknet/web3-shared-evm'
import { isDashboardPage } from '@masknet/shared-base'
import { makeStyles } from '@masknet/theme'
import { TabsCreateFarm, TokenType, PagesType, TransactionStatus } from '../types'
import ActionButton from '../../../extension/options-page/DashboardComponents/ActionButton'
import { EthereumChainBoundary } from '../../../web3/UI/EthereumChainBoundary'
import { CreatedFarms } from './CreatedFarms'
import { Transaction } from './shared-ui/Transaction'
import { TokenSelectField } from './shared-ui/TokenSelectField'

import { FormattedBalance, useRemoteControlledDialog } from '@masknet/shared'
import { WalletMessages } from '@masknet/plugin-wallet'
import { v4 as uuid } from 'uuid'

import { blue } from '@mui/material/colors'
import { NATIVE_TOKEN, REFERRAL_META_KEY } from '../constants'
import { useCompositionContext } from '@masknet/plugin-infra'

import { useCurrentIdentity } from '../../../components/DataSource/useActivatedUI'
import { runCreateERC20PairFarm, runCreateNativeFarm } from '../Worker/apis/createReferralFarm'
import { PluginReferralMessages, SelectTokenUpdated } from '../messages'

const useStyles = makeStyles<{ isDashboard: boolean }>()((theme, { isDashboard }) => ({
    walletStatusBox: {
        width: 535,
        margin: '24px auto',
    },
    bold: {},
    normal: {},
    container: {
        flex: 1,
        height: '100%',
    },
    tab: {
        maxHeight: '100%',
        height: '100%',
        overflow: 'auto',
        padding: `${theme.spacing(3)} 0`,
    },
    tabs: {
        width: '288px',
    },
    chip: {
        width: '150px',
        height: '40px',

        flexDirection: 'row',
    },
    linkText: {
        color: blue[50],
    },
    heading: {
        fontSize: '20px',
        fontWeight: 'bold',
    },
    depositRoot: {
        padding: `${theme.spacing(3)} 0`,
    },
    balance: {
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        maxWidth: '80%',
        fontSize: 12,
        top: theme.spacing(0.5),
    },
}))

// Deposit
interface DepositProps {
    totalFarmReward: string
    rewardTokenSymbol?: string
    requiredChainId: ChainId
    isTransactionProcessing: boolean
    onDeposit: () => Promise<void>
}
function Deposit({
    totalFarmReward,
    rewardTokenSymbol,
    requiredChainId,
    isTransactionProcessing,
    onDeposit,
}: DepositProps) {
    const { t } = useI18N()
    const isDashboard = isDashboardPage()
    const { classes } = useStyles({ isDashboard })

    const totalFarmRewardNum = Number.parseFloat(totalFarmReward)
    const attraceFeesPercent = 5
    const attraceFee = (totalFarmRewardNum * attraceFeesPercent) / 100
    const totalDeposit = totalFarmRewardNum + attraceFee

    return (
        <div className={classes.depositRoot}>
            <Typography>
                <br />
                <Grid container justifyContent="space-between" rowSpacing="20px">
                    <Grid xs={12}>
                        <b>{t('plugin_referral_deposit_total_rewards')}</b>
                    </Grid>
                    <Grid item xs={6}>
                        {t('plugin_referral_total_farm_rewards')}
                    </Grid>
                    <Grid item xs={6} display="flex" justifyContent="right">
                        {totalFarmReward} {rewardTokenSymbol}
                    </Grid>
                    <Grid item xs={6}>
                        {t('plugin_referral_attrace_fees')}
                    </Grid>
                    <Grid item xs={6} display="flex" justifyContent="right">
                        {attraceFee} {rewardTokenSymbol}
                    </Grid>
                    <Grid item xs={6}>
                        {t('plugin_referral_deposit_total')}
                    </Grid>
                    <Grid item xs={6} display="flex" justifyContent="right">
                        {totalFarmRewardNum + attraceFee} {rewardTokenSymbol}
                    </Grid>
                    <Grid item xs={12}>
                        <EthereumChainBoundary chainId={requiredChainId} noSwitchNetworkTip>
                            <ActionButton
                                fullWidth
                                variant="contained"
                                size="large"
                                disabled={isTransactionProcessing}
                                onClick={async () => {
                                    await onDeposit()
                                }}>
                                {!isTransactionProcessing ? (
                                    <div>
                                        Deposit {totalDeposit} {rewardTokenSymbol}
                                    </div>
                                ) : (
                                    <CircularProgress size={20} />
                                )}
                            </ActionButton>
                        </EthereumChainBoundary>
                    </Grid>
                </Grid>
            </Typography>
        </div>
    )
}

interface CreateFarmProps {
    onClose?: () => void
    continue: (currentPage: PagesType, nextPage: PagesType) => void
}

export function CreateFarm(props: CreateFarmProps) {
    const { t } = useI18N()
    const currentChainId = useChainId()
    const isDashboard = isDashboardPage()
    const { classes } = useStyles({ isDashboard })

    const [chainId, setChainId] = useState<ChainId>(currentChainId)
    const [tab, setTab] = useState<string>(TabsCreateFarm.NEW)
    const [createFarm, setCreateFarm] = useState(false)

    // #region select token
    const {
        amount,
        token: referredToken,
        balance,
        setAmount,
        setToken: setReferredTokenToken,
    } = useFungibleTokenWatched()
    const {
        amount: rewardAmount,
        token: rewardToken,
        balance: rewardBalance,
        setAmount: setRewardAmount,
        setToken: setRewardToken,
    } = useFungibleTokenWatched()

    const [transactionHash, setTransactionHash] = useState<string | null>(null)
    // const [transactionState, setTransactionState] = useState<TransactionState | null>(null)
    const [dailyFarmReward, setDailyFarmReward] = useState<string>('')
    const [totalFarmReward, setTotalFarmReward] = useState<string>('')
    const [id] = useState(uuid())
    const [focusedTokenPanelType, setFocusedTokenPanelType] = useState(TokenType.REFER)
    const requiredChainId = ChainId.Rinkeby
    const web3 = useWeb3({ chainId: requiredChainId })
    const account = useAccount()
    const [isTransactionConfirmed, setTransactionConfirmed] = useState(false)
    const [isTransactionProcessing, setTransactionProcessing] = useState(false)

    // const [selectedReferralData, setSelectedReferralData] = useState<ReferralMetaData | null>(null)
    const { attachMetadata, dropMetadata } = useCompositionContext()
    const currentIdentity = useCurrentIdentity()
    const senderName = currentIdentity?.identifier.userId ?? currentIdentity?.linkedPersona?.nickname ?? 'Unknown User'

    const { closeDialog: closeWalletStatusDialog } = useRemoteControlledDialog(
        WalletMessages.events.walletStatusDialogUpdated,
    )

    const onDeposit = useCallback(async () => {
        if (!referredToken?.value?.address || !rewardToken?.value?.address) {
            return alert('TOKEN DID NOT SELECT')
        }

        if (referredToken.value.address !== NATIVE_TOKEN) {
            const { address: rewardTokenAddr } = rewardToken.value
            const { address: referredTokenAddr } = referredToken.value
            const totalFarmRewardNum = Number.parseFloat(totalFarmReward)
            const dailyFarmRewardNum = Number.parseFloat(dailyFarmReward)

            if (rewardToken.value.address === NATIVE_TOKEN) {
                await runCreateNativeFarm(
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
                    rewardTokenAddr,
                    referredTokenAddr,
                    totalFarmRewardNum,
                    dailyFarmRewardNum,
                )
            } else {
                await runCreateERC20PairFarm(
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
                    rewardTokenAddr,
                    referredTokenAddr,
                    totalFarmRewardNum,
                    dailyFarmRewardNum,
                )
            }
        } else {
            alert("CAN'T CREATE NATIVE TOKEN FARM")
        }
    }, [web3, account, rewardToken, referredToken, totalFarmReward, dailyFarmReward])

    const onInsertData = useCallback(() => {
        if (!referredToken?.value?.address) {
            return alert('REFERRED TOKEN DID NOT SELECT')
        }

        const { address, name = '', symbol = '', logoURI = [''] } = referredToken.value
        const selectedReferralData = {
            referral_token: address,
            referral_token_name: name,
            referral_token_symbol: symbol,
            referral_token_icon: logoURI,
            sender: senderName ?? '',
        }
        if (selectedReferralData) {
            attachMetadata(REFERRAL_META_KEY, JSON.parse(JSON.stringify(selectedReferralData)))
        } else {
            dropMetadata(REFERRAL_META_KEY)
        }

        closeWalletStatusDialog()
        props.onClose?.()
    }, [])

    const onUpdateByRemote = useCallback(
        (ev: SelectTokenUpdated) => {
            if (ev.open || !ev.token || ev.uuid !== id) return

            if (focusedTokenPanelType === TokenType.REFER) {
                setReferredTokenToken(ev.token)
            } else {
                setRewardToken(ev.token)
            }
        },
        [id, focusedTokenPanelType],
    )

    const { setDialog: setSelectTokenDialog } = useRemoteControlledDialog(
        PluginReferralMessages.selectTokenUpdated,
        onUpdateByRemote,
    )

    const onTokenSelectClick = useCallback(
        (type: TokenType, title: string) => {
            setFocusedTokenPanelType(type)
            setSelectTokenDialog({
                open: true,
                uuid: id,
                title: title,
            })
        },
        [id, focusedTokenPanelType],
    )
    // #endregion

    const clickCreateFarm = () => {
        if (referredToken?.value?.address !== NATIVE_TOKEN) {
            setCreateFarm(true)
        } else {
            alert("CAN'T CREATE NATIVE TOKEN FARM")
        }
    }

    if (isTransactionProcessing) {
        return <Transaction status={TransactionStatus.CONFIRMATION} />
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

    if (createFarm) {
        return (
            <Deposit
                totalFarmReward={totalFarmReward}
                rewardTokenSymbol={rewardToken.value?.symbol}
                isTransactionProcessing={isTransactionProcessing}
                onDeposit={onDeposit}
                requiredChainId={requiredChainId}
            />
        )
    }

    const createFarmBtnDisabled =
        !referredToken.value?.address || !rewardToken.value?.address || !totalFarmReward || !dailyFarmReward

    return (
        <div>
            <Box className={classes.container}>
                <TabContext value={String(tab)}>
                    <Tabs
                        value={tab}
                        centered
                        variant="fullWidth"
                        onChange={(e, v) => setTab(v)}
                        aria-label="persona-post-contacts-button-group">
                        <Tab value={TabsCreateFarm.NEW} label="New" />
                        <Tab value={TabsCreateFarm.CREATED} label="Created" />
                    </Tabs>
                    <TabPanel value={TabsCreateFarm.NEW} className={classes.tab}>
                        <Grid container />
                        <Typography>
                            <b>{t('plugin_referral_create_referral_farm_desc')}</b>
                            <br />
                            <br />
                            {t('plugin_referral_select_a_token_desc')}
                            <br />
                            <br />
                            <Grid container justifyContent="space-around" alignItems="center" rowSpacing="20px">
                                <Grid item xs={6} justifyContent="center" display="flex">
                                    <TokenSelectField
                                        label={t('plugin_referral_token_to_refer')}
                                        token={referredToken?.value}
                                        onClick={() => {
                                            onTokenSelectClick(
                                                TokenType.REFER,
                                                t('plugin_referral_select_a_token_to_refer'),
                                            )
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={6} justifyContent="center" display="flex">
                                    <TokenSelectField
                                        label={t('plugin_referral_reward_token')}
                                        token={rewardToken?.value}
                                        onClick={() => {
                                            onTokenSelectClick(
                                                TokenType.REWARD,
                                                t('plugin_referral_select_a_reward_token'),
                                            )
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={6} justifyContent="center" display="flex" alignItems="end">
                                    <Box>
                                        <TextField
                                            required
                                            label={t('plugin_referral_daily_farm_reward')}
                                            value={dailyFarmReward}
                                            onChange={(e) => setDailyFarmReward(e.currentTarget.value)}
                                            inputMode="numeric"
                                            type="number"
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                        />
                                    </Box>

                                    <Box paddingX={1}>{rewardToken?.value?.symbol}</Box>
                                </Grid>
                                <Grid item xs={6} justifyContent="center" display="flex" alignItems="end">
                                    <Box justifyContent="center">
                                        <TextField
                                            label={t('plugin_referral_total_farm_rewards')}
                                            value={totalFarmReward}
                                            inputMode="numeric"
                                            type="number"
                                            onChange={(e) => setTotalFarmReward(e.currentTarget.value)}
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                        />
                                    </Box>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                            alignItems: 'flex-start',
                                        }}>
                                        <Typography
                                            className={classes.balance}
                                            color="textSecondary"
                                            variant="body2"
                                            component="span">
                                            {t('wallet_balance')}:
                                            <FormattedBalance
                                                value={rewardBalance?.value ?? '0'}
                                                decimals={rewardToken?.value?.decimals}
                                                significant={6}
                                                formatter={formatBalance}
                                            />
                                        </Typography>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                marginTop: 2,
                                            }}>
                                            <Box paddingX={1}>{rewardToken?.value?.symbol}</Box>
                                            {rewardBalance?.value !== '0' ? (
                                                <Chip
                                                    size="small"
                                                    label="MAX"
                                                    clickable
                                                    color="primary"
                                                    variant="outlined"
                                                    onClick={() => {
                                                        setTotalFarmReward(
                                                            formatBalance(
                                                                rewardBalance?.value ?? '',
                                                                rewardToken?.value?.decimals,
                                                                6,
                                                            ),
                                                        )
                                                    }}
                                                />
                                            ) : null}
                                        </Box>
                                    </Box>
                                </Grid>
                            </Grid>

                            <br />
                            <EthereumChainBoundary chainId={requiredChainId} noSwitchNetworkTip>
                                <ActionButton
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    disabled={createFarmBtnDisabled}
                                    onClick={() => {
                                        clickCreateFarm()
                                    }}>
                                    {t('plugin_referral_create_referral_farm')}
                                </ActionButton>
                            </EthereumChainBoundary>
                        </Typography>
                    </TabPanel>
                    <TabPanel value={TabsCreateFarm.CREATED} className={classes.tab}>
                        <CreatedFarms />
                    </TabPanel>
                </TabContext>
            </Box>
        </div>
    )
}
