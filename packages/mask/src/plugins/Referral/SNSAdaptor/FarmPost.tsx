import { isDashboardPage, makeTypedMessageText } from '@masknet/shared-base'
import { Button, Card, CardActions, CardContent, Grid, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { MaskIcon } from '../../../resources/MaskIcon'
import { makeStyles } from '@masknet/theme'
import { FARM_TYPE, ReferralMetaData, Farm } from '../types'
import { useAccount, useWeb3 } from '@masknet/web3-shared-evm'
import { singAndPostProofOrigin, singAndPostProofWithReferrer } from '../Worker/apis/proofs'
import {
    ATTR_TOKEN_ADDR,
    ATTR_TOKEN_SYMBOL,
    MASK_REFERRER,
    MASK_SWAP_V1,
    MASK_TOKEN_ADDR,
    MASK_TOKEN_SYMBOL,
    REFERRAL_META_KEY,
} from '../constants'

import { MaskMessages, useI18N } from '../../../utils'
import { TokenIcon, useRemoteControlledDialog } from '@masknet/shared'
import { useCallback, useEffect, useState } from 'react'
import { useCurrentIdentity } from '../../../components/DataSource/useActivatedUI'
import { getFarmsRewardData, toChainAddress } from './helpers'
import { useAsync } from 'react-use'
import { getAllFarms } from '../Worker/apis/farms'
import { RewardDataWidget } from './shared-ui/RewardDataWidget'
import { IconURLS } from './IconURL'
import type { Coin } from '../../Trader/types'
import { PluginTraderMessages } from '../../Trader/messages'

interface FarmPostProps {
    payload: ReferralMetaData
}
const useStyles = makeStyles<{ isDashboard: boolean }>()((theme, { isDashboard }) => ({
    dataCard: {
        background: 'linear-gradient(194.37deg, #0081F9 2.19%, #746AFD 61.94%, #A261FF 95.94%)',
    },
    longButton: {
        width: '60px',
    },
    img: {
        width: 50,
        marginRight: 4,
        justifyContent: 'center',
        display: 'flex',
    },
}))

export function FarmPost(props: FarmPostProps) {
    const { payload } = props

    const isDashboard = isDashboardPage()
    const { classes } = useStyles({ isDashboard })
    const web3 = useWeb3()
    const account = useAccount()
    const { t } = useI18N()
    const chainId = payload.referral_token_chain_id

    const [sponsoredFarms, setSponsoredFarms] = useState<Farm[]>()
    const [attrFarms, setAttrFarms] = useState<Farm[]>()
    const [maskFarms, setMaskFarms] = useState<Farm[]>()

    const currentIdentity = useCurrentIdentity()
    const { value: farms = [], loading: loadingAllFarms } = useAsync(async () => getAllFarms(web3, chainId), [])

    useEffect(() => {
        const address = payload.referral_token

        const sponsoredFarms = farms.filter(
            (farm) =>
                farm.farmType === FARM_TYPE.PAIR_TOKEN && farm.referredTokenDefn === toChainAddress(chainId, address),
        )
        const propotionalFarms = farms.filter(
            (farm) =>
                farm.farmType === FARM_TYPE.PROPORTIONAL && farm.tokens?.includes(toChainAddress(chainId, address)),
        )
        const attrFarms = propotionalFarms.filter(
            (farm) => farm.rewardTokenDefn === toChainAddress(chainId, ATTR_TOKEN_ADDR),
        )
        const maskFarms = propotionalFarms.filter(
            (farm) => farm.rewardTokenDefn === toChainAddress(chainId, MASK_TOKEN_ADDR),
        )

        setSponsoredFarms(sponsoredFarms)
        setAttrFarms(attrFarms)
        setMaskFarms(maskFarms)
    }, [farms])
    const noFarmForSelectedToken = !sponsoredFarms?.length && !attrFarms?.length && !maskFarms?.length

    const openComposeBox = useCallback(
        (message: string, selectedReferralData: Map<string, ReferralMetaData>, id?: string) =>
            MaskMessages.events.requestComposition.sendToLocal({
                reason: 'timeline',
                open: true,
                content: makeTypedMessageText(message, selectedReferralData),
            }),
        [],
    )
    const referButton = async () => {
        try {
            await singAndPostProofOrigin(web3, account, payload.referral_token, MASK_SWAP_V1)
            const senderName =
                currentIdentity?.identifier.userId ?? currentIdentity?.linkedPersona?.nickname ?? 'Unknown User'
            const metadata = new Map<string, ReferralMetaData>()
            metadata.set(REFERRAL_META_KEY, {
                referral_token: payload.referral_token,
                referral_token_name: payload.referral_token_name,
                referral_token_symbol: payload.referral_token_symbol,
                referral_token_icon: payload.referral_token_icon,
                referral_token_chain_id: chainId,
                sender: senderName,
            })

            openComposeBox(
                t('plugin_referral_buy_refer_earn_yield', { token: payload.referral_token_symbol }),
                metadata,
            )
        } catch (error) {
            alert(error)
        }
    }

    const { setDialog: openSwapDialog } = useRemoteControlledDialog(PluginTraderMessages.swapDialogUpdated)

    const swapToken = useCallback(() => {
        if (!payload.referral_token) return
        openSwapDialog({
            open: true,
            traderProps: {
                coin: {
                    id: payload.referral_token,
                    name: payload.referral_token_name,
                    symbol: payload.referral_token_symbol,
                    contract_address: payload.referral_token,
                } as Coin,
            },
        })
    }, [payload, openSwapDialog])
    const buyButton = async () => {
        try {
            const sig = await singAndPostProofWithReferrer(web3, account, payload.referral_token, MASK_REFERRER)
            swapToken()
        } catch (error) {
            alert(error)
        }
    }
    return (
        <>
            <div>
                <Typography>
                    <Card variant="outlined">
                        <CardContent>
                            <Grid container spacing={2}>
                                <Grid item>
                                    <MaskIcon size={60} />
                                </Grid>
                                <Grid item xs={12} sm container>
                                    <Grid item xs container direction="column" spacing={2}>
                                        <Grid item xs>
                                            <Typography gutterBottom variant="subtitle1" component="div">
                                                {t('plugin_referral_mask_plugin')}
                                            </Typography>
                                            <Typography variant="h6" gutterBottom>
                                                <b> {t('plugin_referral')}</b>
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                    <Grid item direction="column" spacing={2}>
                                        <Grid item xs>
                                            <Typography gutterBottom component="div">
                                                {t('plugin_referral_provided_by')}
                                            </Typography>
                                            <Typography gutterBottom>
                                                <b> {t('plugin_referral_attrace_protocol')}</b>
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Grid>
                            <Box sx={{ p: 2 }}>
                                <Card variant="outlined" sx={{ p: 2 }} className={classes.dataCard}>
                                    <Grid container spacing={2}>
                                        <Grid item>
                                            {/* <img className={classes.img} src={payload.referral_token_icon} /> */}
                                            <TokenIcon
                                                address={payload.referral_token ?? ''}
                                                name={payload.referral_token_name}
                                                logoURI={payload.referral_token_icon}
                                            />
                                        </Grid>
                                        <Grid
                                            item
                                            textAlign="center"
                                            justifyContent="center"
                                            flexDirection="column"
                                            display="flex">
                                            <Typography variant="h6">
                                                <b>${payload.referral_token_symbol} Buy & Hold Referral</b>
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                    {t('plugin_referral_join_receive_rewards')}
                                    <Grid container>
                                        {/* {!token && <RewardDataWidget />} */}
                                        {noFarmForSelectedToken ? (
                                            <RewardDataWidget
                                                title={t('plugin_referral_under_review')}
                                                icon={IconURLS.underReviewLogo}
                                            />
                                        ) : null}
                                        {sponsoredFarms?.length ? (
                                            <RewardDataWidget
                                                title={t('plugin_referral_sponsored_referral_farm')}
                                                icon={IconURLS.sponsoredFarmLogo}
                                                rewardData={getFarmsRewardData(sponsoredFarms)}
                                                tokenSymbol={payload.referral_token_symbol}
                                            />
                                        ) : null}
                                        {attrFarms?.length ? (
                                            <RewardDataWidget
                                                title={t('plugin_referral_attrace_referral_farm')}
                                                icon={IconURLS.attrLightLogo}
                                                rewardData={getFarmsRewardData(attrFarms)}
                                                tokenSymbol={ATTR_TOKEN_SYMBOL}
                                            />
                                        ) : null}
                                        {maskFarms?.length ? (
                                            <RewardDataWidget
                                                title={t('plugin_referral_mask_referral_farm')}
                                                icon={IconURLS.maskLogo}
                                                rewardData={getFarmsRewardData(maskFarms)}
                                                tokenSymbol={MASK_TOKEN_SYMBOL}
                                            />
                                        ) : null}
                                    </Grid>
                                </Card>
                            </Box>
                        </CardContent>
                        <CardActions>
                            <Grid container>
                                <Grid xs={6} display="flex" justifyContent="center" textAlign="center">
                                    <Button
                                        variant="contained"
                                        size="large"
                                        onClick={async () => {
                                            await buyButton()
                                        }}>
                                        {t('plugin_referral_buy_to_farm')}
                                    </Button>
                                </Grid>
                                <Grid xs={6} display="flex" justifyContent="center" textAlign="center">
                                    <Button
                                        variant="contained"
                                        size="large"
                                        onClick={async () => {
                                            await referButton()
                                        }}>
                                        {t('plugin_referral_refer_to_farm')}
                                    </Button>
                                </Grid>
                            </Grid>
                        </CardActions>
                    </Card>
                </Typography>
            </div>
        </>
    )
}
