import {Checkbox, FormControlLabel, Grid, Paper, Typography} from "@material-ui/core";
import React, {useState} from "react";
import {Cached, Done, Face, Schedule} from "@material-ui/icons";

enum Team {
    RED,
    BLUE
}

enum PlayerStatus {
    ACTIVE,
    PASSIVE,
    DISCONNECTED
}

type userID = number;
type UserType = {
    name: string,
    team: Team,
    id: userID,
    status: PlayerStatus,
    score: number,
    owner?: boolean,
}

type UserMapType = Map<userID, UserType>


function UserStatus({status, mapStatus}: { status: PlayerStatus, mapStatus?: (status: PlayerStatus) => JSX.Element }) {
    function map(status: PlayerStatus): JSX.Element {
        switch (status) {
            case PlayerStatus.ACTIVE:
                return <Done fontSize="small"/>;
            case PlayerStatus.PASSIVE:
                return <Schedule fontSize="small"/>;
            case PlayerStatus.DISCONNECTED:
                return <Cached fontSize="small"/>;
        }
    }

    return mapStatus ? mapStatus(status) : map(status);
}

function User(props: { user: UserType, me?: boolean }): JSX.Element {
    const {user} = props;
    return <Paper>
        <Grid container alignItems="center" spacing={1}>
            <Grid item>
                {props.me ? <Face fontSize="small"/> : null}
            </Grid>
            <Grid item>
                <Typography variant="subtitle1">
                    {user.name}
                </Typography>
            </Grid>
            <Grid item>
                <Typography variant="subtitle2" color="textSecondary">
                    {user.score}
                </Typography>
            </Grid>
            <Grid item>
                <Typography variant="subtitle2" color="textSecondary">
                    {Team[user.team]}
                </Typography>
            </Grid>
            <Grid item>
                <UserStatus status={user.status}/>
            </Grid>
        </Grid>
    </Paper>
}

function UsersList(props: { users: UserType[], title?: string, meID?: number }) {
    const [sort, setSort] = useState(false);

    const {users, meID} = props;
    const usersShown = sort ? users.slice().sort((a, b) => a.score - b.score) : users;

    const items = usersShown.map(user => <Grid item key={user.id}><User user={user} me={user.id === meID}/></Grid>);

    if (usersShown.length <= 0) {
        return null
    } else {
        return <div className="UsersList">
            <Grid container spacing={2} direction="column" justify="flex-start" alignItems="stretch">
                {items}
            </Grid>
            {
                users.length > 0 ?
                    <FormControlLabel control={<Checkbox checked={sort} onChange={() => setSort(!sort)} name="sort"/>}
                                      label="Sort by score"
                    /> :
                    null
            }
        </div>
    }

}

export {Team, PlayerStatus, UsersList};

export type {UserType, UserMapType}
