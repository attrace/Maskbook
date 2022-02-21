import { Grid, Typography, Accordion, AccordionDetails, AccordionSummary } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

import { makeStyles } from '@masknet/theme'
import { APR } from '../../constants'

const useStyles = makeStyles()((theme) => {
    const isDarkMode = theme.palette.mode === 'dark'

    return {
        accordion: {
            marginBottom: '20px',
            width: '100%',
            background: isDarkMode ? '#15171A' : theme.palette.background.default,
            ':first-of-type': {
                borderRadius: 0,
            },
            ':before': {
                height: 0,
                opacity: 0,
            },
        },
        accordionSummary: {
            margin: 0,
            padding: 0,
        },
        accordionSummaryContent: {
            margin: '0px!important',
        },
        accordionDetails: {
            marginTop: '8px',
            padding: '8px',
            background: isDarkMode ? '#15171A' : theme.palette.background.default,
            borderRadius: '4px',
        },
        total: {
            marginRight: '5px',
        },
    }
})

export interface AccordionFarmProps extends React.PropsWithChildren<{}> {
    farmDetails: React.ReactElement
    accordionDetails: React.ReactElement
    totalValue: number
    rewardTokenSymbol?: string
    apr?: number
}

export function AccordionFarm({ farmDetails, accordionDetails, rewardTokenSymbol, totalValue }: AccordionFarmProps) {
    const { classes } = useStyles()

    return (
        <Accordion className={classes.accordion}>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1a-content"
                id="panel1a-header"
                classes={{
                    root: classes.accordionSummary,
                    content: classes.accordionSummaryContent,
                }}>
                <Grid item xs={6}>
                    {farmDetails}
                </Grid>
                <Grid item xs={2} display="flex" alignItems="center">
                    <Typography className={classes.total}>{APR}</Typography>
                </Grid>
                <Grid item xs={4} display="flex" alignItems="center">
                    <Typography className={classes.total}>{Number.parseFloat(totalValue.toFixed(5))}</Typography>
                    <Typography className={classes.total}>{rewardTokenSymbol || '-'}</Typography>
                </Grid>
            </AccordionSummary>
            <AccordionDetails className={classes.accordionDetails}>{accordionDetails}</AccordionDetails>
        </Accordion>
    )
}
