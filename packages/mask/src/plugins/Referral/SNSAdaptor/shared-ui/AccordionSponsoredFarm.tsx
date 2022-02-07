import { ERC20TokenDetailed, useChainId, useNativeTokenDetailed } from '@masknet/web3-shared-evm'
import { parseChainAddress, Farm } from '../../types'
import { toNativeRewardTokenDefn } from '../helpers'
import { ReferredFarmTokenDetailed } from './ReferredFarmTokenDetailed'
import { AccordionFarm } from './AccordionFarm'

export interface AccordionSponsoredFarmProps extends React.PropsWithChildren<{}> {
    farm: Farm
    allTokensMap: Map<string, ERC20TokenDetailed>
    totalValue: number
    accordionDetails: React.ReactElement
    apr?: number
}

export function AccordionSponsoredFarm({
    farm,
    allTokensMap,
    apr,
    totalValue,
    accordionDetails,
}: AccordionSponsoredFarmProps) {
    const chainId = useChainId()
    const { value: nativeToken } = useNativeTokenDetailed()

    const nativeRewardToken = toNativeRewardTokenDefn(chainId)
    const rewardTokenSymbol =
        farm.rewardTokenDefn === nativeRewardToken
            ? nativeToken?.symbol
            : allTokensMap.get(parseChainAddress(farm.rewardTokenDefn).address)?.symbol

    return (
        <AccordionFarm
            farmDetails={
                <ReferredFarmTokenDetailed
                    token={
                        farm.rewardTokenDefn === nativeRewardToken
                            ? nativeToken
                            : allTokensMap.get(parseChainAddress(farm.referredTokenDefn).address)
                    }
                    referredTokenDefn={farm.referredTokenDefn}
                    rewardTokenDefn={farm.rewardTokenDefn}
                    chainId={chainId}
                />
            }
            accordionDetails={accordionDetails}
            rewardTokenSymbol={rewardTokenSymbol}
            totalValue={totalValue}
            apr={apr}
        />
    )
}
