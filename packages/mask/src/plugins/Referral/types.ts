import type { ChainId } from '@masknet/web3-shared-evm'

export interface SavingsNetwork {
    chainId: ChainId
    chainName: string
}

export enum ProtocolCategory {
    ETH = 'eth',
}

export enum ProtocolType {
    Lido = 0,
}

// export enum PagesType {
//     LANDING = 'landing',
//     REFERRAL_FARMS = 'Referral Farms',
//     CREATE_FARM = 'Create Farm',
//     REFER_TO_FARM = 'Refer to Farm',
//     BUY_TO_FARM = 'Buy to Farm',
//     SELECT_TOKEN = 'Select a Token to Refer',
//     TRANSACTION = 'Transaction',
// }
export enum PagesType {
    LANDING = 'landing',
    REFERRAL_FARMS = 'Referral Farms',
    CREATE_FARM = 'Create Farm',
    REFER_TO_FARM = 'Refer to Farm',
    BUY_TO_FARM = 'Buy to Farm',
    SELECT_TOKEN = 'Select a Token to Refer',
    TRANSACTION = 'Transaction',
}
export enum TabsReferralFarms {
    TOKENS = 'CRYPTO TOKENS',
    NFT = 'NFTs',
}

export enum TabsCreateFarm {
    NEW = 'New',
    CREATED = 'Created',
}

export enum TabsReferAndBuy {
    NEW = 'New',
    MY_FARMS = 'My Farms',
}
