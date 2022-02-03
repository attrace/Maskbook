import { isDashboardPage, makeTypedMessageText } from '@masknet/shared-base'
import { Button, Card, CardActions, CardContent, Grid, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { MaskIcon } from '../../../resources/MaskIcon'
import { makeStyles } from '@masknet/theme'
import type { ReferralMetaData, RewardData } from '../types'
import { useAccount, useWeb3 } from '@masknet/web3-shared-evm'
import { singAndPostProofOrigin } from '../Worker/apis/proofs'
import { MASK_SWAP_V1, REFERRAL_META_KEY } from '../constants'
import { useCompositionContext } from '@masknet/plugin-infra'

import { MaskMessages, useI18N } from '../../../utils'
import { TokenIcon } from '@masknet/shared'
import { useCallback, useState } from 'react'
import { useCurrentIdentity } from '../../../components/DataSource/useActivatedUI'

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
    const { attachMetadata, dropMetadata } = useCompositionContext()
    const { t } = useI18N()
    const [rewardData, setRewardData] = useState<RewardData>({
        apr: '42%',
        daily_reward: '1wETH',
        total_reward: '5wETH',
    })

    const currentIdentity = useCurrentIdentity()

    const openEncryptedMessage = useCallback(
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
                sender: senderName,
            })

            openEncryptedMessage(
                t('plugin_referral_buy_refer_earn_yield', { token: payload.referral_token_symbol }),
                metadata,
            )
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
                                    <br />
                                    <br /> <b>{t('plugin_referral_sponsored_farm')}</b>
                                    <br /> {t('plugin_referral_apr_with_data', { reward: rewardData.apr })}
                                    <br />{' '}
                                    {t('plugin_referral_daily_rewards_with_data', { reward: rewardData.daily_reward })}
                                    <br />{' '}
                                    {t('plugin_referral_total_rewards_with_data', { reward: rewardData.total_reward })}
                                </Card>
                            </Box>
                        </CardContent>
                        <CardActions>
                            <Grid container>
                                <Grid xs={6} display="flex" justifyContent="center" textAlign="center">
                                    <Button variant="contained" size="large">
                                        Buy to Farm
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
