import { useCallback } from 'react'
import { useAsync } from 'react-use'
import { v4 as uuid } from 'uuid'
import { groupBy } from 'lodash-unified'
import { fromWei } from 'web3-utils'
import {
    useAccount,
    useChainId,
    useWeb3,
    useTokenListConstants,
    ERC20TokenDetailed,
    useNativeTokenDetailed,
} from '@masknet/web3-shared-evm'
import { makeStyles, useCustomSnackbar } from '@masknet/theme'
import { TokenList } from '@masknet/web3-providers'
import { Grid, Typography, CircularProgress, Button, Box } from '@mui/material'

import { useI18N } from '../../../utils'
import { farmsService, entitlementsService, referralFarmService } from '../Worker/services'
import { toNativeRewardTokenDefn, parseChainAddress, roundValue, makeLeafHash } from '../helpers'
import { useRequiredChainId } from '../hooks/useRequiredChainId'
import {
    Farm,
    EntitlementLog,
    PageInterface,
    PagesType,
    TransactionStatus,
    RewardsHarvestedEvent,
    TabsReferralFarms,
} from '../types'

import { AccordionFarm } from './shared-ui/AccordionFarm'
import { EthereumChainBoundary } from '../../../web3/UI/EthereumChainBoundary'

import { useSharedStyles } from './styles'

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
    entitlements: EntitlementLog[]
    rewardsHarvested: RewardsHarvestedEvent[]
    allTokens: ERC20TokenDetailed[]
    farms: Farm[]
}
function FarmsList({ entitlements, allTokens, farms, rewardsHarvested, ...props }: FarmsListProps) {
    const { t } = useI18N()
    const currentChainId = useChainId()
    const account = useAccount()
    const web3 = useWeb3({ chainId: currentChainId })
    const { value: nativeToken } = useNativeTokenDetailed()
    const { showSnackbar } = useCustomSnackbar()
    const pageType = props?.pageType || PagesType.REFERRAL_FARMS

    const allTokensMap = new Map(allTokens.map((token) => [token.address.toLowerCase(), token]))
    const farmsMap = new Map(farms.map((farm) => [farm.farmHash, farm]))
    const entitlementsGrouped = groupBy(entitlements, (entitlement: EntitlementLog) =>
        entitlement.args.farmHash.toLowerCase(),
    )
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
                        reward: totalRewards.toFixed(4),
                        symbol: rewardTokenSymbol ?? '',
                    }),
                },
            },
        })
    }, [])

    const onConfirmHarvestRewards = useCallback(
        (txHash: string) => {
            props?.onChangePage?.(PagesType.TRANSACTION, t('plugin_referral_transaction'), {
                hideAttrLogo: true,
                transactionDialog: {
                    transaction: {
                        status: TransactionStatus.CONFIRMED,
                        actionButton: {
                            label: t('dismiss'),
                            onClick: () => props?.onChangePage?.(pageType, TabsReferralFarms.TOKENS + ': ' + pageType),
                        },
                        transactionHash: txHash,
                    },
                },
            })
        },
        [props],
    )

    const onErrorHarvestRewards = useCallback(
        (error?: string) => {
            showSnackbar(error || t('go_wrong'), { variant: 'error' })
            props?.onChangePage?.(pageType, TabsReferralFarms.TOKENS + ': ' + pageType)
        },
        [props],
    )

    const onClickHarvestRewards = useCallback(
        async (
            entitlements: EntitlementLog[],
            totalRewards: number,
            rewardTokenDefn: string,
            rewardTokenSymbol?: string,
        ) => {
            const entitlementsNotBurned = entitlements.filter((entitlement) => {
                const leafHash = makeLeafHash(currentChainId, entitlement.args, rewardTokenDefn)

                if (rewardsHarvestedMap.get(leafHash)) return false

                return true
            })
            referralFarmService.harvestRewards(
                onConfirmHarvestRewards,
                () => onStartHarvestRewards(totalRewards, rewardTokenSymbol),
                onErrorHarvestRewards,
                web3,
                account,
                currentChainId,
                entitlementsNotBurned,
                rewardTokenDefn,
            )
        },
        [web3, account, currentChainId, props],
    )

    return (
        <>
            {Object.entries(entitlementsGrouped).map(([farmHash, entitlements]) => {
                const farm = farmsMap.get(farmHash)

                if (!farm) return null

                const totalRewards = entitlements.reduce(function (accumulator, current) {
                    return accumulator + Number(fromWei(current.args.rewardValue.toString()))
                }, 0)
                const farmrRewardsHarvested = rewardsHarvested.filter((reward) => reward.farmHash === farmHash)
                const claimed = farmrRewardsHarvested.reduce(function (accumulator, current) {
                    return accumulator + current.value
                }, 0)
                const claimable = totalRewards - claimed

                const nativeRewardToken = toNativeRewardTokenDefn(currentChainId)
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
                                    {roundValue(claimable, rewardToken?.decimals)} {rewardToken?.symbol}
                                </Typography>
                                <Button
                                    disabled={claimable <= 0}
                                    variant="contained"
                                    size="medium"
                                    onClick={() =>
                                        onClickHarvestRewards(
                                            entitlements,
                                            totalRewards,
                                            farm.rewardTokenDefn,
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
    const { classes: sharedClasses } = useSharedStyles()
    const currentChainId = useChainId()
    const requiredChainId = useRequiredChainId(currentChainId)
    const account = useAccount()
    const web3 = useWeb3({ chainId: currentChainId })
    const { ERC20 } = useTokenListConstants()

    const { value: entitlements = [], loading: loadingEntitlements } = useAsync(
        async () => (account ? entitlementsService.getAccountEntitlements(account) : []),
        [account],
    )
    const { value: rewardsHarvested = [], loading: loadingRewardsHarvested } = useAsync(
        async () => (account ? farmsService.getMyRewardsHarvested(web3, account, currentChainId) : []),
        [account, currentChainId],
    )

    // fetch farm for referred tokens
    const { value: farms = [], loading: loadingFarms } = useAsync(
        async () => farmsService.getAllFarms(web3, currentChainId),
        [],
    )

    // fetch tokens data
    const { value: allTokens = [], loading: loadingAllTokens } = useAsync(
        async () =>
            !ERC20 || ERC20.length === 0 ? [] : TokenList.fetchERC20TokensFromTokenLists(ERC20, currentChainId),
        [currentChainId, ERC20?.sort().join()],
    )

    if (currentChainId !== requiredChainId) {
        return (
            <EthereumChainBoundary
                chainId={requiredChainId}
                noSwitchNetworkTip
                classes={{ switchButton: sharedClasses.switchButton }}
            />
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
                        {t('plugin_referral_rewards_earned')}
                    </Typography>
                </Grid>
            </Grid>
            <div className={classes.content}>
                {loadingEntitlements || loadingAllTokens || loadingFarms || loadingRewardsHarvested ? (
                    <CircularProgress size={50} />
                ) : (
                    <>
                        {!entitlements.length ? (
                            <Typography className={classes.noFarm}>
                                {t('plugin_referral_you_have_not_joined_farm')}
                            </Typography>
                        ) : (
                            <FarmsList
                                entitlements={entitlements}
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
