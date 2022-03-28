import { useCallback } from 'react'
import { useAsync } from 'react-use'
import { v4 as uuid } from 'uuid'
import {
    useAccount,
    useChainId,
    useWeb3,
    useTokenListConstants,
    ERC20TokenDetailed,
    useNativeTokenDetailed,
} from '@masknet/web3-shared-evm'
import { fromWei } from 'web3-utils'
import { makeStyles } from '@masknet/theme'
import { TokenList } from '@masknet/web3-providers'
import { Grid, Typography, CircularProgress, Button, Box } from '@mui/material'

import { useI18N } from '../../../utils'
import { getAllFarms, getMyRewardsHarvested } from '../Worker/apis/farms'
import { getAccountRewardsProofs } from '../Worker/apis/verifier'
import { harvestRewards } from '../Worker/apis/referralFarm'
import { toNativeRewardTokenDefn, parseChainAddress } from './helpers'
import {
    Farm,
    RewardProof,
    VerifierEffect,
    HarvestRequest,
    PageInterface,
    PagesType,
    TransactionStatus,
    RewardsHarvestedEvent,
    TabsReferralFarms,
} from '../types'

import { AccordionFarm } from './shared-ui/AccordionFarm'

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

interface FarmsListProps extends PageInterface {
    pageType: PagesType
    rewardsProofs: RewardProof[]
    rewardsHarvested: RewardsHarvestedEvent[]
    allTokens: ERC20TokenDetailed[]
    farms: Farm[]
}
function FarmsList({ rewardsProofs, allTokens, farms, pageType, rewardsHarvested, ...props }: FarmsListProps) {
    const { t } = useI18N()
    const chainId = useChainId()
    const account = useAccount()
    const web3 = useWeb3({ chainId })
    const { value: nativeToken } = useNativeTokenDetailed()

    const allTokensMap = new Map(allTokens.map((token) => [token.address.toLowerCase(), token]))
    const farmsMap = new Map(farms.map((farm) => [farm.farmHash, farm]))
    const rewardsHarvestedMap = new Map(
        rewardsHarvested.map((rewardHarvested) => [rewardHarvested.leafHash, rewardHarvested.value]),
    )

    const onStartHarvestRewards = useCallback((totalRewards: number, rewardTokenSymbol?: string) => {
        props?.onChangePage?.(PagesType.TRANSACTION, t('plugin_referral_transaction'), {
            hideBackBtn: true,
            hideAttrLogo: true,
            transactionDialog: {
                transaction: {
                    status: TransactionStatus.CONFIRMATION,
                    title: t('plugin_referral_confirm_transaction'),
                    subtitle: t('plugin_referral_confirm_transaction_harvesting', {
                        reward: totalRewards,
                        symbol: rewardTokenSymbol ?? '',
                    }),
                },
            },
        })
    }, [])

    const onConfirmHarvestRewards = useCallback(
        (txHash) => {
            props?.onChangePage?.(PagesType.TRANSACTION, t('plugin_referral_transaction'), {
                hideAttrLogo: true,
                transactionDialog: {
                    transaction: {
                        status: TransactionStatus.CONFIRMED,
                        actionButton: {
                            label: t('dismiss'),
                            onClick: () =>
                                props?.onChangePage?.(
                                    PagesType.REFER_TO_FARM,
                                    TabsReferralFarms.TOKENS + ': ' + PagesType.REFER_TO_FARM,
                                ),
                        },
                        transactionHash: txHash,
                    },
                },
            })
        },
        [props],
    )

    const onClickHarvestRewards = useCallback(
        async (effect: VerifierEffect, req: HarvestRequest, totalRewards: number, rewardTokenSymbol?: string) => {
            harvestRewards(
                (txHash: string) => {
                    onConfirmHarvestRewards(txHash)
                },
                () => {
                    onStartHarvestRewards(totalRewards, rewardTokenSymbol)
                },
                () => {
                    props?.onChangePage?.(
                        PagesType.REFER_TO_FARM,
                        TabsReferralFarms.TOKENS + ': ' + PagesType.REFER_TO_FARM,
                    )
                },
                web3,
                account,
                chainId,
                effect,
                req,
            )
        },
        [web3, account, chainId, props],
    )

    return (
        <>
            {rewardsProofs.map((proof) => {
                let totalRewards = 0
                let farm: Farm | undefined

                proof.req.rewards.forEach((reward) => {
                    const farmDetails = farmsMap.get(reward.farmHash)

                    farm = farmDetails
                    totalRewards = totalRewards + Number(fromWei(reward.value.hex))
                })

                if (!farm) return null

                const claimed = rewardsHarvestedMap.get(proof.leafHash) || 0
                const claimable = totalRewards - claimed

                const nativeRewardToken = toNativeRewardTokenDefn(chainId)
                const rewardToken =
                    farm.rewardTokenDefn === nativeRewardToken
                        ? nativeToken
                        : allTokensMap.get(parseChainAddress(farm.referredTokenDefn).address)

                return (
                    <AccordionFarm
                        key={uuid()}
                        farm={farm}
                        allTokensMap={allTokensMap}
                        totalValue={totalRewards}
                        accordionDetails={
                            <Box display="flex" justifyContent="flex-end">
                                <Typography display="flex" alignItems="center" marginRight="20px" fontWeight={600}>
                                    <span style={{ marginRight: '4px' }}>{t('plugin_referral_claimable')}:</span>{' '}
                                    {claimable} {rewardToken?.symbol}
                                </Typography>
                                <Button
                                    disabled={!!claimed}
                                    variant="contained"
                                    size="medium"
                                    onClick={() =>
                                        onClickHarvestRewards(
                                            proof.effect,
                                            proof.req,
                                            totalRewards,
                                            rewardToken?.symbol,
                                        )
                                    }>
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

export function MyFarms(props: PageInterface) {
    const { t } = useI18N()
    const { classes } = useStyles()
    const chainId = useChainId()
    const account = useAccount()
    const web3 = useWeb3({ chainId })
    const { ERC20 } = useTokenListConstants()

    const { value: rewardsProofs = [], loading: loadingProofs } = useAsync(
        async () => (account ? getAccountRewardsProofs(account) : []),
        [account],
    )
    const { value: rewardsHarvested = [], loading: loadingRewardsHarvested } = useAsync(
        async () => (account ? getMyRewardsHarvested(web3, account, chainId) : []),
        [account, chainId],
    )

    // fetch farm for referred tokens
    const { value: farms = [], loading: loadingFarms } = useAsync(async () => getAllFarms(web3, chainId), [])

    // fetch tokens data
    const { value: allTokens = [], loading: loadingAllTokens } = useAsync(
        async () => (!ERC20 || ERC20.length === 0 ? [] : TokenList.fetchERC20TokensFromTokenLists(ERC20, chainId)),
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
                {loadingProofs || loadingAllTokens || loadingFarms || loadingRewardsHarvested ? (
                    <CircularProgress size={50} />
                ) : (
                    <>
                        {!rewardsProofs.length ? (
                            <Typography className={classes.noFarm}>
                                {t('plugin_referral_you_have_not_joined_farm')}
                            </Typography>
                        ) : (
                            <FarmsList
                                pageType={props.pageType || PagesType.REFERRAL_FARMS}
                                rewardsProofs={rewardsProofs}
                                rewardsHarvested={rewardsHarvested}
                                allTokens={allTokens}
                                farms={farms}
                                {...props}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
