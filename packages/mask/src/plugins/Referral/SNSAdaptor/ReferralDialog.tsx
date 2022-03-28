import { useState, useCallback } from 'react'
import { Box, Typography, DialogContent } from '@mui/material'
import { isDashboardPage } from '@masknet/shared-base'
import { makeStyles } from '@masknet/theme'

import { Icons, PageHistory, PagesType, DialogInterface } from '../types'
import { useI18N } from '../../../utils'

import { InjectedDialog } from '../../../components/shared/InjectedDialog'
import { Landing } from './Landing'
import { ReferralFarms } from './ReferralFarms'
import { CreateFarm } from './CreateFarm'
import { ReferToFarm } from './ReferToFarm'
import { SelectToken } from './SelectToken'
import { BuyToFarm } from './BuyToFarm'
import { AdjustFarmRewards } from './AdjustFarmRewards'
import { Transaction } from './Transaction'
import { Deposit } from './Deposit'
import { SvgIcons } from './Icons'

interface ReferralDialogProps {
    open: boolean
    onClose?: () => void
    onSwapDialogOpen?: () => void
}

const useStyles = makeStyles<{ isDashboard: boolean; hideBackBtn?: boolean }>()(
    (theme, { isDashboard, hideBackBtn = false }) => ({
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
            width: '100%',
        },
        icon: {
            marginLeft: '5px',
        },
        attrText: {
            fontSize: '12px',
            color: theme.palette.text.secondary,
        },
        dialogTitleTypography: {
            flex: '1',
            marginLeft: 0,
        },
        dialogTitle: {
            minHeight: '60px',
            padding: theme.spacing(0, 3),
            fontSize: '19px',
            lineHeight: '27px',
            fontWeight: 600,
        },
        dialogPaper: {
            maxWidth: '600px!important',
            boxShadow: 'none!important',
            backgroundImage: 'none!important',
        },
        dialogCloseButton: {
            display: hideBackBtn ? 'none' : 'inline-flex',
            color: theme.palette.text.strong,
            padding: 0,
            marginRight: '16px',
        },
    }),
)

export function ReferralDialog({ open, onClose, onSwapDialogOpen }: ReferralDialogProps) {
    const [propsData, setPropsData] = useState<DialogInterface>()

    const { t } = useI18N()
    const isDashboard = isDashboardPage()
    const { classes } = useStyles({ isDashboard, hideBackBtn: propsData?.hideBackBtn })
    const [currentPage, setCurrentPage] = useState<PageHistory>({
        page: PagesType.LANDING,
        title: t('plugin_referral'),
    })
    const [previousPages, setPreviousPages] = useState<PageHistory[]>([])
    const [currentTitle, setCurrentTitle] = useState(t('plugin_referral'))

    const onContinue = (
        currentPage: PagesType,
        nextPage: PagesType,
        title: string = t('plugin_referral'),
        props?: DialogInterface,
    ) => {
        setPreviousPages([...previousPages, { page: currentPage, title: currentTitle }])
        setCurrentPage({ page: nextPage, title: title })
        setCurrentTitle(title)
        setPropsData(props)
    }

    const onChangePage = (page: PagesType, title: string = t('plugin_referral'), props?: DialogInterface) => {
        setCurrentPage({ page, title: title })
        setCurrentTitle(title)
        setPropsData(props)
    }

    const renderViews = () => {
        const { page } = currentPage
        switch (page) {
            case PagesType.LANDING:
                return <Landing continue={onContinue} />
            case PagesType.REFERRAL_FARMS:
                return <ReferralFarms continue={onContinue} />
            case PagesType.CREATE_FARM:
                return <CreateFarm continue={onContinue} onClose={onClose} onChangePage={onChangePage} />
            case PagesType.REFER_TO_FARM:
                return <ReferToFarm continue={onContinue} onClose={onClose} onChangePage={onChangePage} />
            case PagesType.BUY_TO_FARM:
                return <BuyToFarm continue={onContinue} onClose={onClose} onChangePage={onChangePage} />
            case PagesType.ADJUST_REWARDS:
                return (
                    <AdjustFarmRewards
                        {...propsData?.adjustFarmDialog}
                        continue={onContinue}
                        onClose={onClose}
                        onChangePage={onChangePage}
                    />
                )
            case PagesType.DEPOSIT:
                return <Deposit {...propsData?.depositDialog} />
            case PagesType.SELECT_TOKEN:
                return <SelectToken />
            case PagesType.TRANSACTION:
                return <Transaction onClose={onClose} {...propsData?.transactionDialog} />
            default:
                return <Landing continue={onContinue} />
        }
    }

    const onHandleClose = useCallback(async () => {
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

            if (page === PagesType.DEPOSIT && previousPage.page === PagesType.ADJUST_REWARDS) {
                const data: any = localStorage.getItem('adjustFarmRewardsData')
                const adjustFarmRewardsData = JSON.parse(data)

                const props: DialogInterface = {
                    adjustFarmDialog: {
                        farm: adjustFarmRewardsData.farm,
                        referredToken: adjustFarmRewardsData.referredToken,
                        rewardToken: adjustFarmRewardsData.rewardToken,
                        continue: () => {},
                    },
                }

                setPropsData(props)
            }
        }
    }, [currentPage, onClose])

    return (
        <InjectedDialog
            open={open}
            onClose={onHandleClose}
            title={
                propsData?.hideAttrLogo ? (
                    currentTitle
                ) : (
                    <Box display="flex" justifyContent="space-between" className={classes.title}>
                        <div>{currentTitle}</div>
                        <Typography display="flex" alignItems="center" className={classes.attrText}>
                            Powered by
                            <Box className={classes.icon}>
                                <SvgIcons icon={Icons.AttrTextIcon} />
                            </Box>
                        </Typography>
                    </Box>
                )
            }
            disableBackdropClick
            classes={{
                paper: classes.dialogPaper,
                dialogCloseButton: classes.dialogCloseButton,
                dialogTitle: classes.dialogTitle,
                dialogTitleTypography: classes.dialogTitleTypography,
            }}>
            <DialogContent className={classes.content}>{renderViews()}</DialogContent>
        </InjectedDialog>
    )
}
