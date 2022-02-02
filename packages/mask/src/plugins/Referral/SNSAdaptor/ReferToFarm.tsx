import { useCallback, useState } from 'react'
import { Typography, Box, Tab, Tabs, Grid } from '@mui/material'
import { TabContext, TabPanel } from '@mui/lab'

import { useI18N } from '../../../utils'
import { ChainId, useAccount, useChainId, useFungibleTokenWatched, useWeb3 } from '@masknet/web3-shared-evm'
import { isDashboardPage } from '@masknet/shared-base'
import { makeStyles } from '@masknet/theme'
import { ReferralMetaData, TabsCreateFarm, TokenType, RewardData, PagesType } from '../types'
import ActionButton from '../../../extension/options-page/DashboardComponents/ActionButton'
import { EthereumChainBoundary } from '../../../web3/UI/EthereumChainBoundary'

import { SelectTokenChip, useRemoteControlledDialog } from '@masknet/shared'
import { SelectTokenDialogEvent, WalletMessages } from '@masknet/plugin-wallet'
import { v4 as uuid } from 'uuid'

import { blue } from '@mui/material/colors'
import { MASK_SWAP_V1, REFERRAL_META_KEY } from '../constants'
import { useCompositionContext } from '@masknet/plugin-infra'
import { useCurrentIdentity } from '../../../components/DataSource/useActivatedUI'
import { runCreateReferralLink } from '../Worker/apis/createReferralFarm'
// import { getDaoAddress } from '../Worker/apis/discovery'

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
    const requiredChainId = ChainId.Rinkeby
    const web3 = useWeb3({ chainId: requiredChainId })
    const account = useAccount()

    const { attachMetadata, dropMetadata } = useCompositionContext()

    const { closeDialog: closeWalletStatusDialog } = useRemoteControlledDialog(
        WalletMessages.events.walletStatusDialogUpdated,
    )

    const senderName = useCurrentIdentity()?.linkedPersona?.nickname

    const { setDialog: setSelectTokenDialog } = useRemoteControlledDialog(
        WalletMessages.events.selectTokenDialogUpdated,
        useCallback(
            (ev: SelectTokenDialogEvent) => {
                if (ev.open || !ev.token || ev.uuid !== id) return
                setToken(ev.token)
            },
            [id, setToken],
        ),
    )
    const onSelectTokenChipClick = useCallback(
        (type: TokenType) => {
            setSelectTokenDialog({
                open: true,
                uuid: id,
            })
        },
        [id, setToken],
    )
    // #endregion

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
            const sig = await runCreateReferralLink(web3, account, token?.value?.address ?? '', MASK_SWAP_V1)
            insertData({
                referral_token: token?.value?.address ?? '',
                referral_token_name: token?.value?.name ?? '',
                referral_token_symbol: token?.value?.symbol ?? '',
                referral_token_icon: token?.value?.logoURI ?? [''],
                sender: senderName ?? '',
            })
        } catch (error) {
            alert(error)
        }
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
                                                    onSelectTokenChipClick(TokenType.REFER)
                                                },
                                                size: 'medium',
                                                className: classes.chip,
                                            }}
                                        />
                                    </Grid>

                                    <Grid item xs={6} justifyContent="center" display="flex" />
                                    <Grid item xs={12}>
                                        <b>{t('plugin_referral_sponsered_referral_farm')}</b>
                                    </Grid>
                                    <Grid item xs={4} justifyContent="center" display="flex">
                                        <Box>
                                            {t('plugin_referral_apr_estimated')}
                                            <br />
                                            <b>{rewardData.apr}</b>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={4} justifyContent="center" display="flex">
                                        <Box>
                                            {t('plugin_referral_daily_rewards')}

                                            <br />
                                            <b>{rewardData.daily_reward}</b>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={4} justifyContent="center" display="flex">
                                        <Box>
                                            {t('plugin_referral_total_farm_rewards')}
                                            <br />
                                            <b>{rewardData.total_reward}</b>
                                        </Box>
                                    </Grid>
                                    {attraceRewardData !== null ? (
                                        <div>
                                            <Grid item xs={12}>
                                                <b>{t('plugin_referral_attrace_referral_farm')}</b>
                                            </Grid>

                                            <Grid item xs={4} justifyContent="center" display="flex">
                                                <Box>
                                                    {t('plugin_referral_apr')}
                                                    <br />
                                                    <b>{rewardData.apr}</b>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={4} justifyContent="center" display="flex">
                                                <Box>
                                                    {t('plugin_referral_daily_rewards')}

                                                    <br />
                                                    <b>{rewardData.daily_reward}</b>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={4} justifyContent="center" display="flex">
                                                <Box>
                                                    {t('plugin_referral_total_farm_rewards')}
                                                    <br />
                                                    <b>{rewardData.total_reward}</b>
                                                </Box>
                                            </Grid>
                                        </div>
                                    ) : null}
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
                                    Refer to Farm
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
