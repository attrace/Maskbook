import { useCallback, useState } from 'react'
import { useI18N } from '../../../utils'
import { ChainId, FungibleTokenDetailed, useChainId, useWeb3 } from '@masknet/web3-shared-evm'
import { delay, isDashboardPage } from '@masknet/shared-base'
import { makeStyles } from '@masknet/theme'
import { useRemoteControlledDialog } from '@masknet/shared'
import { PluginReferralMessages } from '../messages'
import { InjectedDialog } from '../../../components/shared/InjectedDialog'
import { DialogContent } from '@mui/material'
import { ChainAddress, parseChainAddress } from '../types'
import { ERC20TokenList } from './shared-ui/ERC20TokenList'

const useStyles = makeStyles<{ isDashboard: boolean }>()((theme, { isDashboard }) => ({
    wrapper: {},
}))

export function SelectTokenToBuy() {
    const { t } = useI18N()
    const currentChainId = useChainId()
    const web3 = useWeb3({ chainId: currentChainId })
    const isDashboard = isDashboardPage()
    const { classes } = useStyles({ isDashboard })

    const [chainId, setChainId] = useState<ChainId>(currentChainId)
    const [title, setTitle] = useState('')
    const [id, setId] = useState('')
    const [tokensChainAddrs, setTokensChainAddrs] = useState<ChainAddress[]>([])

    const { open, setDialog } = useRemoteControlledDialog(PluginReferralMessages.selectTokenToBuy, (ev) => {
        if (!ev.open) return
        setId(ev.uuid)
        setTitle(ev.title)
        setTokensChainAddrs(ev.tokensChainAddrs)
    })

    const onClose = useCallback(async () => {
        setDialog({
            open: false,
            uuid: id,
        })
        await delay(300)
    }, [id, setDialog])

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

    // filter uniq tokens
    const uniqChainAddrs = [...new Set(tokensChainAddrs)]
    const tokens = uniqChainAddrs.map((chainAddrs) => parseChainAddress(chainAddrs).address)

    return (
        <InjectedDialog titleBarIconStyle="close" open={open} onClose={onClose} title={title} maxWidth="xs">
            <DialogContent>
                <ERC20TokenList
                    renderTokensList={tokens}
                    tokensGroupedByType={{
                        sponsoredFarmTokens: uniqChainAddrs,
                        maskFarmsTokens: [],
                        attrFarmsTokens: [],
                    }}
                    FixedSizeListProps={{ height: 340, itemSize: 54 }}
                    onSelect={onSubmit}
                />
            </DialogContent>
        </InjectedDialog>
    )
}
