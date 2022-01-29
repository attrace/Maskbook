import { useCallback, useEffect, useState } from 'react'
import { Typography, Box, Tab, Tabs, Grid, TextField, Link, CircularProgress } from '@mui/material'
import { TabContext, TabPanel } from '@mui/lab'

import { useI18N } from '../../../utils'
import { ChainId, useAccount, useChainId, useFungibleTokenWatched, useWeb3 } from '@masknet/web3-shared-evm'
import { isDashboardPage } from '@masknet/shared-base'
import { makeStyles } from '@masknet/theme'
import { ReferralMetaData, TabsCreateFarm, TokenType } from '../types'
import ActionButton from '../../../extension/options-page/DashboardComponents/ActionButton'
import { EthereumChainBoundary } from '../../../web3/UI/EthereumChainBoundary'

import { SelectTokenChip, useRemoteControlledDialog } from '@masknet/shared'
import { SelectTokenDialogEvent, WalletMessages } from '@masknet/plugin-wallet'
import { v4 as uuid } from 'uuid'

import DoneIcon from '@mui/icons-material/Done'
import { blue } from '@mui/material/colors'
import { NATIVE_TOKEN, REFERRAL_META_KEY } from '../constants'
import { useCompositionContext } from '@masknet/plugin-infra'

import { useCurrentIdentity } from '../../../components/DataSource/useActivatedUI'
import { runCreateERC20PairFarm, runCreateNativeFarm } from '../Worker/apis/createReferralFarm'
// import { getDaoAddress } from '../Worker/apis/discovery'
interface ReferralDialogProps {
    open: boolean
    onClose?: () => void
    onSwapDialogOpen?: () => void
}
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
}))

export function CreateFarm(props) {
    const { t } = useI18N()
    const currentChainId = useChainId()
    const [chainId, setChainId] = useState<ChainId>(currentChainId)
    const isDashboard = isDashboardPage()
    const { classes } = useStyles({ isDashboard })
    const [tab, setTab] = useState<string>(TabsCreateFarm.NEW)

    const [createFarm, setCreateFarm] = useState(false)
    const [formComplete, setFromComplete] = useState(false)
    // #region select token
    const { amount, token, balance, setAmount, setToken } = useFungibleTokenWatched()
    const {
        amount: rewardAmount,
        token: rewardToken,
        balance: rewardBalance,
        setAmount: setRewardAmount,
        setToken: setRewardToken,
    } = useFungibleTokenWatched()

    const [dailyFarmReward, setDailyFarmReward] = useState<string>('')
    const [totalFarmReward, setTotalFarmReward] = useState<string>('')
    const [id] = useState(uuid())
    const [focusedTokenPanelType, setFocusedTokenPanelType] = useState(TokenType.REFER)
    const requiredChainId = ChainId.Rinkeby
    const web3 = useWeb3(false, requiredChainId)
    const account = useAccount()
    const [isTransactionConfirmed, setTransactionConfirmed] = useState(false)
    const [isTransactionProcessing, setTransactionProcessing] = useState(false)

    // const [selectedReferralData, setSelectedReferralData] = useState<ReferralMetaData | null>(null)
    const { attachMetadata, dropMetadata } = useCompositionContext()
    const senderName = useCurrentIdentity()?.linkedPersona?.nickname

    const { closeDialog: closeWalletStatusDialog } = useRemoteControlledDialog(
        WalletMessages.events.walletStatusDialogUpdated,
    )
    const depositButton = async () => {
        if (token?.value?.address !== NATIVE_TOKEN) {
            if (rewardToken?.value?.address === NATIVE_TOKEN) {
                await runCreateNativeFarm(
                    (val: boolean) => {
                        setTransactionConfirmed(val)
                    },
                    (val: boolean) => {
                        setTransactionProcessing(val)
                    },
                    web3,
                    account,
                    rewardToken?.value?.address ?? '',
                    token?.value?.address ?? '',
                    Number.parseFloat(totalFarmReward),
                    Number.parseFloat(dailyFarmReward),
                )
            } else {
                await runCreateERC20PairFarm(
                    (val: boolean) => {
                        setTransactionConfirmed(val)
                    },
                    (val: boolean) => {
                        setTransactionProcessing(val)
                    },
                    web3,
                    account,
                    rewardToken?.value?.address ?? '',
                    token?.value?.address ?? '',
                    Number.parseFloat(totalFarmReward),
                    Number.parseFloat(dailyFarmReward),
                )
            }
        } else {
            alert("CAN'T CREATE NATIVE TOKEN FARM")
        }
    }

    const insertData = (selectedReferralData: ReferralMetaData) => {
        if (selectedReferralData) {
            attachMetadata(REFERRAL_META_KEY, JSON.parse(JSON.stringify(selectedReferralData)))
        } else {
            dropMetadata(REFERRAL_META_KEY)
        }
        closeWalletStatusDialog()
        props.onClose()
    }
    const { setDialog: setSelectTokenDialog } = useRemoteControlledDialog(
        WalletMessages.events.selectTokenDialogUpdated,
        useCallback(
            (ev: SelectTokenDialogEvent) => {
                if (ev.open || !ev.token || ev.uuid !== id) return

                if (focusedTokenPanelType === TokenType.REFER) {
                    setToken(ev.token)
                } else {
                    setRewardToken(ev.token)
                }
            },
            [id, focusedTokenPanelType],
        ),
    )
    const onSelectTokenChipClick = useCallback(
        (type: TokenType) => {
            setFocusedTokenPanelType(type)
            setSelectTokenDialog({
                open: true,
                uuid: id,
            })
        },
        [id, focusedTokenPanelType],
    )
    // #endregion

    useEffect(() => {
        if (
            token.value?.address !== null &&
            rewardToken.value?.address !== null &&
            dailyFarmReward !== '' &&
            totalFarmReward !== '' &&
            totalFarmReward !== null &&
            dailyFarmReward !== null
        ) {
            setFromComplete(true)
        } else {
            setFromComplete(false)
        }
    }, [token, rewardToken, dailyFarmReward, totalFarmReward])
    const clickCreateFarm = () => {
        if (token?.value?.address !== NATIVE_TOKEN) {
            setCreateFarm(true)
        } else {
            alert("CAN'T CREATE NATIVE TOKEN FARM")
        }
    }
    return (
        <>
            {!isTransactionConfirmed ? (
                !createFarm ? (
                    <div>
                        <Box className={classes.container}>
                            <TabContext value={String(tab)}>
                                <Tabs
                                    value={tab}
                                    centered
                                    onChange={(e, v) => setTab(v)}
                                    aria-label="persona-post-contacts-button-group">
                                    <Tab value={TabsCreateFarm.NEW} label="New" />
                                    <Tab value={TabsCreateFarm.CREATED} label="Created" />
                                </Tabs>
                                <TabPanel value={TabsCreateFarm.NEW} className={classes.tab}>
                                    <Grid container />
                                    <Typography>
                                        <b>{t('create_referral_farm_desc')}</b>
                                        <br />
                                        <br />
                                        {t('select_a_token_desc')}
                                        <br />
                                        <br />

                                        <Grid
                                            container
                                            justifyContent="space-around"
                                            alignItems="center"
                                            rowSpacing="20px">
                                            <Grid item xs={6} justifyContent="center" display="flex">
                                                <SelectTokenChip
                                                    token={token?.value}
                                                    ChipProps={{
                                                        onClick: () => {
                                                            onSelectTokenChipClick(TokenType.REFER)
                                                        },
                                                        size: 'medium',
                                                        className: classes.chip,
                                                    }}
                                                />
                                            </Grid>
                                            <Grid item xs={6} justifyContent="center" display="flex">
                                                <SelectTokenChip
                                                    token={rewardToken?.value}
                                                    ChipProps={{
                                                        onClick: () => {
                                                            onSelectTokenChipClick(TokenType.REWARD)
                                                        },
                                                        size: 'medium',
                                                        className: classes.chip,
                                                    }}
                                                />
                                            </Grid>
                                            <Grid item xs={6} justifyContent="center" display="flex">
                                                <Box>
                                                    <TextField
                                                        required
                                                        label={t('daily_farm_reward')}
                                                        value={dailyFarmReward}
                                                        variant="standard"
                                                        onChange={(e) => setDailyFarmReward(e.currentTarget.value)}
                                                        inputMode="numeric"
                                                        InputLabelProps={{
                                                            shrink: true,
                                                        }}
                                                    />
                                                </Box>
                                            </Grid>
                                            <Grid item xs={6} justifyContent="center" display="flex">
                                                <Box justifyContent="center">
                                                    <TextField
                                                        label={t('total_farm_rewards')}
                                                        value={totalFarmReward}
                                                        variant="standard"
                                                        inputMode="numeric"
                                                        onChange={(e) => setTotalFarmReward(e.currentTarget.value)}
                                                        InputLabelProps={{
                                                            shrink: true,
                                                        }}
                                                    />
                                                </Box>
                                            </Grid>
                                        </Grid>

                                        <br />
                                        <EthereumChainBoundary chainId={requiredChainId} noSwitchNetworkTip>
                                            <ActionButton
                                                fullWidth
                                                variant="contained"
                                                size="large"
                                                disabled={!formComplete}
                                                onClick={() => {
                                                    clickCreateFarm()
                                                }}>
                                                Create Referral Farm
                                            </ActionButton>
                                        </EthereumChainBoundary>
                                    </Typography>
                                </TabPanel>
                                <TabPanel value={TabsCreateFarm.CREATED} className={classes.tab}>
                                    Need To Be Implemented
                                </TabPanel>
                            </TabContext>
                        </Box>
                    </div>
                ) : (
                    <div>
                        <Typography>
                            <br />
                            <Grid container justifyContent="space-between" rowSpacing="20px">
                                <Grid xs={12}>
                                    <b>Deposit Total Farm Rewards</b>
                                </Grid>
                                <Grid item xs={6}>
                                    Total Farm Rewards
                                </Grid>
                                <Grid item xs={6} display="flex" justifyContent="right">
                                    {totalFarmReward} {rewardToken?.value?.symbol}
                                </Grid>
                                <Grid item xs={6}>
                                    Attrace Protocol Fee 5%
                                </Grid>
                                <Grid item xs={6} display="flex" justifyContent="right">
                                    {(Number.parseFloat(totalFarmReward) * 5) / 100} {rewardToken?.value?.symbol}
                                </Grid>
                                <Grid item xs={6}>
                                    Deposit Total
                                </Grid>
                                <Grid item xs={6} display="flex" justifyContent="right">
                                    {Number.parseFloat(totalFarmReward) +
                                        (Number.parseFloat(totalFarmReward) * 5) / 100}{' '}
                                    {rewardToken?.value?.symbol}
                                </Grid>
                                <Grid item xs={12}>
                                    <EthereumChainBoundary chainId={requiredChainId} noSwitchNetworkTip>
                                        <ActionButton
                                            fullWidth
                                            variant="contained"
                                            size="large"
                                            disabled={isTransactionProcessing}
                                            onClick={async () => {
                                                await depositButton()
                                            }}>
                                            {!isTransactionProcessing ? (
                                                <div>
                                                    Deposit{' '}
                                                    {Number.parseFloat(totalFarmReward) +
                                                        (Number.parseFloat(totalFarmReward) * 5) / 100}{' '}
                                                    {rewardToken?.value?.symbol}
                                                </div>
                                            ) : (
                                                <CircularProgress />
                                            )}
                                        </ActionButton>
                                    </EthereumChainBoundary>
                                </Grid>
                            </Grid>
                        </Typography>
                    </div>
                )
            ) : (
                <div>
                    <Typography>
                        <Grid container textAlign="center" rowSpacing="5px" sx={{ p: 2 }}>
                            <Grid item xs={12}>
                                <DoneIcon sx={{ fontSize: 60 }} />
                            </Grid>
                            <Grid item xs={12} className={classes.heading}>
                                Your transaction was confirmed
                            </Grid>
                            <Grid item xs={12}>
                                <Link href="#">View On Explorer</Link>
                            </Grid>

                            <Grid item xs={12}>
                                <br />
                                <br />
                                <ActionButton
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    onClick={() => {
                                        insertData({
                                            referral_token: token?.value?.address ?? '',
                                            referral_token_name: token?.value?.name ?? '',
                                            referral_token_symbol: token?.value?.symbol ?? '',
                                            referral_token_icon: token?.value?.logoURI ?? [''],
                                            sender: senderName ?? '',
                                        })
                                    }}>
                                    Publish Referral Farm
                                </ActionButton>
                            </Grid>
                        </Grid>
                    </Typography>
                </div>
            )}
        </>
    )
}
