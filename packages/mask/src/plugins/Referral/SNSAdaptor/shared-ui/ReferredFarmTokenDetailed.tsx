import { makeStyles } from '@masknet/theme'
import { isDashboardPage } from '@masknet/shared-base'
import { Box, Typography } from '@mui/material'
import { TokenIcon } from '@masknet/shared'
import type { ChainId } from '@masknet/web3-shared-evm'

import { useI18N } from '../../../../utils'
import { Icons } from '../../types'

import { SvgIcons } from '../Icons'

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
        marginLeft: '16px',
        fontWeight: 500,
    },
    icon: {
        marginLeft: '7px',
        height: '16px',
        width: '16px',
    },
    nameFarm: {
        display: 'flex',
        alignItems: 'center',
    },
    name: {
        color: theme.palette.text.secondary,
        fontWeight: 400,
    },
    tokenIcon: {
        width: '40px',
        height: '40px',
        backgroundColor: theme.palette.background.default,
        borderRadius: '50%',
    },
}))

export interface TokenProps {
    address: string
    symbol?: string
    name?: string
    logoURI?: string | string[]
    chainId?: ChainId
}

export interface ReferredFarmTokenDetailedProps extends React.PropsWithChildren<{}> {
    token?: TokenProps
    hideFarmTypeIcon?: boolean
}

export function ReferredFarmTokenDetailed({ token, hideFarmTypeIcon = false }: ReferredFarmTokenDetailedProps) {
    const { t } = useI18N()
    const isDashboard = isDashboardPage()
    const { classes } = useStyles({ isDashboard })

    return (
        <div className={classes.container}>
            {token && (
                <>
                    {token.logoURI ? <TokenIcon {...token} /> : <div className={classes.tokenIcon} />}
                    <Typography className={classes.details} display="flex" flexDirection="column">
                        <div className={classes.nameFarm}>
                            {token.symbol} {t('plugin_referral_referral_farm')}{' '}
                            {!hideFarmTypeIcon && (
                                <Box className={classes.icon}>
                                    <SvgIcons icon={Icons.SponsoredFarmIcon} />
                                </Box>
                            )}
                        </div>
                        <span className={classes.name}>{token.name}</span>
                    </Typography>
                </>
            )}
        </div>
    )
}
