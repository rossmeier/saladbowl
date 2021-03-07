import {Button, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField} from "@material-ui/core";
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

function UserLobby(props: { usersMap: UserMapType, joinGame: (username: string) => void }) {
    const [name, setName] = useState('');

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setName(event.target.value);
    }

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        props.joinGame(name);
    }

    return <div className="Lobby UserLobby">
        <UsersList users={Array.from(props.usersMap.values())}/>
        <form onSubmit={handleSubmit}>
            <TextField id="input-username" label="Username" value={name} required onChange={handleChange}/>
            <br/>
            <Button type="submit">Join</Button>
        </form>
    </div>
}

function PlayerLobby(props: { user: UserType, usersMap: UserMapType, teams: Team[] }) {
    const {user, usersMap, teams} = props;

    const [ready, setReady] = useState(false);
    const [name, setName] = useState(user.name ?? '');


    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setReady(!ready);
    }

    const handleNameChange = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setName(event.target.value);
    }

    const usersArray = Array.from(usersMap.values()).filter(u => u.id != user.id);
    return <div className="Lobby PlayerLobby">
        <UsersList users={usersArray}/>
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

    if (user) {
        users.delete(user.id);
        return <PlayerLobby user={user} usersMap={users} teams={[Team.BLUE, Team.RED]}/>
    } else {
        return <UserLobby usersMap={users} joinGame={props.joinGame}/>
    }
}

export default Lobby;

export {Lobby}