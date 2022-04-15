import { useState } from 'react'
import type { Plugin } from '@masknet/plugin-infra'
import { ApplicationEntry } from '@masknet/shared'
import { CrossIsolationMessages } from '@masknet/shared-base'

import type { ReferralMetaData } from '../types'
import { base } from '../base'
import { META_KEY } from '../constants'
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
        [META_KEY, (meta: ReferralMetaData) => `Refer Farm of '${meta.referral_token_name}' from ${meta.sender}`],
    ]),
    CompositionDialogEntry: {
        label: <>Referral Farms</>,
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
                            onClick={() =>
                                CrossIsolationMessages.events.requestComposition.sendToLocal({
                                    reason: 'timeline',
                                    open: true,
                                    options: {
                                        startupPlugin: base.ID,
                                    },
                                })
                            }
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
