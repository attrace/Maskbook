import { createIcon } from '../utils'
import type { SvgIcon } from '@mui/material'

export const RefreshIcon: typeof SvgIcon = createIcon(
    'Refresh',
    <g>
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 4.934a7.198 7.198 0 0 0-6.283 3.68.8.8 0 1 1-1.395-.783A8.8 8.8 0 1 1 3.2 12.134a.8.8 0 0 1 1.6 0 7.2 7.2 0 1 0 7.2-7.2Z"
        />
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M4.797 3.47a.8.8 0 0 1 .8.8v3.2h3.2a.8.8 0 0 1 0 1.6h-4a.8.8 0 0 1-.8-.8v-4a.8.8 0 0 1 .8-.8Z"
        />
    </g>,
    '0 0 24 24',
)
