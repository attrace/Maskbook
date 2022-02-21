import { useCallback, useState } from 'react'
import { Typography, Box, Tab, Tabs, Grid, Divider } from '@mui/material'
import { TabContext, TabPanel } from '@mui/lab'
import { useAsync } from 'react-use'

import { useI18N } from '../../../utils'
import { ChainId, FungibleTokenDetailed, useAccount, useChainId, useWeb3 } from '@masknet/web3-shared-evm'
import { isDashboardPage } from '@masknet/shared-base'
import { makeStyles } from '@masknet/theme'
import {
    ReferralMetaData,
    TabsCreateFarm,
    TransactionStatus,
    PageInterface,
    PagesType,
    Icons,
    parseChainAddress,
} from '../types'
import ActionButton from '../../../extension/options-page/DashboardComponents/ActionButton'
import { EthereumChainBoundary } from '../../../web3/UI/EthereumChainBoundary'

import { useRemoteControlledDialog } from '@masknet/shared'
import { WalletMessages } from '@masknet/plugin-wallet'
import { v4 as uuid } from 'uuid'

import { blue } from '@mui/material/colors'
import { MASK_SWAP_V1, REFERRAL_META_KEY } from '../constants'
import { useCompositionContext } from '@masknet/plugin-infra'
import { useCurrentIdentity } from '../../../components/DataSource/useActivatedUI'
import { singAndPostProofOrigin } from '../Worker/apis/proofs'
import { Transaction } from './shared-ui/Transaction'
import { PluginReferralMessages, SelectTokenUpdated } from '../messages'
import { MyFarms } from './MyFarms'
import { TokenSelectField } from './shared-ui/TokenSelectField'
import { getAllFarms } from '../Worker/apis/farms'
import { getFarmsAPR } from '../Worker/apis/verifier'
import { getFarmsRewardData, getSponsoredFarmsForReferredToken } from './helpers'
import { RewardDataWidget } from './shared-ui/RewardDataWidget'
import { useRequiredChainId } from './hooks/useRequiredChainId'
import { SvgIcons } from './Icons'

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
    const [chainId, setChainId] = useState<ChainId>(currentChainId)
    const isDashboard = isDashboardPage()
    const { classes } = useStyles({ isDashboard })
    const [tab, setTab] = useState<string>(TabsCreateFarm.NEW)

    // #region select token
    const [token, setToken] = useState<FungibleTokenDetailed>()
    const [id] = useState(uuid())
    const [isTransactionProcessing, setIsTransactionProcessing] = useState<boolean>(false)
    const requiredChainId = useRequiredChainId(currentChainId)
    const web3 = useWeb3()
    const account = useAccount()

    // fetch all farms
    const { value: farms = [], loading: loadingAllFarms } = useAsync(async () => getAllFarms(web3, currentChainId), [])
    // fetch farms APR
    const { value: farmsAPR, loading: loadingFarmsAPR } = useAsync(async () => getFarmsAPR({}), [])

    // token list
    const referredTokensDefn = farms.map((farm) => farm.referredTokenDefn)
    // select uniq tokens
    const uniqReferredTokensDefn = [...new Set(referredTokensDefn)]
    const tokenList = uniqReferredTokensDefn.map((referredTokenDefn) => parseChainAddress(referredTokenDefn).address)

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
    const onClickTokenSelect = useCallback(() => {
        setSelectTokenDialog({
            open: true,
            uuid: id,
            title: t('plugin_referral_select_a_token_to_refer'),
            tokenList,
        })
    }, [id, setToken, tokenList])

    // #endregion
    const farm_category_types = [
        {
            title: t('plugin_referral_sponsored_referral_farm'),
            desc: t('plugin_referral_sponsored_referral_farm_desc'),
            icon: <SvgIcons size={16} icon={Icons.SponsoredFarmIcon} />,
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
            const sig = await singAndPostProofOrigin(web3, account, token?.address ?? '', MASK_SWAP_V1)
            setIsTransactionProcessing(false)
            insertData({
                referral_token: token?.address ?? '',
                referral_token_name: token?.name ?? '',
                referral_token_symbol: token?.symbol ?? '',
                referral_token_icon: token?.logoURI ?? [''],
                referral_token_chain_id: currentChainId,
                promoter_address: account,
                sender: senderName ?? '',
            })
        } catch (error) {
            setIsTransactionProcessing(false)
            alert(error)
        }
    }
    if (isTransactionProcessing) {
        return (
            <Transaction
                status={TransactionStatus.CONFIRMATION}
                title={t('plugin_referral_transaction_complete_signature_request')}
                subtitle={t('plugin_referral_transaction_sign_the_message_for_rewards')}
            />
        )
    }

    const sponsoredFarms = getSponsoredFarmsForReferredToken(token?.chainId, token?.address, farms)

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
                            <Typography fontWeight={600} variant="h6" marginBottom="12px">
                                {t('plugin_referral_select_token_refer')}
                            </Typography>
                            <Typography marginBottom="24px">{t('plugin_referral_select_token_refer_desc')}</Typography>
                            <Grid item xs={6}>
                                <TokenSelectField
                                    label={t('plugin_referral_token_to_refer')}
                                    token={token}
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
                                            rewardData={getFarmsRewardData(sponsoredFarms, farmsAPR)}
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
                            <MyFarms pageType={PagesType.REFER_TO_FARM} {...props} />
                        </TabPanel>
                    </TabContext>
                </Box>
            </div>
        </>
    )
}
