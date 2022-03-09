import { useCallback, useState } from 'react'
import { useAsync } from 'react-use'
import { useI18N } from '../../../utils'
import { ChainId, FungibleTokenDetailed, useChainId, useWeb3 } from '@masknet/web3-shared-evm'
import { isDashboardPage } from '@masknet/shared-base'
import { delay } from '@dimensiondev/kit'
import { makeStyles } from '@masknet/theme'
import { useRemoteControlledDialog } from '@masknet/shared'
import { PluginReferralMessages } from '../messages'
import { InjectedDialog } from '../../../components/shared/InjectedDialog'
import { DialogContent } from '@mui/material'
import { ERC20TokenList } from './shared-ui/ERC20TokenList'
import { getAllFarms } from '../Worker/apis/farms'

import { NATIVE_TOKEN } from '../constants'

const useStyles = makeStyles<{ isDashboard: boolean }>()((theme, { isDashboard }) => ({
    wrapper: {},
}))

export interface SelectTokenProps {}

export function SelectToken(props: SelectTokenProps) {
    const { t } = useI18N()
    const currentChainId = useChainId()
    const web3 = useWeb3({ chainId: currentChainId })
    const isDashboard = isDashboardPage()
    const { classes } = useStyles({ isDashboard })

    const [chainId, setChainId] = useState<ChainId>(currentChainId)
    const [title, setTitle] = useState('')
    const [id, setId] = useState('')
    const [tokenList, setTokenList] = useState<undefined | string[]>(undefined)

    const disableNativeToken = true

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
                    blacklist={disableNativeToken ? [NATIVE_TOKEN] : []}
                />
            </DialogContent>
        </InjectedDialog>
    )
}
