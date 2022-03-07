import { useAsyncRetry } from 'react-use'
import {
    NonFungibleAssetProvider,
    currySameAddress,
    isSameAddress,
    useAccount,
    useChainId,
    useTokenConstants,
    resolveIPFSLink,
} from '@masknet/web3-shared-evm'
import { EVM_RPC } from '../messages'
import { resolveAvatarLinkOnCurrentProvider } from '../../Collectible/pipes'

export function useAsset(address: string, tokenId: string, provider: NonFungibleAssetProvider) {
    const account = useAccount()
    const chainId = useChainId()
    const { WNATIVE_ADDRESS } = useTokenConstants()

    return useAsyncRetry(async () => {
        const asset = await EVM_RPC.getAsset({ address, tokenId, chainId, provider })
        return {
            ...asset,
            image_url: asset?.image_url?.startsWith('ipfs://')
                ? resolveIPFSLink(asset.image_url.replace('ipfs://', ''))
                : asset?.image_url,
            isOrderWeth: isSameAddress(asset?.desktopOrder?.payment_token ?? '', WNATIVE_ADDRESS) ?? false,
            isCollectionWeth: asset?.collection?.payment_tokens?.some(currySameAddress(WNATIVE_ADDRESS)) ?? false,
            isOwner: asset?.top_ownerships.some((item) => isSameAddress(item.owner.address, account)) ?? false,
            collectionLinkUrl: resolveAvatarLinkOnCurrentProvider(chainId, asset, provider),
        }
    }, [account, chainId, WNATIVE_ADDRESS, address, tokenId, provider])
}
