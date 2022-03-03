import { isDashboardPage } from '@masknet/shared-base'
import { makeStyles } from '@masknet/theme'
import { Grid, Typography } from '@mui/material'
import BigNumber from 'bignumber.js'
import ActionButton from '../../../extension/options-page/DashboardComponents/ActionButton'
import { useI18N } from '../../../utils'
import { EthereumChainBoundary } from '../../../web3/UI/EthereumChainBoundary'
import type { DepositDialogInterface } from '../types'

const useStyles = makeStyles<{ isDashboard: boolean }>()((theme, { isDashboard }) => ({
    depositRoot: {
        padding: `${theme.spacing(3)} 0`,
    },
    depositTitle: {
        fontWeight: 600,
        fontSize: '18px',
        lineHeight: '25px',
        marginBottom: '12px',
        color: theme.palette.text.strong,
    },
    depositRow: {
        fontSize: '16px',
        lineHeight: '22px',
        color: theme.palette.text.secondary,
    },
    depositTotal: {
        fontWeight: 600,
    },
}))

export function Deposit(props: DepositDialogInterface | undefined) {
    const { t } = useI18N()
    const isDashboard = isDashboardPage()
    const { classes } = useStyles({ isDashboard })

    if (!props?.deposit) return <>{null}</>

    const { deposit } = props
    const totalFarmRewardNum = new BigNumber(deposit.totalFarmReward)
    const totalDeposit = totalFarmRewardNum.plus(deposit.attraceFee).toString()

    return (
        <div className={classes.depositRoot}>
            <Typography>
                <Grid container justifyContent="space-between" rowSpacing="12px">
                    <Grid item xs={12} className={classes.depositTitle}>
                        {t('plugin_referral_deposit_total_rewards')}
                    </Grid>
                    <Grid item xs={6} className={classes.depositRow}>
                        {t('plugin_referral_total_farm_rewards')}
                    </Grid>
                    <Grid item xs={6} display="flex" justifyContent="right" className={classes.depositRow}>
                        {deposit.totalFarmReward} {deposit.tokenSymbol}
                    </Grid>
                    <Grid item xs={6} className={classes.depositRow}>
                        {t('plugin_referral_attrace_fees')}
                    </Grid>
                    <Grid item xs={6} display="flex" justifyContent="right" className={classes.depositRow}>
                        {deposit.attraceFee.toString()} {deposit.tokenSymbol}
                    </Grid>
                    <Grid item xs={6} className={`${classes.depositRow} ${classes.depositTotal}`}>
                        {t('plugin_referral_deposit_total')}
                    </Grid>
                    <Grid
                        item
                        xs={6}
                        display="flex"
                        justifyContent="right"
                        className={`${classes.depositRow} ${classes.depositTotal}`}>
                        {totalDeposit} {deposit.tokenSymbol}
                    </Grid>
                    <Grid item xs={12} marginTop="20px">
                        <EthereumChainBoundary chainId={deposit.requiredChainId} noSwitchNetworkTip>
                            <ActionButton
                                fullWidth
                                variant="contained"
                                size="large"
                                onClick={async () => {
                                    await deposit.onDeposit()
                                }}>
                                <div>
                                    Deposit {totalDeposit} {deposit.tokenSymbol}
                                </div>
                            </ActionButton>
                        </EthereumChainBoundary>
                    </Grid>
                </Grid>
            </Typography>
        </div>
    )
}
