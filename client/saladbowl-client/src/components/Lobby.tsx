import {
    Box,
    Button,
    Container,
    FormControl,
    FormControlLabel,
    FormLabel,
    Grid,
    InputAdornment,
    Paper,
    Radio,
    RadioGroup,
    TextField,
    Typography
} from "@material-ui/core";
import React, {useReducer, useState} from "react";
import {Team, UserMapType, UsersList, UserType} from "./User";


function UserLobby(props: { joinGame: (username: string) => void }) {
    const [name, setName] = useState(sessionStorage.getItem('username') ?? '');

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setName(event.target.value);
    }

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        sessionStorage.setItem('username', name);
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

function ChooseTeam({disabled, team, teams}: { team: Team, teams: Team[], disabled?: boolean, }) {
    const [value, setValue] = useState(team);

    const buttons = teams.map(team => <FormControlLabel key={team} value={team} control={<Radio/>} label={Team[team]}
                                                        disabled={disabled} labelPlacement="bottom"/>)

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

function PlayerConfig(props: { user: UserType, teams: Team[], onReady: (name: string, team: Team) => void }) {
    const {user, teams} = props;

    const [ready, setReady] = useState(user.name !== undefined && user.team !== undefined);
    const [name, setName] = useState(user.name ?? '');

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (ready) props.onReady(name, user.team);
        setReady(!ready);
    }

    const handleNameChange = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setName(event.target.value);
    }

    return (
        <Paper>
            <Typography variant="subtitle1">User Settings</Typography>
            <form onSubmit={handleSubmit}>
                <Grid container direction="column" alignItems="center" spacing={1}>
                    <Grid item>
                        <TextField id="input-username" label="Name" value={name} onChange={handleNameChange}
                                   required disabled={ready}/>
                    </Grid>
                    <Grid item>
                        <ChooseTeam team={user.team} teams={teams} disabled/>
                    </Grid>
                    <Grid item>
                        <Button type="submit">{ready ? "Edit" : "Ready"}</Button>
                    </Grid>
                </Grid>
            </form>
        </Paper>
    );
}

function GameConfig(props: { defaults: { maxWords: number, suggestionTime: number, guessingTime: number, rounds: number }, onSubmit: (maxWords: number, suggestionTime: number, guessingTime: number, rounds: number) => void }) {
    const [values, setValues] = useState(props.defaults);

    function errorReducer(state: { maxWords: string, suggestionTime: string, guessingTime: string, rounds: string }, action: { nam: string, val: number }): { maxWords: string; suggestionTime: string; guessingTime: string; rounds: string } {
        let msg;
        if (isNaN(action.val)) {
            msg = 'Not a umber';
        } else if (action.val < 0) {
            msg = 'Must be greater than 0';
        } else {
            msg = '';
        }

        return {...state, [action.nam]: msg}
    }

    const [errors, dispatchErrors] = useReducer(errorReducer, {
        maxWords: '',
        suggestionTime: '',
        guessingTime: '',
        rounds: ''
    });

    const {
        guessingTime: guessingTimeDefault,
        rounds: roundsDefault,
        maxWords: maxWordsDefault,
        suggestionTime: suggestionTimeDefault
    } = props.defaults;
    const {guessingTime, rounds, maxWords, suggestionTime} = values;


    const noErrors = () => {
        return Object.values(errors).reduce((pre, cur) => pre && cur === '', true);
    }

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        const nam = event.target.name;
        let val = parseInt(event.target.value);
        val = isNaN(val) || val < 0 ? 0 : val;
        dispatchErrors({nam, val});

        setValues({...values, [nam]: isNaN(val) ? undefined : val});
    }

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (noErrors()) {
            props.onSubmit(maxWords, suggestionTime, guessingTime, rounds);
        }
    }

    const iaSeconds = <InputAdornment position="end">s</InputAdornment>
    const buttonDisabled = () => {
        return maxWordsDefault === maxWords && suggestionTimeDefault === suggestionTime && guessingTimeDefault === guessingTime && roundsDefault === rounds;
    }


    return <Paper>
        <Typography variant="subtitle1">Game:</Typography>
        <form onSubmit={handleSubmit} autoComplete="off" onError={() => console.log('error')}>
            <TextField id="input-maxWords" label="Words to submit" type="number" name="maxWords"
                       required fullWidth
                       value={maxWords ?? ''} onChange={handleChange} placeholder={maxWordsDefault + ''}
                       error={errors.maxWords !== ''} helperText={errors.maxWords}/>
            <br/>
            <TextField id="input-suggestionTime" label="Suggestion Time" type="number" name="suggestionTime"
                       required fullWidth InputProps={{endAdornment: iaSeconds}}
                       value={suggestionTime ?? ''} onChange={handleChange}
                       placeholder={suggestionTimeDefault + ''}
                       error={errors.suggestionTime !== ''} helperText={errors.suggestionTime}/>
            <br/>
            <TextField id="input-guessingTime" label="Time to guess" type="number" name="guessingTime"
                       required fullWidth disabled InputProps={{endAdornment: iaSeconds}}
                       value={guessingTime ?? ''} onChange={handleChange} placeholder={guessingTimeDefault + ''}
                       error={errors.guessingTime !== ''} helperText={errors.guessingTime}/>
            <br/>
            <TextField id="input-rounds" label="Rounds to play" type="number" name="rounds"
                       required fullWidth
                       value={rounds ?? ''} onChange={handleChange} placeholder={roundsDefault + ''}
                       error={errors.rounds !== ''} helperText={errors.rounds}/>
            <br/>
            <Button type="submit" disabled={buttonDisabled() || !noErrors()}>Set</Button>
        </form>
    </Paper>
}

function PlayerLobby(props: { user: UserType, teams: Team[], onReady: (name: string, team: Team) => void, onStart: () => void, onConfigSubmit: (maxWords: number, suggestionTime: number, guessingTime: number, rounds: number) => void }) {
    const {user, teams} = props;

    return (
        <Box>
            <Typography variant="subtitle1">Lobby</Typography>
            <Grid container className="PlayerLobby" direction="column" spacing={2}>
                <Grid item>
                    {user.owner ?
                        <GameConfig defaults={{guessingTime: 30, maxWords: 15, suggestionTime: 180, rounds: 3}}
                                    onSubmit={props.onConfigSubmit}/> : null}
                </Grid>
                <Grid item>
                    <Paper>
                        <PlayerConfig user={user} teams={teams} onReady={props.onReady}/>
                    </Paper>
                </Grid>
                <Button>StartGame</Button>
            </Grid>
        </Box>
    );
}

function Lobby(props: { user?: UserType, users: UserMapType, joinGame: (name: string) => void, onReady: (name: string, team: Team) => void, onStart: () => void, onConfigSubmit: (maxWords: number, suggestionTime: number, guessingTime: number, rounds: number) => void }) {
    const {user, users, joinGame, onReady, onStart, onConfigSubmit} = props;

    let left;
    if (user) {
        users.delete(user.id);
        left = <PlayerLobby user={user} teams={[Team.BLUE, Team.RED]} onReady={onReady} onStart={onStart}
                            onConfigSubmit={onConfigSubmit}/>
    } else {
        left = <UserLobby joinGame={joinGame}/>
    }

    return (
        <Paper>
            <Grid container spacing={2}>
                <Grid item>
                    <Container>{left}</Container>
                </Grid>
                <Grid item>
                    <Paper>
                        <Typography variant="subtitle2">Players</Typography>
                        <UsersList users={Array.from(users.values())}/>
                    </Paper>
                </Grid>
            </Grid>
        </Paper>
    );
}

export default Lobby;

export {Lobby}