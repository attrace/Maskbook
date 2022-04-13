import { useState } from 'react'
import type { Plugin } from '@masknet/plugin-infra'
import { ApplicationEntry } from '@masknet/shared'

import type { ReferralMetaData } from '../types'
import { base } from '../base'
import { REFERRAL_META_KEY } from '../constants'
import { referralMetadataReader } from './helpers'

import { FarmPost } from './FarmPost'
import { ReferralDialog } from './ReferralDialog'
import { SelectToken } from './SelectToken'
import ReactDOMServer from 'react-dom/server'

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
            fallback: ReactDOMServer.renderToString(<>Referral</>),
        },
        dialog: ReferralDialog,
    },
    GlobalInjection: function Component() {
        return <SelectToken />
    },
    ApplicationEntries: [
        {
            RenderEntryComponent({ disabled }) {
                const [open, setOpen] = useState(false)
                return (
                    <>
                        <ApplicationEntry
                            disabled={disabled}
                            title="Referral Farms"
                            icon={new URL('../SNSAdaptor/assets/referral.png', import.meta.url).toString()}
                            onClick={() => setOpen(true)}
                        />
                        <ReferralDialog open={open} onClose={() => setOpen(false)} />
                    </>
                )
            },
            defaultSortingPriority: 12,
        },
    ],
}

export default sns
