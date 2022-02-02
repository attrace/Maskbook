import { makeStyles } from '@masknet/theme'
import { useERC20TokenDetailed } from '@masknet/web3-shared-evm'
import { useI18N } from '../../../utils'

import { Avatar } from '@mui/material'

const useStyles = makeStyles()((theme) => ({
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

export function FarmItemDetailed({ address }: { address: string }) {
    const { classes } = useStyles()
    const { t } = useI18N()
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
            <div className={classes.details}>
                {value.symbol} {t('referral_farm')}
                <div className={classes.name}>{value.name}</div>
            </div>
        </div>
    ) : null
}
