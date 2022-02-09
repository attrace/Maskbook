import { WalletMessages } from '@masknet/plugin-wallet'
import { useCurrentIdentity } from '../../../../components/DataSource/useActivatedUI'
import { useRemoteControlledDialog } from '@masknet/shared'
import type { ChainId, FungibleTokenDetailed } from '@masknet/web3-shared-evm'
import { REFERRAL_META_KEY } from '../../constants'
import { useCompositionContext } from '@masknet/plugin-infra'

export function useInsertFarmPost(token: FungibleTokenDetailed | undefined, chainId: ChainId, onClose?: () => void) {
    const { closeDialog: closeWalletStatusDialog } = useRemoteControlledDialog(
        WalletMessages.events.walletStatusDialogUpdated,
    )
    const currentIdentity = useCurrentIdentity()
    const senderName = currentIdentity?.identifier.userId ?? currentIdentity?.linkedPersona?.nickname ?? 'Unknown User'
    const { attachMetadata, dropMetadata } = useCompositionContext()

    if (!token?.address) {
        return alert('REFERRED TOKEN DID NOT SELECT')
    }

    const { address, name = '', symbol = '', logoURI = [''] } = token
    const selectedReferralData = {
        referral_token: address,
        referral_token_name: name,
        referral_token_symbol: symbol,
        referral_token_icon: logoURI,
        referral_token_chain_id: chainId,
        sender: senderName ?? '',
    }
    if (selectedReferralData) {
        attachMetadata(REFERRAL_META_KEY, JSON.parse(JSON.stringify(selectedReferralData)))
    } else {
        dropMetadata(REFERRAL_META_KEY)
    }

    closeWalletStatusDialog()
    onClose?.()
}
