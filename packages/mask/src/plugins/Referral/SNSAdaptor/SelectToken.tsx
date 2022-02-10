import { useCallback, useState } from 'react'
import { useAsync } from 'react-use'
import { useI18N } from '../../../utils'
import { ChainId, FungibleTokenDetailed, useChainId, useWeb3 } from '@masknet/web3-shared-evm'
import { delay, isDashboardPage } from '@masknet/shared-base'
import { makeStyles } from '@masknet/theme'
import { useRemoteControlledDialog } from '@masknet/shared'
import { PluginReferralMessages } from '../messages'
import { InjectedDialog } from '../../../components/shared/InjectedDialog'
import { DialogContent } from '@mui/material'
import { ERC20TokenList } from './shared-ui/ERC20TokenList'
import { getAllFarms } from '../Worker/apis/farms'
import { ChainAddress, Farm, FARM_TYPE, parseChainAddress } from '../types'

import { MASK_TOKEN, ATTR_TOKEN, NATIVE_TOKEN } from '../constants'

const useStyles = makeStyles<{ isDashboard: boolean }>()((theme, { isDashboard }) => ({
    wrapper: {},
}))

function groupFarmTokensByType(farms: Farm[]) {
    const sponsoredFarmTokens: ChainAddress[] = []
    const maskFarmsTokens: ChainAddress[] = []
    const attrFarmsTokens: ChainAddress[] = []
    farms.forEach((farm) => {
        if (farm.farmType === FARM_TYPE.PAIR_TOKEN) {
            sponsoredFarmTokens.push(farm.referredTokenDefn)
        }
        if (farm.farmType === FARM_TYPE.PROPORTIONAL && farm.tokens?.length) {
            const rewardTokenAddr = parseChainAddress(farm.rewardTokenDefn).address
            if (rewardTokenAddr === MASK_TOKEN.address.toLowerCase()) {
                maskFarmsTokens.push(...farm.tokens)
            }
            if (rewardTokenAddr === ATTR_TOKEN.address.toLowerCase()) {
                attrFarmsTokens.push(...farm.tokens)
            }
        }
    })

    return {
        sponsoredFarmTokens: [...new Set(sponsoredFarmTokens)],
        maskFarmsTokens: [...new Set(maskFarmsTokens)],
        attrFarmsTokens: [...new Set(attrFarmsTokens)],
    }
}

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
    const disableNativeToken = true
    const { open, setDialog } = useRemoteControlledDialog(PluginReferralMessages.selectTokenUpdated, (ev) => {
        if (!ev.open) return
        setId(ev.uuid)
        setTitle(ev.title)
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
    const tokensGroupedByType = groupFarmTokensByType(farms)

    return (
        <InjectedDialog titleBarIconStyle="back" open={open} onClose={onClose} title={title} maxWidth="xs">
            <DialogContent>
                <ERC20TokenList
                    dataLoading={loadingAllFarms}
                    tokensGroupedByType={tokensGroupedByType}
                    FixedSizeListProps={{ height: 340, itemSize: 54 }}
                    onSelect={onSubmit}
                    blacklist={disableNativeToken ? [NATIVE_TOKEN] : []}
                />
            </DialogContent>
        </InjectedDialog>
    )
}
