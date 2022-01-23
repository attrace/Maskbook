import { useState } from 'react'
import { InjectedDialog } from '../../../components/shared/InjectedDialog'
import { DialogContent } from '@mui/material'
import { PagesType } from '../types'
import { useI18N } from '../../../utils'
import { ChainId, useChainId } from '@masknet/web3-shared-evm'
import { isDashboardPage } from '@masknet/shared-base'
import { makeStyles } from '@masknet/theme'
import { Landing } from './Landing'
import { ReferralFarms } from './ReferralFarms'
import { CreateFarm } from './CreateFarm'
interface ReferralDialogProps {
    open: boolean
    onClose?: () => void
    onSwapDialogOpen?: () => void
}
const useStyles = makeStyles<{ isDashboard: boolean }>()((theme, { isDashboard }) => ({
    walletStatusBox: {
        width: 535,
        margin: '24px auto',
    },
    bold: {},
    normal: {},
}))

export function ReferralDialog({ open, onClose, onSwapDialogOpen }: ReferralDialogProps) {
    const { t } = useI18N()
    const currentChainId = useChainId()
    const [chainId, setChainId] = useState<ChainId>(currentChainId)
    const isDashboard = isDashboardPage()
    const { classes } = useStyles({ isDashboard })
    const [currentPage, setCurrentPage] = useState(PagesType.LANDING)
    const [previousPages, setPreviousPages] = useState<PagesType[]>([])
    // let previousPages: PagesType[] = []
    const nextPage = (currentPage: PagesType, nextPage: PagesType) => {
        setPreviousPages([...previousPages, currentPage])
        setCurrentPage(nextPage)
    }
    // const [selectedProtocol, setSelectedProtocol] = useState<ProtocolType | null>(null)
    const renderViews = () => {
        switch (currentPage) {
            case PagesType.LANDING:
                return <Landing continue={nextPage} />
            case PagesType.REFERRAL_FARMS:
                return <ReferralFarms continue={nextPage} />
            case PagesType.CREATE_FARM:
                return <CreateFarm continue={nextPage} />
            default:
                return <Landing continue={nextPage} />
        }
    }
    return (
        <InjectedDialog
            open={open}
            onClose={() => {
                if (currentPage === PagesType.LANDING) {
                    onClose?.()
                } else {
                    setCurrentPage(previousPages[previousPages.length - 1])
                    const temp = [...previousPages]
                    temp.splice(temp.length - 1, 1)
                    setPreviousPages(temp)
                }
            }}
            title={t('plugin_referral')}
            disableBackdropClick>
            <DialogContent>{renderViews()}</DialogContent>
        </InjectedDialog>
    )
}
