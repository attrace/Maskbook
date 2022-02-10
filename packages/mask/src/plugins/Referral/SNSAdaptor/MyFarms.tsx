import { useAsync } from 'react-use'
import { v4 as uuid } from 'uuid'

import { Grid, Typography, CircularProgress, Button, Box } from '@mui/material'

import { useI18N } from '../../../utils'
import { useAccount, useChainId, useWeb3, useTokenListConstants, ERC20TokenDetailed } from '@masknet/web3-shared-evm'
import { makeStyles } from '@masknet/theme'
import { getAllFarms } from '../Worker/apis/farms'
import { getAccountRewardsProofs, getFarmsAPR } from '../Worker/apis/verifier'
import { fetchERC20TokensFromTokenLists } from '../../../extension/background-script/EthereumService'
import { toChainAddress } from './helpers'
import { ATTR_TOKEN, MASK_TOKEN } from '../constants'
import type { Farm, FarmsAPR, RewardProof } from '../types'

import { AccordionSponsoredFarm } from './shared-ui/AccordionSponsoredFarm'
import { AccordionFarm } from './shared-ui/AccordionFarm'
import { fromWei } from 'web3-utils'
import { ReferredFarmTokenDetailed } from './shared-ui/ReferredFarmTokenDetailed'

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
    heading: {
        paddingRight: '27px',
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
    accordion: {
        width: '100%',
    },
    accordionSummary: {
        margin: 0,
        padding: 0,
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
        marginRight: '5px',
    },
    button: {
        marginLeft: 'auto',
    },
}))

interface FarmsListProps {
    rewardsProofs: RewardProof[]
    allTokens: ERC20TokenDetailed[]
    farms: Farm[]
    farmsAPR?: FarmsAPR
}
function FarmsList({ rewardsProofs, allTokens, farms, farmsAPR }: FarmsListProps) {
    const { t } = useI18N()
    const chainId = useChainId()

    const allTokensMap = new Map(allTokens.map((token) => [token.address.toLowerCase(), token]))
    const farmsMap = new Map(farms.map((farm) => [farm.farmHash, farm]))

    const rewardTokenDefnATTR = toChainAddress(chainId, ATTR_TOKEN.address)
    const rewardTokenDefnMASK = toChainAddress(chainId, MASK_TOKEN.address)

    return (
        <>
            {rewardsProofs.map((proof) => {
                let totalRewards = 0
                let totalAPR = 0
                let farm: Farm | undefined

                proof.req.rewards.forEach((reward) => {
                    const farmDetails = farmsMap.get(reward.farmHash)
                    const farmAPR = farmsAPR?.get(reward.farmHash)?.APR || 0

                    farm = farmDetails
                    totalRewards = totalRewards + Number(fromWei(reward.value.hex))
                    totalAPR = totalAPR + farmAPR
                })

                if (!farm) return null

                // proportional farm: ATTR or MASK is reward token
                const isProportionalFarm =
                    proof.req.rewardTokenDefn === rewardTokenDefnATTR ||
                    proof.req.rewardTokenDefn === rewardTokenDefnMASK

                if (isProportionalFarm) {
                    const rewardToken = proof.req.rewardTokenDefn === rewardTokenDefnATTR ? ATTR_TOKEN : MASK_TOKEN
                    return (
                        <AccordionFarm
                            key={uuid()}
                            farmDetails={
                                <ReferredFarmTokenDetailed
                                    token={rewardToken}
                                    referredTokenDefn={proof.req.rewardTokenDefn}
                                    rewardTokenDefn={proof.req.rewardTokenDefn}
                                    chainId={chainId}
                                    hideFarmTypeIcon
                                />
                            }
                            totalValue={totalRewards}
                            apr={totalAPR}
                            rewardTokenSymbol={rewardToken.symbol}
                            accordionDetails={
                                <Box display="flex" justifyContent="flex-end">
                                    <Button
                                        disabled
                                        variant="contained"
                                        size="medium"
                                        onClick={() => console.log('runHarvest')}>
                                        {t('plugin_referral_harvest_rewards')}
                                    </Button>
                                </Box>
                            }
                        />
                    )
                }

                // sponsored farms
                return (
                    <AccordionSponsoredFarm
                        key={uuid()}
                        farm={farm}
                        allTokensMap={allTokensMap}
                        totalValue={totalRewards}
                        apr={totalAPR}
                        accordionDetails={
                            <Box display="flex" justifyContent="flex-end">
                                <Button
                                    disabled
                                    variant="contained"
                                    size="medium"
                                    onClick={() => console.log('runHarvest')}>
                                    {t('plugin_referral_harvest_rewards')}
                                </Button>
                            </Box>
                        }
                    />
                )
            })}
        </>
    )
}

export function MyFarms() {
    const { t } = useI18N()
    const { classes } = useStyles()
    const chainId = useChainId()
    const account = useAccount()
    const web3 = useWeb3({ chainId })
    const { ERC20 } = useTokenListConstants()

    // MOCK accounts: 0x26bc596D39c5D45C855901b6995e0842E37Ae57a, 0xa668929a8A94c295627Dd115b85a991c399A8265, 0x6Dff822aa18Fcb88d9e8eBDeA099341BA111E606
    const { value: rewardsProofs = [], loading: loadingProofs } = useAsync(
        async () => (account ? getAccountRewardsProofs(account) : []),
        [account],
    )
    const rewardTokensDefn = rewardsProofs.map((proof) => proof.req.rewardTokenDefn)
    const uniqRewardTokensDefn = [...new Set(rewardTokensDefn)]

    // fetch farm for referred tokens
    const { value: farms = [], loading: loadingFarms } = useAsync(
        async () =>
            uniqRewardTokensDefn?.length ? getAllFarms(web3, chainId, { rewardTokens: uniqRewardTokensDefn }) : [],
        [uniqRewardTokensDefn?.join()],
    )
    // fetch farms APR
    const { value: farmsAPR, loading: loadingFarmsAPR } = useAsync(async () => getFarmsAPR({}), [])
    // fetch tokens data
    const { value: allTokens = [], loading: loadingAllTokens } = useAsync(
        async () => (!ERC20 || ERC20.length === 0 ? [] : fetchERC20TokensFromTokenLists(ERC20, chainId)),
        [chainId, ERC20?.sort().join()],
    )

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
                        {t('plugin_referral_rewards_earned')}
                    </Typography>
                </Grid>
            </Grid>
            <div className={classes.content}>
                {loadingProofs || loadingAllTokens || loadingFarms || loadingFarmsAPR ? (
                    <CircularProgress size={50} />
                ) : (
                    <>
                        {!rewardsProofs.length ? (
                            <Typography className={classes.noFarm}>
                                {t('plugin_referral_you_have_not_joined_farm')}
                            </Typography>
                        ) : (
                            <FarmsList
                                rewardsProofs={rewardsProofs}
                                allTokens={allTokens}
                                farms={farms}
                                farmsAPR={farmsAPR}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
