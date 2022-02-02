import { useI18N } from '../../../utils'
import { isDashboardPage } from '@masknet/shared-base'
import { makeStyles } from '@masknet/theme'
import { useChainId } from '@masknet/web3-shared-evm'

import { TransactionStatus } from '../types'
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
        marginTop: '12px',
        fontSize: '18px',
        fontWeight: 600,
    },
}))

type TransactionProps =
    | {
          status: TransactionStatus.CONFIRMATION
      }
    | {
          status: TransactionStatus.CONFIRMED
          actionButton: {
              label: string
              onClick: () => void
          }
      }

export function Transaction(props: TransactionProps) {
    const { t } = useI18N()
    const isDashboard = isDashboardPage()
    const currentChainId = useChainId()
    const { classes } = useStyles({ isDashboard })

    if (props.status === TransactionStatus.CONFIRMATION) {
        return (
            <Grid
                container
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                className={classes.confirmation}>
                <CircularProgress size={72} />
                <Typography className={classes.title}>{t('plugin_referral_transaction_confirmation_title')}</Typography>
            </Grid>
        )
    }
    if (props.status === TransactionStatus.CONFIRMED) {
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
                            href=""
                            // href={resolveTransactionLinkOnExplorer(currentChainId, '')}
                        >
                            {t('plugin_wallet_view_on_explorer')}
                        </Link>
                    </Grid>

                    <Grid item xs={12}>
                        <br />
                        <br />
                        <ActionButton fullWidth variant="contained" size="large" onClick={props.actionButton.onClick}>
                            {props.actionButton.label}
                        </ActionButton>
                    </Grid>
                </Grid>
            </Typography>
        )
    }
    return <>{null}</>
}
