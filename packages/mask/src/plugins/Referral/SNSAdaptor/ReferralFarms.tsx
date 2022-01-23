import { useState } from 'react'
import { TabContext, TabPanel } from '@mui/lab'
import { Button, Box, Tab, Tabs, Grid } from '@mui/material'
// import { ProtocolType } from '../types'
import { useI18N } from '../../../utils'
import { ChainId, useChainId } from '@masknet/web3-shared-evm'
import { isDashboardPage } from '@masknet/shared-base'
import { makeStyles } from '@masknet/theme'
import { PagesType, TabsReferralFarms } from '../types'
interface ReferralDialogProps {
    open: boolean
    onClose?: () => void
    onSwapDialogOpen?: () => void
}
const useStyles = makeStyles<{ isDashboard: boolean }>()((theme, { isDashboard }) => ({
    root: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        height: '100%',
        borderRadius: 8,
    },
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
    // tabs: {
    //     left: 0,
    //     right: 0,
    //     position: 'absolute',
    // },
}))
// function tabsNext({ name: string, onClick }) {
//     return (
//         <div>
//             name
//         </div>
//     )
// }
const tabsNext = (name: string, onClickButton?: () => void) => {
    return (
        <div>
            <Button
                onClick={() => {
                    onClickButton()
                }}
                variant="rounded">
                <Grid>
                    <img src={new URL('./assets/referral.png', import.meta.url).toString()} />
                    <div>{name}</div>
                </Grid>
            </Button>
        </div>
    )
}

export interface ReferralFarmsProps {
    continue: (currentPage: PagesType, nextPage: PagesType) => void
}
export function ReferralFarms(props: ReferralFarmsProps) {
    const { t } = useI18N()
    const currentChainId = useChainId()
    const [chainId, setChainId] = useState<ChainId>(currentChainId)
    const isDashboard = isDashboardPage()
    const { classes } = useStyles({ isDashboard })
    // const [selectedProtocol, setSelectedProtocol] = useState<ProtocolType | null>(null)
    const [tab, setTab] = useState<string>(TabsReferralFarms.TOKENS)
    const types = [
        {
            name: 'Refer to Farm',
            onClick: () => {},
        },
        {
            name: 'Buy to Farm',
            onClick: () => {
                props.continue(PagesType.REFERRAL_FARMS, PagesType.CREATE_FARM)
            },
        },
        {
            name: 'Create Farm',
            onClick: () => {
                props.continue(PagesType.REFERRAL_FARMS, PagesType.CREATE_FARM)
            },
        },
    ]

    return (
        <div>
            <Box className={classes.container}>
                <TabContext value={String(tab)}>
                    <Tabs
                        value={tab}
                        centered
                        onChange={(e, v) => setTab(v)}
                        aria-label="persona-post-contacts-button-group">
                        <Tab value={TabsReferralFarms.TOKENS} label="Tokens" />
                        <Tab value={TabsReferralFarms.NFT} label="NFTs" />
                    </Tabs>
                    <TabPanel value={TabsReferralFarms.TOKENS} className={classes.tab}>
                        <Grid container direction="row" justifyContent="center">
                            {types.map((type) => {
                                return <div key={type.name}>{tabsNext(type.name, type.onClick)}</div>
                            })}
                        </Grid>
                    </TabPanel>
                    <TabPanel value={TabsReferralFarms.NFT} className={classes.tab}>
                        Item 2
                    </TabPanel>
                </TabContext>
            </Box>
            <Button
                onClick={() => {
                    props.continue(PagesType.REFERRAL_FARMS, PagesType.CREATE_FARM)
                }}
                variant="contained">
                Continue
            </Button>
        </div>
    )
}
