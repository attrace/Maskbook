import { ERC20TokenDetailed, useChainId, useNativeTokenDetailed } from '@masknet/web3-shared-evm'
import { parseChainAddress, FarmExistsEvent } from '../../types'
import { toNativeRewardTokenDefn } from '../helpers'
import { ReferredFarmTokenDetailed } from './ReferredFarmTokenDetailed'
import { AccordionFarm } from './AccordionFarm'

export interface AccordionSponsoredFarmProps extends React.PropsWithChildren<{}> {
    farm: FarmExistsEvent
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
    const rewardToken =
        farm.rewardTokenDefn === nativeRewardToken
            ? nativeToken
            : allTokensMap.get(parseChainAddress(farm.referredTokenDefn).address)
    const rewardTokenSymbol = rewardToken?.symbol

    return (
        <AccordionFarm
            farmDetails={
                <ReferredFarmTokenDetailed
                    token={rewardToken}
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
