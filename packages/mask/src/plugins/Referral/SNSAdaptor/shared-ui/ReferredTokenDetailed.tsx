import { makeStyles } from '@masknet/theme'
import { isDashboardPage } from '@masknet/shared-base'
import { useI18N } from '../../../../utils'

import type { ERC20TokenDetailed } from '@masknet/web3-shared-evm'

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

export interface ReferredTokenDetailedProps extends React.PropsWithChildren<{}> {
    token?: ERC20TokenDetailed
}

export function ReferredTokenDetailed({ token }: ReferredTokenDetailedProps) {
    const { t } = useI18N()
    const isDashboard = isDashboardPage()
    const { classes } = useStyles({ isDashboard })

    return (
        <div className={classes.container}>
            {token && (
                <>
                    <div className={classes.logo}>
                        {token.logoURI?.length ? (
                            <img src={token.logoURI[0]} alt={token.name} />
                        ) : (
                            <Avatar>{token.name?.charAt(0).toUpperCase()}</Avatar>
                        )}
                    </div>
                    <Typography className={classes.details} display="flex" flexDirection="column">
                        {token.symbol} {t('plugin_referral_referral_farm')}
                        <span className={classes.name}>{token.name}</span>
                    </Typography>
                </>
            )}
        </div>
    )
}
