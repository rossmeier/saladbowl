import {Grid, Paper, Typography} from "@material-ui/core";

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


function User(props: { user: UserType }) {
    const {user} = props;
    return <Paper>
        <Grid container alignItems="center" spacing={1}>
            <Grid item>
                {user.status}
            </Grid>
            <Grid item>
                <Typography variant="subtitle1">
                    {user.name}
                </Typography>
            </Grid>
            <Grid item>
                <Typography variant="subtitle2" color="textSecondary">
                    Score: {user.score}
                </Typography>
            </Grid>
        </Grid>
    </Paper>
}

function UsersList(props: { users: UserType[] }) {
    const items = props.users.map(user => <Grid item key={user.id}><User user={user}/></Grid>);
    return <div className="UsersList">
            <Grid container spacing={2} direction="column" justify="flex-start" alignItems="stretch">
                {items}
            </Grid>
        </div>

}

export {Team, PlayerStatus, UsersList};

export type {UserType, UserMapType}
