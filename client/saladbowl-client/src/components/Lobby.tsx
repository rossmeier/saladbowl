import {
    Button, Container,
    FormControl,
    FormControlLabel,
    FormLabel, Grid,
    Radio,
    RadioGroup,
    TextField
} from "@material-ui/core";
import React, {useState} from "react";
import {Team, UserMapType, UsersList, UserType} from "./User";

function ChooseTeam({disabled, team, teams}: { team: Team, teams: Team[], disabled?: boolean, }) {
    const [value, setValue] = useState(team);

    const buttons = teams.map(team => <FormControlLabel value={team} control={<Radio/>} label={Team[team]}
                                                        disabled={disabled}/>)

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setValue(parseInt(event.target.value));
    }

    return <FormControl component="fieldset">
        <FormLabel component="legend">Team</FormLabel>
        <RadioGroup row arial-label="team" name="team" value={value} onChange={handleChange}>
            {buttons}
        </RadioGroup>
    </FormControl>
}

function UserLobby(props: { joinGame: (username: string) => void }) {
    const [name, setName] = useState('');

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setName(event.target.value);
    }

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        props.joinGame(name);
    }

    return <div className="Lobby UserLobby">
        <form onSubmit={handleSubmit}>
            <TextField id="input-username" label="Username" value={name} required onChange={handleChange}/>
            <br/>
            <Button type="submit">Join</Button>
        </form>
    </div>
}

function PlayerLobby(props: { user: UserType, teams: Team[] }) {
    const {user, teams} = props;

    const [ready, setReady] = useState(false);
    const [name, setName] = useState(user.name ?? '');


    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setReady(!ready);
    }

    const handleNameChange = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setName(event.target.value);
    }

    return <div className="PlayerLobby">
        <form onSubmit={handleSubmit}>
            <TextField id="input-username" label="Username" value={name} required onChange={handleNameChange}
                       disabled={ready}/>
            <br/>
            <ChooseTeam team={user.team} teams={teams} disabled={ready}/>
            <br/>
            <Button type="submit">{ready ? "Edit" : "Ready"}</Button>
        </form>
        <Button>StartGame</Button>
    </div>
}

function Lobby(props: { user?: UserType, users: UserMapType, joinGame: (name: string) => void }) {
    const {user, users} = props;

    let left;
    if (user) {
        users.delete(user.id);
        left = <PlayerLobby user={user} teams={[Team.BLUE, Team.RED]}/>
    } else {
        left = <UserLobby joinGame={props.joinGame}/>
    }

    return <Grid container spacing={2}>
        <Grid item>
            <Container>{left}</Container>
        </Grid>
        <Grid item>
            <UsersList users={Array.from(users.values())}/>
        </Grid>
    </Grid>
}

export default Lobby;

export {Lobby}