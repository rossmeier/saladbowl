import {Checkbox, FormControlLabel, Grid, Icon, Paper, Typography} from "@material-ui/core";
import React, {useState} from "react";
import {Cached, Done, Schedule} from "@material-ui/icons";

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

    return mapStatus && mapStatus(status) || map(status);
}

function User(props: { user: UserType }): JSX.Element {
    const {user} = props;
    return <Paper>
        <Grid container alignItems="center" spacing={1}>
            <Grid item>
                <UserStatus status={user.status}/>
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
        </Grid>
    </Paper>
}

function UsersList(props: { users: UserType[] }) {
    const [sort, setSort] = useState(false);

    const usersShown = sort ? props.users.slice().sort((a, b) => a.score - b.score) : props.users;

    const items = usersShown.map(user => <Grid item key={user.id}><User user={user}/></Grid>);

    const handleSortChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSort(event.target.checked);
    }
    return <div className="UsersList">
        <Grid container spacing={2} direction="column" justify="flex-start" alignItems="stretch">
            {items}
        </Grid>
        <FormControlLabel control={<Checkbox checked={sort} onChange={handleSortChange} name="sort"/>}
                          label="Sort by score"/>
    </div>

}

export {Team, PlayerStatus, UsersList};

export type {UserType, UserMapType}
