import { useCallback, useState } from 'react'
import { useAsync } from 'react-use'
import { delay } from '@dimensiondev/kit'
import { FungibleTokenDetailed, useChainId, useWeb3 } from '@masknet/web3-shared-evm'
import { useRemoteControlledDialog } from '@masknet/shared-base-ui'
import { DialogContent } from '@mui/material'

import { PluginReferralMessages } from '../messages'
import { NATIVE_TOKEN } from '../constants'

import { InjectedDialog } from '../../../components/shared/InjectedDialog'
import { ERC20TokenList } from './shared-ui/ERC20TokenList'
import { getAllFarms } from '../Worker/apis/farms'

const DISABLED_NATIVE_TOKEN = true

export function SelectToken() {
    const currentChainId = useChainId()
    const web3 = useWeb3({ chainId: currentChainId })

    const [title, setTitle] = useState('')
    const [id, setId] = useState('')
    const [tokenList, setTokenList] = useState<undefined | string[]>(undefined)

    const { open, setDialog } = useRemoteControlledDialog(PluginReferralMessages.selectTokenUpdated, (ev) => {
        if (!ev.open) return
        setId(ev.uuid)
        setTitle(ev.title)
        setTokenList(ev.tokenList)
    })
    const { value: farms = [], loading: loadingAllFarms } = useAsync(
        async () => getAllFarms(web3, currentChainId),
        [currentChainId],
    )

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

    const referredTokensDefn = farms.map((farm) => farm.referredTokenDefn)

    return (
        <InjectedDialog titleBarIconStyle="back" open={open} onClose={onClose} title={title} maxWidth="xs">
            <DialogContent>
                <ERC20TokenList
                    renderList={tokenList}
                    dataLoading={loadingAllFarms}
                    referredTokensDefn={referredTokensDefn}
                    FixedSizeListProps={{ height: 340, itemSize: 54 }}
                    onSelect={onSubmit}
                    blacklist={DISABLED_NATIVE_TOKEN ? [NATIVE_TOKEN] : []}
                />
            </DialogContent>
        </InjectedDialog>
    )
}
