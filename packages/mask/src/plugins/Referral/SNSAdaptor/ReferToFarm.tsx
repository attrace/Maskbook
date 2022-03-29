import { useCallback, useState } from 'react'
import { useAsync } from 'react-use'
import { FungibleTokenDetailed, useAccount, useChainId, useWeb3 } from '@masknet/web3-shared-evm'
import { isDashboardPage } from '@masknet/shared-base'
import { makeStyles, useCustomSnackbar } from '@masknet/theme'
import { useRemoteControlledDialog } from '@masknet/shared-base-ui'
import { WalletMessages } from '@masknet/plugin-wallet'
import { v4 as uuid } from 'uuid'
import { blue } from '@mui/material/colors'
import { useCompositionContext } from '@masknet/plugin-infra'
import { Typography, Box, Tab, Tabs, Grid, Divider } from '@mui/material'
import { TabContext, TabPanel } from '@mui/lab'

import { useI18N } from '../../../utils'
import { REFERRAL_META_KEY } from '../constants'
import { useCurrentIdentity } from '../../../components/DataSource/useActivatedUI'
import { useRequiredChainId } from './hooks/useRequiredChainId'
import { singAndPostProofOfRecommendationOrigin } from '../Worker/apis/proofOfRecommendation'
import { PluginReferralMessages, SelectTokenUpdated } from '../messages'
import { getAllFarms } from '../Worker/apis/farms'
import { getFarmsRewardData, getSponsoredFarmsForReferredToken, parseChainAddress } from './helpers'
import {
    ReferralMetaData,
    TabsCreateFarm,
    TransactionStatus,
    PageInterface,
    PagesType,
    Icons,
    TabsReferralFarms,
} from '../types'

import ActionButton from '../../../extension/options-page/DashboardComponents/ActionButton'
import { EthereumChainBoundary } from '../../../web3/UI/EthereumChainBoundary'
import { MyFarms } from './MyFarms'
import { TokenSelectField } from './shared-ui/TokenSelectField'
import { RewardDataWidget } from './shared-ui/RewardDataWidget'
import { SvgIcons } from './Icons'

import { useTabStyles, useSharedStyles } from './styles'

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
        maxWidth: '20px',
        maxHeight: '20px',
    },
}))

export function ReferToFarm(props: PageInterface) {
    const { t } = useI18N()
    const currentChainId = useChainId()
    const requiredChainId = useRequiredChainId(currentChainId)
    const web3 = useWeb3()
    const account = useAccount()
    const { showSnackbar } = useCustomSnackbar()
    const { attachMetadata, dropMetadata } = useCompositionContext()
    const { closeDialog: closeWalletStatusDialog } = useRemoteControlledDialog(
        WalletMessages.events.walletStatusDialogUpdated,
    )
    const currentIdentity = useCurrentIdentity()
    const senderName = currentIdentity?.identifier.userId ?? currentIdentity?.linkedPersona?.nickname ?? 'Unknown User'
    const isDashboard = isDashboardPage()
    const { classes } = useStyles({ isDashboard })
    const { classes: tabClasses } = useTabStyles()
    const { classes: sharedClasses } = useSharedStyles()

    const [tab, setTab] = useState<string>(TabsCreateFarm.NEW)
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

    // fetch all farms
    const { value: farms = [], loading: loadingAllFarms } = useAsync(async () => getAllFarms(web3, currentChainId), [])
    // token list
    const referredTokensDefn = farms.map((farm) => farm.referredTokenDefn)
    // select uniq tokens
    const uniqReferredTokensDefn = [...new Set(referredTokensDefn)]
    const tokenList = uniqReferredTokensDefn.map((referredTokenDefn) => parseChainAddress(referredTokenDefn).address)

    const onClickTokenSelect = useCallback(() => {
        setSelectTokenDialog({
            open: true,
            uuid: id,
            title: t('plugin_referral_select_a_token_to_refer'),
            tokenList,
        })
    }, [id, setToken, tokenList])

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

    const insertData = useCallback(
        (selectedReferralData: ReferralMetaData) => {
            if (selectedReferralData) {
                attachMetadata(REFERRAL_META_KEY, JSON.parse(JSON.stringify(selectedReferralData)))
            } else {
                dropMetadata(REFERRAL_META_KEY)
            }
            closeWalletStatusDialog()
            props.onClose?.()
        },
        [props],
    )

    const onError = useCallback(
        (error?: string) => {
            showSnackbar(error || t('go_wrong'), { variant: 'error' })
            props?.onChangePage?.(PagesType.REFER_TO_FARM, TabsReferralFarms.TOKENS + ': ' + PagesType.REFER_TO_FARM)
        },
        [props],
    )

    const onClickReferFarm = async () => {
        if (!token?.address) {
            return onError(t('plugin_referral_error_token_not_select'))
        }

        try {
            onConfirmReferFarm()
            await singAndPostProofOfRecommendationOrigin(web3, account, token.address)
            insertData({
                referral_token: token.address ?? '',
                referral_token_name: token?.name ?? '',
                referral_token_symbol: token?.symbol ?? '',
                referral_token_icon: token?.logoURI ?? [''],
                referral_token_chain_id: currentChainId,
                promoter_address: account,
                sender: senderName ?? '',
            })
        } catch (error: any) {
            onError(error?.message)
        }
    }

    const farm_category_types = [
        {
            title: t('plugin_referral_sponsored_referral_farm'),
            desc: t('plugin_referral_sponsored_referral_farm_desc'),
            icon: <SvgIcons size={16} icon={Icons.SponsoredFarmIcon} />,
        },
    ]
    const sponsoredFarms = getSponsoredFarmsForReferredToken(token?.chainId, token?.address, farms)

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
                    <Typography fontWeight={600} variant="h6" marginBottom="12px">
                        {t('plugin_referral_select_token_refer')}
                    </Typography>
                    <Typography marginBottom="24px">{t('plugin_referral_select_token_refer_desc')}</Typography>
                    <Grid item xs={6}>
                        <TokenSelectField
                            label={t('plugin_referral_token_to_refer')}
                            token={token}
                            disabled={currentChainId !== requiredChainId}
                            onClick={onClickTokenSelect}
                        />
                    </Grid>
                    <Typography>
                        <Grid container>
                            {(!token || loadingAllFarms || !sponsoredFarms?.length) && <RewardDataWidget />}
                            {sponsoredFarms?.length ? (
                                <RewardDataWidget
                                    title={t('plugin_referral_sponsored_referral_farm')}
                                    icon={Icons.SponsoredFarmIcon}
                                    rewardData={getFarmsRewardData(sponsoredFarms)}
                                    tokenSymbol={token?.symbol}
                                />
                            ) : null}
                        </Grid>
                        <Box paddingY={2} marginTop="7px">
                            <Divider />
                        </Box>
                        <Grid container rowSpacing={0.5} marginBottom="25px">
                            {farm_category_types.map((category) => {
                                return (
                                    <Grid item xs={12} container columnSpacing={1} key={category.title}>
                                        <Grid item display="flex" alignItems="center">
                                            {category.icon}
                                        </Grid>
                                        <Grid item display="flex">
                                            <Typography fontWeight={600} marginRight="4px">
                                                {category.title}
                                            </Typography>{' '}
                                            - {category.desc}
                                        </Grid>
                                    </Grid>
                                )
                            })}
                        </Grid>
                    </Typography>
                    <EthereumChainBoundary
                        chainId={requiredChainId}
                        noSwitchNetworkTip
                        classes={{ switchButton: sharedClasses.switchButton }}>
                        <ActionButton fullWidth variant="contained" size="large" onClick={onClickReferFarm}>
                            {t('plugin_referral_refer_to_farm')}
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
