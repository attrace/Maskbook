import { useCallback, useState } from 'react'
import { useAsync } from 'react-use'
import { FungibleTokenDetailed, useAccount, useChainId, useWeb3 } from '@masknet/web3-shared-evm'
import { isDashboardPage } from '@masknet/shared-base'
import { makeStyles, useCustomSnackbar } from '@masknet/theme'
import { useRemoteControlledDialog } from '@masknet/shared-base-ui'
import { Typography, Box, Tab, Tabs, Grid, Divider } from '@mui/material'
import { TabContext, TabPanel } from '@mui/lab'
import { v4 as uuid } from 'uuid'

import { useI18N } from '../../../utils'
import { useRequiredChainId } from './hooks/useRequiredChainId'
import { singAndPostProofOfRecommendationWithReferrer } from '../Worker/apis/proofOfRecommendation'
import { PluginReferralMessages, SelectTokenUpdated } from '../messages'
import { PluginTraderMessages } from '../../Trader/messages'
import { getAllFarms } from '../Worker/apis/farms'
import { toChainAddress, getFarmsRewardData, parseChainAddress } from './helpers'
import { MASK_REFERRER } from '../constants'
import {
    TabsCreateFarm,
    TransactionStatus,
    PageInterface,
    PagesType,
    Icons,
    TabsReferralFarms,
    ChainAddress,
} from '../types'
import type { Coin } from '../../Trader/types'

import ActionButton from '../../../extension/options-page/DashboardComponents/ActionButton'
import { EthereumChainBoundary } from '../../../web3/UI/EthereumChainBoundary'
import { MyFarms } from './MyFarms'
import { TokenSelectField } from './shared-ui/TokenSelectField'
import { RewardDataWidget } from './shared-ui/RewardDataWidget'
import { SvgIcons } from './Icons'

import { useTabStyles, useSharedStyles } from './styles'

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
    const { classes: tabClasses } = useTabStyles()
    const { classes: sharedClasses } = useSharedStyles()
    const currentChainId = useChainId()
    const requiredChainId = useRequiredChainId(currentChainId)
    const web3 = useWeb3()
    const account = useAccount()
    const { showSnackbar } = useCustomSnackbar()

    const [tab, setTab] = useState<string>(TabsCreateFarm.NEW)
    const [id] = useState(uuid())
    const [token, setToken] = useState<FungibleTokenDetailed>()
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
    const { setDialog: openSwapDialog } = useRemoteControlledDialog(PluginTraderMessages.swapDialogUpdated)

    // fetch all farms
    const { value: farms = [] } = useAsync(async () => getAllFarms(web3, currentChainId), [])
    // get farm referred tokens defn
    const referredTokensDefn: ChainAddress[] = farms.map((farm) => farm.referredTokenDefn)
    const uniqReferredTokensDefn = [...new Set(referredTokensDefn)]
    const tokenList = uniqReferredTokensDefn.map((referredTokenDefn) => parseChainAddress(referredTokenDefn).address)

    const onClickTokenSelect = useCallback(() => {
        setSelectTokenDialog({
            open: true,
            uuid: id,
            title: t('plugin_referral_select_a_token_to_buy_and_hold'),
            tokenList,
        })
    }, [id, setToken, tokenList])

    const swapToken = useCallback(() => {
        if (!token) {
            showSnackbar(t('plugin_referral_error_token_not_select'), { variant: 'error' })
            return
        }
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

    const onConfirmReferFarm = useCallback(() => {
        props?.onChangePage?.(PagesType.TRANSACTION, t('plugin_referral_transaction'), {
            hideAttrLogo: true,
            hideBackBtn: true,
            transactionDialog: {
                transaction: {
                    status: TransactionStatus.CONFIRMATION,
                    title: t('plugin_referral_transaction_complete_signature_request'),
                    subtitle: t('plugin_referral_transaction_sign_the_message_to_register_address_for_rewards'),
                },
            },
        })
    }, [props])

    const onError = useCallback(
        (error?: string) => {
            showSnackbar(error || t('go_wrong'), { variant: 'error' })
            props?.onChangePage?.(PagesType.BUY_TO_FARM, TabsReferralFarms.TOKENS + ': ' + PagesType.BUY_TO_FARM)
        },
        [props],
    )

    const onClickBuyToFarm = useCallback(async () => {
        if (!token?.address) {
            return onError(t('plugin_referral_error_token_not_select'))
        }
        try {
            onConfirmReferFarm()
            await singAndPostProofOfRecommendationWithReferrer(web3, account, token.address, MASK_REFERRER)

            swapToken()
        } catch (error: any) {
            onError(error?.message)
        }
    }, [web3, account, token])

    const referredTokenFarms = token
        ? farms.filter((farm) => farm.referredTokenDefn === toChainAddress(token.chainId, token.address))
        : []
    const rewardData = getFarmsRewardData(referredTokenFarms)

    return (
        <Box className={classes.container}>
            <TabContext value={String(tab)}>
                <Tabs
                    value={tab}
                    centered
                    variant="fullWidth"
                    onChange={(e, v) => setTab(v)}
                    aria-label="persona-post-contacts-button-group">
                    <Tab value={TabsCreateFarm.NEW} label="New" classes={tabClasses} />
                    <Tab value={TabsCreateFarm.CREATED} label="My Farms" classes={tabClasses} />
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
                                    disabled={currentChainId !== requiredChainId}
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
                    <EthereumChainBoundary
                        chainId={requiredChainId}
                        noSwitchNetworkTip
                        classes={{ switchButton: sharedClasses.switchButton }}>
                        <ActionButton
                            fullWidth
                            variant="contained"
                            size="large"
                            onClick={onClickBuyToFarm}
                            disabled={!token}>
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
