import { useCallback, useState } from 'react'
import { Typography, Box, Tab, Tabs, Grid, Divider } from '@mui/material'
import { TabContext, TabPanel } from '@mui/lab'

import { useI18N } from '../../../utils'
import { ChainId, useAccount, useChainId, useFungibleTokenWatched, useWeb3 } from '@masknet/web3-shared-evm'
import { isDashboardPage } from '@masknet/shared-base'
import { makeStyles } from '@masknet/theme'
import { ReferralMetaData, TabsCreateFarm, RewardData, PagesType, TransactionStatus } from '../types'
import ActionButton from '../../../extension/options-page/DashboardComponents/ActionButton'
import { EthereumChainBoundary } from '../../../web3/UI/EthereumChainBoundary'

import { SelectTokenChip, useRemoteControlledDialog } from '@masknet/shared'
import { WalletMessages } from '@masknet/plugin-wallet'
import { v4 as uuid } from 'uuid'

import { blue } from '@mui/material/colors'
import { MASK_SWAP_V1, REFERRAL_META_KEY } from '../constants'
import { useCompositionContext } from '@masknet/plugin-infra'
import { useCurrentIdentity } from '../../../components/DataSource/useActivatedUI'
import { runCreateReferralLink } from '../Worker/apis/createReferralFarm'
import { Transaction } from './shared-ui/Transaction'
import { PluginReferralMessages, SelectTokenUpdated } from '../messages'
import { IconURLS } from './IconURL'

const useStyles = makeStyles<{ isDashboard: boolean }>()((theme, { isDashboard }) => ({
    walletStatusBox: {
        width: 535,
        margin: '24px auto',
    },

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
    icon: {
        width: '20px',
        height: '20px',
    },
}))

export interface ReferToFarmProps extends React.PropsWithChildren<{}> {
    onClose?: () => void
    continue: (currentPage: PagesType, nextPage: PagesType) => void
}

export function ReferToFarm(props: ReferToFarmProps) {
    const { t } = useI18N()
    const currentChainId = useChainId()
    const [chainId, setChainId] = useState<ChainId>(currentChainId)
    const isDashboard = isDashboardPage()
    const { classes } = useStyles({ isDashboard })
    const [tab, setTab] = useState<string>(TabsCreateFarm.NEW)

    // #region select token
    const { amount, token, balance, setAmount, setToken } = useFungibleTokenWatched()

    const [id] = useState(uuid())
    const [rewardData, setRewardData] = useState<RewardData>({
        apr: '42%',
        daily_reward: '1 wETH',
        total_reward: '5 wETH',
    })
    const [attraceRewardData, setAttraceRewardData] = useState<RewardData | null>(null)
    const [isTransactionProcessing, setIsTransactionProcessing] = useState<boolean>(false)
    const requiredChainId = ChainId.Rinkeby
    const web3 = useWeb3({ chainId: requiredChainId })
    const account = useAccount()

    const { attachMetadata, dropMetadata } = useCompositionContext()

    const { closeDialog: closeWalletStatusDialog } = useRemoteControlledDialog(
        WalletMessages.events.walletStatusDialogUpdated,
    )

    const currentIdentity = useCurrentIdentity()
    const senderName = currentIdentity?.identifier.userId ?? currentIdentity?.linkedPersona?.nickname ?? 'Unknown User'
    const { setDialog: setSelectTokenDialog } = useRemoteControlledDialog(
        PluginReferralMessages.selectTokenUpdated,
        useCallback(
            (ev: SelectTokenUpdated) => {
                if (ev.open || !ev.token || ev.uuid !== id) return
                setToken(ev.token)
            },
            [id, setToken],
        ),
    )
    const onSelectTokenChipClick = useCallback(() => {
        setSelectTokenDialog({
            open: true,
            uuid: id,
            title: t('plugin_referral_select_a_token_to_refer'),
        })
    }, [id, setToken])
    // #endregion
    const farm_category_types = [
        {
            title: t('plugin_referral_attrace_referral_farm'),
            desc: t('plugin_referral_attrace_referral_farm_desc'),
            icon: <img className={classes.icon} src={IconURLS.attrLogo} />,
        },
        {
            title: t('plugin_referral_mask_referral_farm'),
            desc: t('plugin_referral_mask_referral_farm_desc'),
            icon: <img className={classes.icon} src={IconURLS.maskLogo} />,
        },
        {
            title: t('plugin_referral_sponsored_referral_farm'),
            desc: t('plugin_referral_sponsored_referral_farm_desc'),
            icon: <img className={classes.icon} src={IconURLS.sponsoredFarmLogo} />,
        },
        {
            title: t('plugin_referral_under_review'),
            desc: t('plugin_referral_under_review_desc'),
            icon: <img className={classes.icon} src={IconURLS.underReviewLogo} />,
        },
    ]
    const insertData = (selectedReferralData: ReferralMetaData) => {
        if (selectedReferralData) {
            attachMetadata(REFERRAL_META_KEY, JSON.parse(JSON.stringify(selectedReferralData)))
        } else {
            dropMetadata(REFERRAL_META_KEY)
        }
        closeWalletStatusDialog()
        props.onClose?.()
    }
    const referFarm = async () => {
        try {
            setIsTransactionProcessing(true)
            const sig = await runCreateReferralLink(web3, account, token?.value?.address ?? '', MASK_SWAP_V1)
            setIsTransactionProcessing(false)
            insertData({
                referral_token: token?.value?.address ?? '',
                referral_token_name: token?.value?.name ?? '',
                referral_token_symbol: token?.value?.symbol ?? '',
                referral_token_icon: token?.value?.logoURI ?? [''],
                sender: senderName ?? '',
            })
        } catch (error) {
            setIsTransactionProcessing(false)
            alert(error)
        }
    }
    if (isTransactionProcessing) {
        return <Transaction status={TransactionStatus.CONFIRMATION} />
    }

    const referralFarmWidget = (data: RewardData, title: string, icon: string) => {
        return (
            <>
                <Grid item xs={12} container>
                    <img className={classes.icon} src={icon} />
                    <Grid item paddingX={1}>
                        <b>{title}</b>
                    </Grid>
                </Grid>

                <Grid item xs={4} justifyContent="center" display="flex">
                    <Box>
                        {t('plugin_referral_apr')}
                        <br />
                        <b>{data.apr}</b>
                    </Box>
                </Grid>
                <Grid item xs={4} justifyContent="center" display="flex">
                    <Box>
                        {t('plugin_referral_daily_rewards')}

                        <br />
                        <b>{data.daily_reward}</b>
                    </Box>
                </Grid>
                <Grid item xs={4} justifyContent="center" display="flex">
                    <Box>
                        {t('plugin_referral_total_farm_rewards')}
                        <br />
                        <b>{data.total_reward}</b>
                    </Box>
                </Grid>
            </>
        )
    }

    return (
        <>
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
                            <Tab value={TabsCreateFarm.CREATED} label="My Farms" />
                        </Tabs>
                        <TabPanel value={TabsCreateFarm.NEW} className={classes.tab}>
                            <Grid container />
                            <Typography>
                                <b>{t('plugin_referral_select_token_refer')}</b>
                                <br />
                                <br />
                                {t('plugin_referral_select_token_refer_desc')}
                            </Typography>
                            <Typography>
                                <Grid
                                    container
                                    justifyContent="space-around"
                                    display="flex"
                                    alignItems="flex-start"
                                    rowSpacing="20px">
                                    <Grid item xs={6} justifyContent="center" display="flex">
                                        <SelectTokenChip
                                            token={token?.value}
                                            ChipProps={{
                                                onClick: () => {
                                                    onSelectTokenChipClick()
                                                },
                                                size: 'medium',
                                                className: classes.chip,
                                            }}
                                        />
                                    </Grid>
                                    {referralFarmWidget(
                                        rewardData,
                                        t('plugin_referral_sponsored_referral_farm'),
                                        IconURLS.sponsoredFarmLogo,
                                    )}
                                    {attraceRewardData !== null
                                        ? referralFarmWidget(
                                              attraceRewardData,
                                              t('plugin_referral_attrace_referral_farm'),
                                              IconURLS.attrLogo,
                                          )
                                        : null}
                                </Grid>
                                <Box paddingY={2}>
                                    <Divider />
                                </Box>
                                <Grid container rowSpacing={0.5}>
                                    {farm_category_types.map((category) => {
                                        return (
                                            <>
                                                <Grid item xs={12} container columnSpacing={1}>
                                                    <Grid item>{category.icon}</Grid>
                                                    <Grid item>
                                                        <b>{category.title}</b> - {category.desc}
                                                    </Grid>
                                                </Grid>
                                            </>
                                        )
                                    })}
                                </Grid>
                            </Typography>

                            <br />
                            <EthereumChainBoundary chainId={requiredChainId} noSwitchNetworkTip>
                                <ActionButton
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    onClick={async () => {
                                        await referFarm()
                                    }}>
                                    {t('plugin_referral_refer_to_farm')}
                                </ActionButton>
                            </EthereumChainBoundary>
                        </TabPanel>
                        <TabPanel value={TabsCreateFarm.CREATED} className={classes.tab}>
                            Item 2
                        </TabPanel>
                    </TabContext>
                </Box>
            </div>
        </>
    )
}
