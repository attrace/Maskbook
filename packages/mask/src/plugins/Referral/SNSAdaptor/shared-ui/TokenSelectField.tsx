import { TextField, Button, InputAdornment } from '@mui/material'
import { ChevronDown } from 'react-feather'

import type { EthereumTokenDetailedType, EthereumTokenType } from '@masknet/web3-shared-evm'

import { useI18N } from '../../../../utils'
import { isDashboardPage } from '@masknet/shared-base'
import { makeStyles } from '@masknet/theme'

import { TokenIcon } from '@masknet/shared'

const useStyles = makeStyles<{ isDashboard: boolean }>()((theme, { isDashboard }) => ({
    root: {
        width: '100%',
        height: '57px',
        cursor: 'pointer',
        backgroundColor: 'transparent',
        padding: 0,
    },
    icon: {
        width: '20px',
        height: '20px',
    },
}))

interface TokenSelectField {
    label: string
    token?: EthereumTokenDetailedType<EthereumTokenType.Native | EthereumTokenType.ERC20>
    onClick: () => void
}

export function TokenSelectField({ label, token, onClick }: TokenSelectField) {
    const { t } = useI18N()
    const isDashboard = isDashboardPage()
    const { classes } = useStyles({ isDashboard })

    return (
        <Button onClick={onClick} variant="text" className={classes.root}>
            <TextField
                label={label}
                defaultValue={t('plugin_referral_select_token')}
                value={token?.symbol}
                InputProps={{
                    readOnly: true,
                    startAdornment: token && (
                        <InputAdornment position="start">
                            <TokenIcon {...token} classes={classes} />
                        </InputAdornment>
                    ),
                    endAdornment: (
                        <InputAdornment position="start">
                            <ChevronDown />
                        </InputAdornment>
                    ),
                }}
            />
        </Button>
    )
}
