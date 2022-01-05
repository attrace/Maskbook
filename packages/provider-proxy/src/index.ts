import type { RPCMethodRegistrationValue } from './types'
import fungibleTokenProducer from './producers/fungibleTokenAsset'
import nonFungibleCollectionAsset from './producers/nonFungibleCollectionAsset'
import nonFungibleCollectibleAsset from './producers/nonFungibleCollectibleAsset'
import flowNonFungibleCollectibleAsset from './producers/flowNonFungibleCollectibleAsset'

export const producers: RPCMethodRegistrationValue[] = [
    fungibleTokenProducer,
    nonFungibleCollectibleAsset,
    nonFungibleCollectionAsset,
    flowNonFungibleCollectibleAsset,
]
