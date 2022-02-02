import { makeStyles } from '@masknet/theme'
import { useERC20TokenDetailed } from '@masknet/web3-shared-evm'
import { isDashboardPage } from '@masknet/shared-base'
import { useI18N } from '../../../utils'

import { Avatar, Typography } from '@mui/material'

const useStyles = makeStyles<{ isDashboard: boolean }>()((theme, { isDashboard }) => ({
    container: {
        display: 'flex',
        alignItems: 'center',
    },
    logo: {
        display: 'flex',
        justifyContent: 'center',
        width: '44px',
        height: '44px',
        marginRight: '16px',
    },
    details: {
        fontWeight: 500,
    },
    name: {
        color: theme.palette.text.secondary,
        fontWeight: 400,
    },
}))

export interface FarmItemDetailedProps extends React.PropsWithChildren<{}> {
    address: string
}

export function FarmItemDetailed({ address }: FarmItemDetailedProps) {
    const { t } = useI18N()
    const isDashboard = isDashboardPage()
    const { classes } = useStyles({ isDashboard })
    const { value, loading, error, retry } = useERC20TokenDetailed(address)

    return value ? (
        <div className={classes.container}>
            <div className={classes.logo}>
                {value.logoURI ? (
                    <img src={value.logoURI?.[0]} alt={value.name} />
                ) : (
                    <Avatar>{value.name?.charAt(0).toUpperCase()}</Avatar>
                )}
            </div>
            <Typography className={classes.details} display="flex" flexDirection="column">
                {value.symbol} {t('plugin_referral_referral_farm')}
                <span className={classes.name}>{value.name}</span>
            </Typography>
        </div>
    ) : null
}
