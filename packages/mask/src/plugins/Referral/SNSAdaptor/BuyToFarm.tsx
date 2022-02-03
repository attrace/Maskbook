import { useCallback, useState, useEffect } from 'react'
import { useAsync } from 'react-use'

import { v4 as uuid } from 'uuid'

import { useI18N } from '../../../utils'
import {
    ChainId,
    useAccount,
    useChainId,
    useWeb3,
    useFungibleTokenWatched,
    EthereumTokenType,
} from '@masknet/web3-shared-evm'
import { isDashboardPage } from '@masknet/shared-base'
import { makeStyles } from '@masknet/theme'
import { useRemoteControlledDialog } from '@masknet/shared'

import { MASK_REFERRER } from '../constants'
import { singAndPostProofWithReferrer } from '../Worker/apis/proofs'
import { getAllFarms } from '../Worker/apis/farms'

import { TabsCreateFarm, PagesType, TransactionStatus, FARM_TYPE, Farm, ChainAddress } from '../types'

import { Typography, Box, Tab, Tabs, Grid } from '@mui/material'
import { TabContext, TabPanel } from '@mui/lab'
import ActionButton from '../../../extension/options-page/DashboardComponents/ActionButton'
import { EthereumChainBoundary } from '../../../web3/UI/EthereumChainBoundary'
import { Transaction } from './shared-ui/Transaction'
import { TokenSelectField } from './shared-ui/TokenSelectField'
import { IconURLS } from './IconURL'
import { MyFarmsBuyer } from './MyFarmsBuyer'

import { PluginReferralMessages, SelectTokenToBuy } from '../messages'
import { toChainAddress } from './helpers'

const useStyles = makeStyles<{ isDashboard: boolean }>()((theme, { isDashboard }) => ({
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
    subtitle: {
        margin: '12px 0 24px',
    },
    rewardItem: {
        width: '100%',
        fontWeight: 500,
    },
    rewardItemValue: {
        marginTop: '4px',
        fontWeight: 600,
    },
    typeNote: {
        marginBottom: '24px',
        '& img': {
            marginRight: '7px',
        },
        '& b': {
            marginRight: '4px',
            fontWeight: 600,
        },
    },
}))

export interface BuyToFarmProps extends React.PropsWithChildren<{}> {
    onClose?: () => void
    continue: (currentPage: PagesType, nextPage: PagesType) => void
}

export function BuyToFarm(props: BuyToFarmProps) {
    const { t } = useI18N()
    const currentChainId = useChainId()
    const isDashboard = isDashboardPage()
    const { classes } = useStyles({ isDashboard })
    // TODO: change requiredChainId
    const requiredChainId = ChainId.Rinkeby
    const web3 = useWeb3({ chainId: requiredChainId })
    const account = useAccount()

    // TODO: why do we need chainId and currentChainId?
    const [chainId, setChainId] = useState<ChainId>(currentChainId)
    const [tab, setTab] = useState<string>(TabsCreateFarm.NEW)
    const [selectedFarm, setSelectedFarm] = useState<Farm>()
    const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>()

    // fetch all farms
    const { value: farms = [], loading: loadingAllFarms } = useAsync(
        async () => getAllFarms(web3, currentChainId),
        [currentChainId],
    )
    const pairTokenFarms: Farm[] = farms.filter((farm) => farm.farmType === FARM_TYPE.PAIR_TOKEN)
    const referredTokensDefn: ChainAddress[] = farms.map((farm) => farm.referredTokenDefn)

    // #region select token
    const { token, setToken } = useFungibleTokenWatched({
        type: EthereumTokenType.Native,
        address: '',
    })
    const [id] = useState(uuid())
    const { setDialog: setSelectTokenDialog } = useRemoteControlledDialog(
        PluginReferralMessages.selectTokenToBuy,
        useCallback(
            (ev: SelectTokenToBuy) => {
                if (ev.open || !ev.token || ev.uuid !== id) return
                setToken(ev.token)
            },
            [id, setToken],
        ),
    )
    const onClickTokenSelect = useCallback(() => {
        setSelectTokenDialog({
            open: true,
            uuid: id,
            title: t('plugin_referral_select_a_token_to_buy_and_hold'),
            tokensChainAddrs: referredTokensDefn,
        })
    }, [id, setToken, pairTokenFarms])
    // #endregion

    useEffect(() => {
        if (!token.value) return

        const { chainId, address } = token.value
        const farmData = farms.find((farm) => farm.referredTokenDefn === toChainAddress(chainId, address))
        if (farmData) {
            setSelectedFarm(farmData)
        }
    }, [token, farms])

    const referFarm = async () => {
        try {
            setTransactionStatus(TransactionStatus.CONFIRMATION)
            const sig = await singAndPostProofWithReferrer(web3, account, token?.value?.address ?? '', MASK_REFERRER)
            setTransactionStatus(TransactionStatus.CONFIRMED)

            // TODO: add redirect to Swap plugin
        } catch (error) {
            setTransactionStatus(TransactionStatus.FAILED)
            alert(error)
        }
    }

    if (transactionStatus === TransactionStatus.CONFIRMATION) {
        return (
            <Transaction
                status={TransactionStatus.CONFIRMATION}
                title={t('plugin_referral_transaction_complete_signature_request')}
                subtitle={t('plugin_referral_transaction_sign_the_message_for_rewards')}
            />
        )
    }

    const rewardData = {
        daily_reward: selectedFarm?.dailyFarmReward,
        total_reward: selectedFarm?.totalFarmRewards,
        apr: 0,
    }

    return (
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
                    <Typography fontWeight={600} variant="h6">
                        {t('plugin_referral_select_a_token_to_buy_and_hold_and_earn_rewards')}
                    </Typography>
                    <Typography fontWeight={500} className={classes.subtitle}>
                        {t('plugin_referral_join_the_farm')}
                    </Typography>
                    <Typography>
                        <Grid
                            container
                            justifyContent="space-around"
                            display="flex"
                            alignItems="flex-start"
                            rowSpacing="24px">
                            <Grid item xs={6} justifyContent="center" display="flex">
                                <TokenSelectField
                                    label={t('plugin_referral_token_to_buy_and_hold')}
                                    token={token?.value}
                                    onClick={onClickTokenSelect}
                                />
                            </Grid>
                            <Grid item xs={6} justifyContent="center" display="flex" />
                            <Grid item xs={4} justifyContent="center" display="flex">
                                <Box className={classes.rewardItem}>
                                    {t('plugin_referral_apr_estimated')}
                                    <Typography className={classes.rewardItemValue}>{rewardData.apr || '-'}</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={4} justifyContent="center" display="flex">
                                <Box className={classes.rewardItem}>
                                    {t('plugin_referral_daily_rewards')}
                                    <Typography className={classes.rewardItemValue}>
                                        {rewardData.daily_reward || '-'}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={4} justifyContent="center" display="flex">
                                <Box className={classes.rewardItem}>
                                    {t('plugin_referral_total_farm_rewards')}
                                    <Typography className={classes.rewardItemValue}>
                                        {rewardData.total_reward || '-'}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} alignItems="center" display="flex" className={classes.typeNote}>
                                <img src={IconURLS.sponsoredFarmLogo} />
                                <Typography>
                                    <b>{t('plugin_referral_sponsored_farm')}</b>
                                    {t('plugin_referral_sponsored_farm_detail')}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Typography>
                    <EthereumChainBoundary chainId={requiredChainId} noSwitchNetworkTip>
                        <ActionButton fullWidth variant="contained" size="large" onClick={referFarm}>
                            {t('plugin_referral_buy_to_farm')}
                        </ActionButton>
                    </EthereumChainBoundary>
                </TabPanel>
                <TabPanel value={TabsCreateFarm.CREATED} className={classes.tab}>
                    <MyFarmsBuyer />
                </TabPanel>
            </TabContext>
        </Box>
    )
}
