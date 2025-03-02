import { mediaViewerUrl } from '@masknet/shared'
import urlcat from 'urlcat'
import { ImageType } from './types'
import { resolveIPFSLink } from '@masknet/web3-shared-evm'
import { EMPTY_LIST } from '@masknet/shared-base'

export const PetsPluginID = 'com.maskbook.pets'
export const TWITTER = 'twitter.com'
export const MASK_TWITTER = 'realMaskNetwork'
export const DEFAULT_SET_WORD =
    'Click the wallet icon on the left side of the page and set up your Non-Fungible Friend in "NFTs" tab!'
export const DEFAULT_PUNK_MASK_WORD =
    "I'm CryptoPunk #6128... in 3D & with a body! Voyagers, welcome to the uncharted waters of WEB3!"
export const NFF_TWITTER = 'https://twitter.com/NonFFriend'

export const initMeta = {
    userId: '',
    tokenId: '',
    contract: '',
    word: '',
    image: '',
    type: ImageType.NORMAL,
    chainId: undefined,
}

export const initCollection = {
    name: '',
    contract: '',
    icon: '',
    tokens: EMPTY_LIST,
    chainId: undefined,
}

export const Punk3D = {
    contract: '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb',
    tokenId: '6128',
    url: urlcat(mediaViewerUrl, {
        /* cspell:disable-next-line */
        url: resolveIPFSLink('QmZjfo1zKTfQZjqs4CaZJ7pQDZHrUBaozre8Z71c7ZXGMc'),
        type: 'model/gltf-binary',
    }),
}

export const Share_Twitter = 'https://twitter.com/NonFFriend/status/1508791087149641731'
export const Share_Twitter_TXT = `I just set up my Non-Fungible Friend with @realMaskNetwork (powered by @NonFFriend). Visit my profile to check it out! Install Mask Network extension from mask.io and set yours.\n #mask_io #nonfungiblefriends\n${Share_Twitter}`

export const GLB3DIcon = new URL('./assets/glb3D.png', import.meta.url).toString()
export const CloseIcon = new URL('./assets/close.png', import.meta.url).toString()
export const DragIcon = new URL('./assets/drag.png', import.meta.url).toString()
export const DefaultIcon = new URL('./assets/defaultIcon.png', import.meta.url).toString()
export const PunkIcon = new URL('./assets/punk2d.png', import.meta.url).toString()
