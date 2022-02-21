import { useCallback, useState } from 'react'
import { useAsync } from 'react-use'

import { v4 as uuid } from 'uuid'

import { useI18N } from '../../../utils'
import { useAccount, useChainId, useWeb3, FungibleTokenDetailed } from '@masknet/web3-shared-evm'
import { isDashboardPage } from '@masknet/shared-base'
import { makeStyles } from '@masknet/theme'
import { useRemoteControlledDialog } from '@masknet/shared'

import { MASK_REFERRER } from '../constants'
import { singAndPostProofWithReferrer } from '../Worker/apis/proofs'
import { getAllFarms } from '../Worker/apis/farms'
import { getFarmsAPR } from '../Worker/apis/verifier'

import {
    TabsCreateFarm,
    TransactionStatus,
    FARM_TYPE,
    Farm,
    ChainAddress,
    PageInterface,
    PagesType,
    Icons,
    parseChainAddress,
} from '../types'

import { Typography, Box, Tab, Tabs, Grid, Divider } from '@mui/material'
import { TabContext, TabPanel } from '@mui/lab'
import ActionButton from '../../../extension/options-page/DashboardComponents/ActionButton'
import { EthereumChainBoundary } from '../../../web3/UI/EthereumChainBoundary'
import { Transaction } from './shared-ui/Transaction'
import { TokenSelectField } from './shared-ui/TokenSelectField'
import { MyFarms } from './MyFarms'
import { RewardDataWidget } from './shared-ui/RewardDataWidget'

import { PluginReferralMessages, SelectTokenUpdated } from '../messages'
import { toChainAddress, getFarmsRewardData } from './helpers'
import { PluginTraderMessages } from '../../Trader/messages'
import type { Coin } from '../../Trader/types'
import { useRequiredChainId } from './hooks/useRequiredChainId'
import { SvgIcons } from './Icons'

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
    typeNote: {
        marginBottom: '20px',
        '& b': {
            marginRight: '4px',
            fontWeight: 600,
        },
    },
}))

export function BuyToFarm(props: PageInterface) {
    const { t } = useI18N()
    const isDashboard = isDashboardPage()
    const { classes } = useStyles({ isDashboard })
    const currentChainId = useChainId()

    const requiredChainId = useRequiredChainId(currentChainId)
    const web3 = useWeb3()
    const account = useAccount()

    const [tab, setTab] = useState<string>(TabsCreateFarm.NEW)
    const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>()

    // fetch all farms
    const { value: farms = [], loading: loadingAllFarms } = useAsync(async () => getAllFarms(web3, currentChainId), [])
    const pairTokenFarms: Farm[] = farms.filter((farm) => farm.farmType === FARM_TYPE.PAIR_TOKEN)

    const referredTokensDefn: ChainAddress[] = pairTokenFarms.map((farm) => farm.referredTokenDefn)
    // select uniq tokens
    const uniqReferredTokensDefn = [...new Set(referredTokensDefn)]
    const tokenList = uniqReferredTokensDefn.map((referredTokenDefn) => parseChainAddress(referredTokenDefn).address)

    // fetch farms APR
    const { value: farmsAPR, loading: loadingFarmsAPR } = useAsync(async () => getFarmsAPR({}), [])

    const [token, setToken] = useState<FungibleTokenDetailed>()

    const [id] = useState(uuid())
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
    const onClickTokenSelect = useCallback(() => {
        setSelectTokenDialog({
            open: true,
            uuid: id,
            title: t('plugin_referral_select_a_token_to_buy_and_hold'),
            tokenList,
        })
    }, [id, setToken, tokenList])
    // #endregion

    const { setDialog: openSwapDialog } = useRemoteControlledDialog(PluginTraderMessages.swapDialogUpdated)

    const swapToken = useCallback(() => {
        if (!token) return
        openSwapDialog({
            open: true,
            traderProps: {
                coin: {
                    id: token?.address,
                    name: token?.name ?? '',
                    symbol: token?.symbol ?? '',
                    contract_address: token?.address,
                    decimals: token?.decimals,
                } as Coin,
            },
        })
    }, [token, openSwapDialog])

    const referFarm = async () => {
        try {
            setTransactionStatus(TransactionStatus.CONFIRMATION)
            const sig = await singAndPostProofWithReferrer(web3, account, token?.address ?? '', MASK_REFERRER)
            setTransactionStatus(TransactionStatus.CONFIRMED)

            swapToken()
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
    const referredTokenFarms = token
        ? pairTokenFarms.filter((farm) => farm.referredTokenDefn === toChainAddress(token.chainId, token.address))
        : []
    const rewardData = getFarmsRewardData(referredTokenFarms, farmsAPR)

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
                                    token={token}
                                    onClick={onClickTokenSelect}
                                />
                            </Grid>
                            <Grid item xs={6} justifyContent="center" display="flex" />
                            {!token ? (
                                <RewardDataWidget />
                            ) : (
                                <RewardDataWidget
                                    title={t('plugin_referral_sponsored_farm')}
                                    icon={Icons.SponsoredFarmIcon}
                                    rewardData={rewardData}
                                    tokenSymbol={token?.symbol}
                                />
                            )}
                            <Grid item xs={12}>
                                <Box marginTop="7px">
                                    <Divider />
                                </Box>
                            </Grid>
                            <Grid item xs={12} display="flex" alignItems="center" className={classes.typeNote}>
                                <Box marginRight="7px">
                                    <SvgIcons icon={Icons.SponsoredFarmIcon} />
                                </Box>
                                <Typography>
                                    <b>{t('plugin_referral_sponsored_farm')}</b>
                                    {t('plugin_referral_sponsored_farm_detail')}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Typography>
                    <EthereumChainBoundary chainId={requiredChainId} noSwitchNetworkTip>
                        <ActionButton fullWidth variant="contained" size="large" onClick={referFarm} disabled={!token}>
                            {t('plugin_referral_buy_to_farm')}
                        </ActionButton>
                    </EthereumChainBoundary>
                </TabPanel>
                <TabPanel value={TabsCreateFarm.CREATED} className={classes.tab}>
                    <MyFarms pageType={PagesType.REFER_TO_FARM} {...props} />
                </TabPanel>
            </TabContext>
        </Box>
    )
}
