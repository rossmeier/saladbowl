import React from "react";
import {Grid, Tooltip, Typography} from "@material-ui/core";
import {UserType} from "./User";

function Bowl({current, total}: { current?: number, total?: number }) {
    return (
        <Grid container spacing={1}>
            <Grid item>
                <Typography>Bowl: </Typography>
            </Grid>
            <Grid item>
                <Tooltip title="Remaining items in the bowl.">
                    <Typography>remaining {current ?? 'n'} (of {total ?? 'm'})</Typography>
                </Tooltip>
            </Grid>
        </Grid>
    );
}

function Guess({user, bowlUpdate}: { user?: UserType, bowlUpdate: { current: number, total: number } }) {

    const name = user?.name ?? '???';
    return (
        <div>
            <Typography variant="subtitle1">Guess</Typography>
            <Grid container direction="column" className="Guess">
                <Grid item>
                    <Bowl current={bowlUpdate.current} total={bowlUpdate.total}/>
                </Grid>
                <Grid item>
                    <Typography>{name} is explaining.</Typography>
                </Grid>
            </Grid>
        </div>
    );
}

export default Guess;