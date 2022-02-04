import { useState } from 'react'
import { TabContext, TabPanel } from '@mui/lab'
import { Button, Box, Tab, Tabs, Grid } from '@mui/material'
// import { ProtocolType } from '../types'
import { useI18N } from '../../../utils'
import { ChainId, useChainId } from '@masknet/web3-shared-evm'
import { isDashboardPage } from '@masknet/shared-base'
import { makeStyles } from '@masknet/theme'
import { PagesType, TabsReferralFarms } from '../types'
import { IconURLS } from './IconURL'

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
}))

const useStylesType = makeStyles()((theme) => ({
    root: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100px',
        borderRadius: '8px',
        background: theme.palette.background.default,
    },
    img: {
        width: 40,
        marginRight: 4,
        justifyContent: 'center',
    },
}))

interface TypeProps {
    name: string
    onClick?: () => void
    iconUrl: string
}
export function Type({ name, onClick, iconUrl }: TypeProps) {
    const { classes } = useStylesType()

    return (
        <Grid item xs={4} key={name}>
            <Button
                variant="rounded"
                onClick={() => {
                    onClick?.()
                }}
                className={classes.root}>
                <Grid>
                    <img className={classes.img} src={iconUrl} />
                    <div>{name}</div>
                </Grid>
            </Button>
        </Grid>
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
            onClick: () => {
                props.continue(PagesType.REFERRAL_FARMS, PagesType.REFER_TO_FARM)
            },
            iconUrl: IconURLS.referToFarm,
        },
        {
            name: 'Buy to Farm',
            onClick: () => {
                props.continue(PagesType.REFERRAL_FARMS, PagesType.BUY_TO_FARM)
            },
            iconUrl: IconURLS.buyToFarm,
        },
        {
            name: 'Create Farm',
            onClick: () => {
                props.continue(PagesType.REFERRAL_FARMS, PagesType.CREATE_FARM)
            },
            iconUrl: IconURLS.createFarm,
        },
    ]

    return (
        <div>
            <Box className={classes.container}>
                <TabContext value={String(tab)}>
                    <Tabs
                        value={tab}
                        centered
                        variant="fullWidth"
                        onChange={(e, v) => setTab(v)}
                        aria-label="persona-post-contacts-button-group">
                        <Tab value={TabsReferralFarms.TOKENS} label="Crypto Tokens" />
                        <Tab value={TabsReferralFarms.NFT} label="NFTs" />
                    </Tabs>
                    <TabPanel value={TabsReferralFarms.TOKENS} className={classes.tab}>
                        <Grid container spacing="20px">
                            {types.map((type) => (
                                <Type key={type.name} name={type.name} onClick={type.onClick} iconUrl={type.iconUrl} />
                            ))}
                        </Grid>
                    </TabPanel>
                    <TabPanel value={TabsReferralFarms.NFT} className={classes.tab}>
                        <Grid container spacing="20px">
                            {types.map((type) => (
                                <Type key={type.name} name={type.name} onClick={type.onClick} iconUrl={type.iconUrl} />
                            ))}
                        </Grid>
                    </TabPanel>
                </TabContext>
            </Box>
        </div>
    )
}
