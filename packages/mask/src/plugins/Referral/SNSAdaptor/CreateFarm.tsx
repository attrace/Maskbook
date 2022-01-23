import { useState } from 'react'
import { Typography, Box, Tab, Tabs, Grid } from '@mui/material'
import { TabContext, TabPanel } from '@mui/lab'

// import { ProtocolType } from '../types'
import { useI18N } from '../../../utils'
import { ChainId, useChainId } from '@masknet/web3-shared-evm'
import { isDashboardPage } from '@masknet/shared-base'
import { makeStyles } from '@masknet/theme'
import { PagesType, TabsCreateFarm } from '../types'
import ActionButton from '../../../extension/options-page/DashboardComponents/ActionButton'

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
    container: {
        flex: 1,
        height: '100%',
    },
    tab: {
        maxHeight: '100%',
        height: '100%',
        overflow: 'auto',
        padding: `${theme.spacing(3)} 0`,
    },
    tabs: {
        width: '288px',
    },
}))

export function CreateFarm(props) {
    const { t } = useI18N()
    const currentChainId = useChainId()
    const [chainId, setChainId] = useState<ChainId>(currentChainId)
    const isDashboard = isDashboardPage()
    const { classes } = useStyles({ isDashboard })
    // const [selectedProtocol, setSelectedProtocol] = useState<ProtocolType | null>(null)
    const [tab, setTab] = useState<string>(TabsCreateFarm.NEW)

    return (
        <div>
            <Box className={classes.container}>
                <TabContext value={String(tab)}>
                    <Tabs
                        value={tab}
                        centered
                        onChange={(e, v) => setTab(v)}
                        aria-label="persona-post-contacts-button-group">
                        <Tab value={TabsCreateFarm.NEW} label="New" />
                        <Tab value={TabsCreateFarm.CREATED} label="Created" />
                    </Tabs>
                    <TabPanel value={TabsCreateFarm.NEW} className={classes.tab}>
                        <Grid container />
                        <Typography>
                            <b>{t('create_referral_farm_desc')}</b>
                            <br />
                            <br />
                            {t('select_a_token_desc')}
                        </Typography>
                    </TabPanel>
                    <TabPanel value={TabsCreateFarm.CREATED} className={classes.tab}>
                        Item 2
                    </TabPanel>
                </TabContext>
            </Box>
            <ActionButton
                fullWidth
                variant="contained"
                size="large"
                onClick={() => {
                    props.continue(PagesType.REFERRAL_FARMS, PagesType.CREATE_FARM)
                }}>
                Create Referral Farm
            </ActionButton>
        </div>
    )
}
