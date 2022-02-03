import type { Plugin } from '@masknet/plugin-infra'
import { base } from '../base'
import { REFERRAL_META_KEY } from '../constants'
import { ReferralMetadataReader } from './helpers'
import { FarmPost } from './FarmPost'
import type { ReferralMetaData } from '../types'
import { ReferralDialog } from './ReferralDialog'
import { SelectToken } from './SelectToken'
import { SelectTokenToBuy } from './SelectTokenToBuy'

const sns: Plugin.SNSAdaptor.Definition = {
    ...base,
    init(signal) {},
    DecryptedInspector(props) {
        const metadata = ReferralMetadataReader(props.message.meta)
        if (!metadata.ok) return null
        return <FarmPost payload={metadata.val} />
    },
    CompositionDialogMetadataBadgeRender: new Map([
        [
            REFERRAL_META_KEY,
            (meta: ReferralMetaData) => `Refer Farm of '${meta.referral_token_name}' from ${meta.sender}`,
        ],
    ]),
    CompositionDialogEntry: {
        label: {
            fallback: <>Referral</>,
        },
        dialog: ReferralDialog,
    },
    GlobalInjection: function Component() {
        return (
            <>
                <SelectToken />
                <SelectTokenToBuy />
            </>
        )
    },
}

export default sns
