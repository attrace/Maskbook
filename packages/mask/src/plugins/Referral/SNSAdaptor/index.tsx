import type { Plugin } from '@masknet/plugin-infra'

import type { ReferralMetaData } from '../types'
import { base } from '../base'
import { REFERRAL_META_KEY } from '../constants'
import { referralMetadataReader } from './helpers'

import { FarmPost } from './FarmPost'
import { ReferralDialog } from './ReferralDialog'
import { SelectToken } from './SelectToken'

const sns: Plugin.SNSAdaptor.Definition = {
    ...base,
    init() {},
    DecryptedInspector(props) {
        const metadata = referralMetadataReader(props.message.meta)
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
        return <SelectToken />
    },
}

export default sns
