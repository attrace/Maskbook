import { useI18N } from '../../../utils'
import { isDashboardPage } from '@masknet/shared-base'
import { makeStyles } from '@masknet/theme'
import { resolveTransactionLinkOnExplorer, useChainId } from '@masknet/web3-shared-evm'

import { TransactionStatus, TransactionDialogInterface } from '../types'
import { Grid, Typography, CircularProgress, Link } from '@mui/material'
import DoneIcon from '@mui/icons-material/Done'
import ActionButton from '../../../extension/options-page/DashboardComponents/ActionButton'

const useStyles = makeStyles<{ isDashboard: boolean }>()((theme, { isDashboard }) => ({
    confirmation: {
        padding: '44px 60px 40px',
    },
    heading: {
        fontSize: '20px',
        fontWeight: 600,
    },
    title: {
        margin: '12px 0 8px',
    },
}))

export function Transaction(props: TransactionDialogInterface | undefined) {
    const { t } = useI18N()
    const isDashboard = isDashboardPage()
    const currentChainId = useChainId()
    const { classes } = useStyles({ isDashboard })

    if (!props?.transaction) return <>{null}</>

    const { transaction } = props

    if (transaction.status === TransactionStatus.CONFIRMATION) {
        return (
            <Grid
                container
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                className={classes.confirmation}>
                <CircularProgress size={72} />
                <Typography fontWeight={600} className={classes.title} variant="h6">
                    {transaction.title}
                </Typography>
                {transaction.subtitle && <Typography fontWeight={500}>{transaction.subtitle}</Typography>}
            </Grid>
        )
    }
    if (transaction.status === TransactionStatus.CONFIRMED) {
        return (
            <Typography>
                <Grid container textAlign="center" rowSpacing="5px" sx={{ p: 2 }}>
                    <Grid item xs={12}>
                        <DoneIcon sx={{ fontSize: 60 }} />
                    </Grid>
                    <Grid item xs={12} className={classes.heading}>
                        {t('plugin_wallet_transaction_confirmed')}
                    </Grid>
                    <Grid item xs={12}>
                        <Link
                            href={resolveTransactionLinkOnExplorer(currentChainId, transaction.transactionHash)}
                            target="_blank">
                            {t('plugin_wallet_view_on_explorer')}
                        </Link>
                    </Grid>

                    <Grid item xs={12} marginTop={2}>
                        <ActionButton
                            fullWidth
                            variant="contained"
                            size="large"
                            onClick={transaction.actionButton.onClick}>
                            {transaction.actionButton.label}
                        </ActionButton>
                    </Grid>
                </Grid>
            </Typography>
        )
    }
    return <>{null}</>
}
