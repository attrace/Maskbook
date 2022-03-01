import { useAsync } from 'react-use'

import { Grid, Typography, CircularProgress, Box, Button } from '@mui/material'
import { getMaskColor, makeStyles } from '@masknet/theme'

import { useI18N } from '../../../utils'
import { v4 as uuid } from 'uuid'
import {
    useAccount,
    useChainId,
    useWeb3,
    useTokenListConstants,
    useNativeTokenDetailed,
} from '@masknet/web3-shared-evm'
import { fromWei } from 'web3-utils'
import { getMyFarms, getFarmsDeposits } from '../Worker/apis/farms'
import {
    FarmDepositChange,
    FarmExistsEvent,
    PageInterface,
    PagesType,
    parseChainAddress,
    TabsReferralFarms,
} from '../types'
import { AccordionFarm } from './shared-ui/AccordionFarm'
import { PROPORTIONAL_FARM_REFERRED_TOKEN_DEFN } from '../constants'

import { fetchERC20TokensFromTokenLists } from '../../../extension/background-script/EthereumService'
import { toNativeRewardTokenDefn } from './helpers'

const useStyles = makeStyles()((theme) => ({
    container: {
        lineHeight: '22px',
        fontWeight: 300,
        '& > div::-webkit-scrollbar': {
            width: '7px',
        },
        '& > div::-webkit-scrollbar-track': {
            boxShadow: 'inset 0 0 6px rgba(0,0,0,0.00)',
            webkitBoxShadow: 'inset 0 0 6px rgba(0,0,0,0.00)',
        },
        '& > div::-webkit-scrollbar-thumb': {
            borderRadius: '4px',
            backgroundColor: theme.palette.background.default,
        },
    },
    col: {
        color: theme.palette.text.secondary,
        fontWeight: 500,
    },
    content: {
        height: 320,
        overflowY: 'scroll',
        marginTop: 20,
        color: theme.palette.text.strong,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    heading: {
        paddingRight: '27px',
    },
    noFarm: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '12px',
        background: theme.palette.background.default,
        height: '44px',
        color: theme.palette.text.strong,
        fontWeight: 500,
    },
    total: {
        marginRight: '4px',
    },
    buttonWithdraw: {
        background: getMaskColor(theme).redMain,
        marginRight: '12px',
        ':hover': {
            background: getMaskColor(theme).redMain,
        },
    },
}))

interface Farm extends FarmExistsEvent {
    totalFarmRewards?: number
    dailyFarmReward?: number
    apr?: number
}
function groupDepositForFarms(myFarms: FarmExistsEvent[], farmsDeposits: FarmDepositChange[]) {
    const farms: Farm[] = []
    const farmTotalDepositMap = new Map<string, number>()

    farmsDeposits.forEach((deposit) => {
        const { farmHash, delta } = deposit
        const prevFarmState = farmTotalDepositMap.get(farmHash) || 0

        const totalFarmRewards = prevFarmState + Number(fromWei(delta.toString()))
        farmTotalDepositMap.set(farmHash, totalFarmRewards)
    })

    myFarms.forEach((farm) => {
        farms.push({ totalFarmRewards: farmTotalDepositMap.get(farm.farmHash) || 0, ...farm })
    })

    return farms
}

export function CreatedFarms(props: PageInterface) {
    const { t } = useI18N()
    const { classes } = useStyles()
    const chainId = useChainId()
    const account = useAccount()
    const web3 = useWeb3({ chainId })
    const { ERC20 } = useTokenListConstants()
    const { value: allTokens = [], loading: loadingAllTokens } = useAsync(
        async () => (!ERC20 || ERC20.length === 0 ? [] : fetchERC20TokensFromTokenLists(ERC20, chainId)),
        [chainId, ERC20?.sort().join()],
    )
    // fetch my farms
    const { value: myFarms = [], loading: loadingMyFarms } = useAsync(
        async () => getMyFarms(web3, account, chainId),
        [web3, account],
    )
    const { value: nativeToken } = useNativeTokenDetailed()
    // fetch all deposits
    const { value: farmsDeposits = [], loading: loadingFarmsDeposits } = useAsync(
        async () => getFarmsDeposits(web3, chainId),
        [web3],
    )

    const allTokensMap = new Map(allTokens.map((token) => [token.address.toLowerCase(), token]))

    // TODO: remove filter after new contract deploy
    const mySponsoredFarms = myFarms.filter((farm) => farm.referredTokenDefn !== PROPORTIONAL_FARM_REFERRED_TOKEN_DEFN)
    const farms = groupDepositForFarms(mySponsoredFarms, farmsDeposits)

    const onAdjustRewardButtonClick = (farm: Farm) => {
        const nativeRewardToken = toNativeRewardTokenDefn(chainId)

        const rewardToken =
            farm.rewardTokenDefn === nativeRewardToken
                ? nativeToken
                : allTokensMap.get(parseChainAddress(farm.referredTokenDefn).address)

        props.continue(
            PagesType.CREATE_FARM,
            PagesType.ADJUST_REWARDS,
            `${TabsReferralFarms.TOKENS}: ${t('plugin_referral_adjust_rewards')}`,
            {
                adjustFarmDialog: {
                    farm: farm,
                    token: rewardToken,
                    continue: () => {},
                },
            },
        )
    }

    return (
        <div className={classes.container}>
            <Grid container justifyContent="space-between" rowSpacing="20px" className={classes.heading}>
                <Grid item xs={6}>
                    <Typography fontWeight={500} className={classes.col}>
                        {t('plugin_referral_referral_farm')}
                    </Typography>
                </Grid>
                <Grid item xs={2}>
                    <Typography fontWeight={500} className={classes.col}>
                        {t('plugin_referral_apr')}
                    </Typography>
                </Grid>
                <Grid item xs={4}>
                    <Typography fontWeight={500} className={classes.col}>
                        {t('plugin_referral_total_rewards')}
                    </Typography>
                </Grid>
            </Grid>
            <div className={classes.content}>
                {loadingMyFarms || loadingFarmsDeposits || loadingAllTokens ? (
                    <CircularProgress size={50} />
                ) : (
                    <>
                        {farms.length === 0 ? (
                            <Typography className={classes.noFarm}>{t('plugin_referral_no_created_farm')}</Typography>
                        ) : (
                            farms.map((farm) => {
                                return (
                                    <AccordionFarm
                                        key={uuid()}
                                        farm={farm}
                                        allTokensMap={allTokensMap}
                                        totalValue={Number.parseFloat(farm?.totalFarmRewards?.toFixed(5) ?? '0')}
                                        accordionDetails={
                                            <Box display="flex" justifyContent="flex-end">
                                                <Button
                                                    disabled
                                                    variant="contained"
                                                    size="medium"
                                                    className={classes.buttonWithdraw}
                                                    onClick={() => console.log('request to withdraw')}>
                                                    {t('plugin_referral_request_to_withdraw')}
                                                </Button>
                                                <Button
                                                    variant="contained"
                                                    size="medium"
                                                    onClick={() => {
                                                        onAdjustRewardButtonClick({ ...farm })
                                                    }}>
                                                    {t('plugin_referral_adjust_rewards')}
                                                </Button>
                                            </Box>
                                        }
                                    />
                                )
                            })
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
