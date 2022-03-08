import { isDashboardPage } from '@masknet/shared-base'
import { makeTypedMessageText } from '@masknet/typed-message'
import { Button, Card, CardActions, CardContent, Grid, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { MaskIcon } from '../../../resources/MaskIcon'
import { makeStyles } from '@masknet/theme'
import { Icons, ReferralMetaData } from '../types'
import { useAccount, useWeb3 } from '@masknet/web3-shared-evm'
import { singAndPostProofOrigin, singAndPostProofWithReferrer } from '../Worker/apis/proofs'
import { MASK_REFERRER, MASK_SWAP_V1, REFERRAL_META_KEY } from '../constants'

import { MaskMessages, useI18N } from '../../../utils'
import { TokenIcon, useRemoteControlledDialog } from '@masknet/shared'
import { useCallback } from 'react'
import { useCurrentIdentity } from '../../../components/DataSource/useActivatedUI'
import { getFarmsRewardData, getSponsoredFarmsForReferredToken } from './helpers'
import { useAsync } from 'react-use'
import { getAllFarms } from '../Worker/apis/farms'
import { RewardDataWidget } from './shared-ui/RewardDataWidget'
import type { Coin } from '../../Trader/types'
import { PluginTraderMessages } from '../../Trader/messages'

interface FarmPostProps {
    payload: ReferralMetaData
}
const useStyles = makeStyles<{ isDashboard: boolean }>()((theme, { isDashboard }) => ({
    dataCard: {
        marginTop: '12px',
        background: 'linear-gradient(194.37deg, #0081F9 2.19%, #746AFD 61.94%, #A261FF 95.94%)',
        color: '#FFFFFF',
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
    cardActions: {
        padding: '8px 16px 16px',
        '& button': {
            width: 'calc( 100% - 8px)',
        },
    },
    circularProgress: {
        color: '#FFFFFF',
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

    const currentIdentity = useCurrentIdentity()
    const { value: farms = [], loading: loadingFarms } = useAsync(
        async () => (chainId ? getAllFarms(web3, chainId) : []),
        [chainId],
    )

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
                promoter_address: account,
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
            const sig = await singAndPostProofWithReferrer(
                web3,
                account,
                payload.referral_token,
                payload?.promoter_address ?? MASK_REFERRER,
            )
            swapToken()
        } catch (error) {
            alert(error)
        }
    }

    const token = payload.referral_token
    const sponsoredFarms = getSponsoredFarmsForReferredToken(chainId, token, farms)

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
                            <Box>
                                <Card variant="outlined" sx={{ p: 2 }} className={classes.dataCard}>
                                    <Grid container spacing={2} marginBottom="8px">
                                        <Grid item>
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
                                        {sponsoredFarms?.length ? (
                                            <RewardDataWidget
                                                title={t('plugin_referral_sponsored_referral_farm')}
                                                icon={Icons.SponsoredFarmIcon}
                                                rewardData={getFarmsRewardData(sponsoredFarms)}
                                                tokenSymbol={payload.referral_token_symbol}
                                            />
                                        ) : null}
                                    </Grid>
                                </Card>
                            </Box>
                        </CardContent>
                        <CardActions className={classes.cardActions}>
                            <Grid container>
                                <Grid xs={6} display="flex" textAlign="center">
                                    <Button
                                        variant="contained"
                                        size="large"
                                        onClick={async () => {
                                            await buyButton()
                                        }}>
                                        {t('plugin_referral_buy_to_farm')}
                                    </Button>
                                </Grid>
                                <Grid xs={6} display="flex" justifyContent="end" textAlign="center">
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
