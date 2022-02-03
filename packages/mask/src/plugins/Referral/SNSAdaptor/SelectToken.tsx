import { useCallback, useState } from 'react'
import { useI18N } from '../../../utils'
import { ChainId, FungibleTokenDetailed, useChainId } from '@masknet/web3-shared-evm'
import { delay, isDashboardPage } from '@masknet/shared-base'
import { makeStyles } from '@masknet/theme'
import { useRemoteControlledDialog } from '@masknet/shared'
import { PluginReferralMessages } from '../messages'
import { InjectedDialog } from '../../../components/shared/InjectedDialog'
import { DialogContent } from '@mui/material'

const useStyles = makeStyles<{ isDashboard: boolean }>()((theme, { isDashboard }) => ({
    wrapper: {},
}))

export interface SelectTokenProps {}

export function SelectToken(props: SelectTokenProps) {
    const { t } = useI18N()
    const currentChainId = useChainId()
    const [chainId, setChainId] = useState<ChainId>(currentChainId)
    const isDashboard = isDashboardPage()
    const { classes } = useStyles({ isDashboard })
    const [title, setTitle] = useState('')
    const [id, setId] = useState('')
    const { open, setDialog } = useRemoteControlledDialog(PluginReferralMessages.selectTokenUpdated, (ev) => {
        if (!ev.open) return
        setId(ev.uuid)
        setTitle(ev.title)
    })
    const onClose = useCallback(async () => {
        setDialog({
            open: false,
            uuid: id,
        })
        await delay(300)
    }, [id, setDialog])

    // USE THIS ON TOKEN CLICK
    const onSubmit = useCallback(
        async (token: FungibleTokenDetailed) => {
            setDialog({
                open: false,
                uuid: id,
                token,
            })
            await delay(300)
        },
        [id, setDialog],
    )

    return (
        <InjectedDialog titleBarIconStyle="close" open={open} onClose={onClose} title={title} maxWidth="xs">
            <DialogContent>Need to be Implemented</DialogContent>
        </InjectedDialog>
    )
}
