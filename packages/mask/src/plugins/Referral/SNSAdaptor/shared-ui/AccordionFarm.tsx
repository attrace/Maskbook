import { Grid, Typography, Accordion, AccordionDetails, AccordionSummary } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

import { makeStyles } from '@masknet/theme'

const useStyles = makeStyles()((theme) => ({
    accordion: {
        marginBottom: '20px',
        width: '100%',
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
        background: theme.palette.background.default,
        borderRadius: '4px',
    },
    total: {
        marginRight: '5px',
    },
}))

export interface AccordionFarmProps extends React.PropsWithChildren<{}> {
    farmDetails: React.ReactElement
    accordionDetails: React.ReactElement
    totalValue: number
    rewardTokenSymbol?: string
    apr?: number
}

export function AccordionFarm({
    farmDetails,
    accordionDetails,
    rewardTokenSymbol,
    totalValue,
    apr,
}: AccordionFarmProps) {
    const { classes } = useStyles()

    const aprFormatted = apr || apr === 0 ? <>{apr === 0 ? <span>&#8734;</span> : `${apr * 100} %`}</> : '-'

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
                    <Typography className={classes.total}>{aprFormatted}</Typography>
                </Grid>
                <Grid item xs={4} display="flex" alignItems="center">
                    <Typography className={classes.total}>{totalValue}</Typography>
                    <Typography className={classes.total}>{rewardTokenSymbol || '-'}</Typography>
                </Grid>
            </AccordionSummary>
            <AccordionDetails className={classes.accordionDetails}>{accordionDetails}</AccordionDetails>
        </Accordion>
    )
}
