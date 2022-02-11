import { useState } from 'react'
import { InjectedDialog } from '../../../components/shared/InjectedDialog'
import { Box, Typography, DialogContent } from '@mui/material'
import { AdjustFarmRewardsInterface, Icons, PageHistory, PagesType } from '../types'
import { useI18N } from '../../../utils'
import { ChainId, useChainId } from '@masknet/web3-shared-evm'
import { isDashboardPage } from '@masknet/shared-base'
import { makeStyles } from '@masknet/theme'
import { Landing } from './Landing'
import { ReferralFarms } from './ReferralFarms'
import { CreateFarm } from './CreateFarm'
import { ReferToFarm } from './ReferToFarm'
import { SelectToken } from './SelectToken'
import { BuyToFarm } from './BuyToFarm'
import { AdjustFarmRewards } from './AdjustFarmRewards'
import { SvgIcons } from './Icons'

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
    content: {
        padding: theme.spacing(0, 3, 0),
    },
    title: {
        width: '378px',
    },
    icon: {
        marginLeft: '5px',
    },
    attrText: {
        fontSize: '12px',
        color: theme.palette.text.secondary,
    },
}))

export function ReferralDialog({ open, onClose, onSwapDialogOpen }: ReferralDialogProps) {
    const { t } = useI18N()
    const currentChainId = useChainId()
    const [chainId, setChainId] = useState<ChainId>(currentChainId)
    const isDashboard = isDashboardPage()
    const { classes } = useStyles({ isDashboard })
    const [currentPage, setCurrentPage] = useState<PageHistory>({
        page: PagesType.LANDING,
        title: t('plugin_referral'),
    })
    const [previousPages, setPreviousPages] = useState<PageHistory[]>([])
    const [currentTitle, setCurrentTitle] = useState(t('plugin_referral'))
    const [propsData, setPropsData] = useState<AdjustFarmRewardsInterface>()

    // let previousPages: PagesType[] = []
    const nextPage = (
        currentPage: PagesType,
        nextPage: PagesType,
        title: string = t('plugin_referral'),
        props?: AdjustFarmRewardsInterface,
    ) => {
        setPreviousPages([...previousPages, { page: currentPage, title: currentTitle }])
        setCurrentPage({ page: nextPage, title: title })
        setCurrentTitle(title)
        setPropsData(props)
    }
    const renderViews = () => {
        const { page } = currentPage
        switch (page) {
            case PagesType.LANDING:
                return <Landing continue={nextPage} />
            case PagesType.REFERRAL_FARMS:
                return <ReferralFarms continue={nextPage} />
            case PagesType.CREATE_FARM:
                return <CreateFarm continue={nextPage} onClose={onClose} />
            case PagesType.REFER_TO_FARM:
                return <ReferToFarm continue={nextPage} onClose={onClose} />
            case PagesType.BUY_TO_FARM:
                return <BuyToFarm continue={nextPage} onClose={onClose} />
            case PagesType.ADJUST_REWARDS:
                return <AdjustFarmRewards onClose={onClose} {...propsData} />
            case PagesType.SELECT_TOKEN:
                return <SelectToken />
            default:
                return <Landing continue={nextPage} />
        }
    }
    return (
        <InjectedDialog
            open={open}
            onClose={() => {
                const { page } = currentPage
                if (page === PagesType.LANDING) {
                    onClose?.()
                } else {
                    const previousPage = previousPages[previousPages.length - 1]
                    setCurrentPage(previousPage)
                    const { title } = previousPage
                    setCurrentTitle(title)
                    const temp = [...previousPages]
                    temp.splice(temp.length - 1, 1)
                    setPreviousPages(temp)
                }
            }}
            title={
                <Box display="flex" justifyContent="space-between">
                    <div className={classes.title}>{currentTitle}</div>
                    <Typography display="flex" alignItems="center" className={classes.attrText} fontWeight={400}>
                        {t('plugin_powered_by')}
                        <Box className={classes.icon}>
                            <SvgIcons icon={Icons.AttrTextIcon} />
                        </Box>
                    </Typography>
                </Box>
            }
            disableBackdropClick>
            <DialogContent className={classes.content}>{renderViews()}</DialogContent>
        </InjectedDialog>
    )
}
