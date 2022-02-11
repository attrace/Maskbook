import { makeStyles } from '@masknet/theme'
import { isDashboardPage } from '@masknet/shared-base'
import { useI18N } from '../../../../utils'

import type { ChainId } from '@masknet/web3-shared-evm'

import { getFarmTypeIconByReferredToken } from '../helpers'

import { Box, Typography } from '@mui/material'
import { TokenIcon } from '@masknet/shared'
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
    referredTokenDefn: string
    rewardTokenDefn: string
    chainId: ChainId
    hideFarmTypeIcon?: boolean
}

export function ReferredFarmTokenDetailed({
    token,
    referredTokenDefn,
    rewardTokenDefn,
    chainId,
    hideFarmTypeIcon = false,
}: ReferredFarmTokenDetailedProps) {
    const { t } = useI18N()
    const isDashboard = isDashboardPage()
    const { classes } = useStyles({ isDashboard })

    const farmTypeIcon = getFarmTypeIconByReferredToken(referredTokenDefn, rewardTokenDefn, chainId)
    return (
        <div className={classes.container}>
            {token && (
                <>
                    <TokenIcon {...token} />
                    <Typography className={classes.details} display="flex" flexDirection="column">
                        <div className={classes.nameFarm}>
                            {token.symbol} {t('plugin_referral_referral_farm')}{' '}
                            {!hideFarmTypeIcon && (
                                <Box className={classes.icon}>
                                    <SvgIcons icon={farmTypeIcon} />
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
