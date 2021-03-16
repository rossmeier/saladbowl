import {Button, Container, Grid, Paper, TextField, Typography} from "@material-ui/core";
import {UsersList, UserType} from "./User";
import React, {useState} from "react";
import Timer from "./Timer";

function SuggestWord(props: { submitWords: (args: string[]) => void, maxWords: number, timeLeft: number }) {
    const [value, setValue] = useState('');
    const [ready, setReady] = useState(false);

    const {submitWords, maxWords, timeLeft} = props;
    const getWords = () => {
        return value.split('\n').filter(w => w.length > 0);
    }

    function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!ready) {
            submitWords(getWords().slice(0, maxWords));
        }
        setReady(ready => !ready);
    }

    function handleChange(event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) {
        setValue(event.target.value);
    }

    const wordCount = getWords().length;
    let help = '';
    if (getWords().length > maxWords){
        help = `To many words, first ${maxWords} will be used.`
    }

    return (
        <form onSubmit={onSubmit}>
            <Grid container direction="column" spacing={2}>
                <Grid item>
                    <Timer timeLeft={timeLeft} options={{minute: '2-digit', second: '2-digit'}}/>
                </Grid>
                <Grid item>
                    <Typography>Enter your suggestions, one per line ({wordCount}/{maxWords})</Typography>
                </Grid>
                <Grid item>
                    <TextField id="input-words" label="Words" value={value} onChange={handleChange} variant="filled"
                               multiline rows={3} rowsMax={maxWords} required disabled={ready} fullWidth
                               helperText={help}/>
                </Grid>
                <Grid item>
                    <Button type="submit">{ready ? 'Edit' : 'Ready'}</Button>
                </Grid>
            </Grid>
        </form>
    );
}

function SuggestionPhase(props: { users: UserType[], sendWords: (args: string[]) => void }) {
    const {users} = props;

    return (
        <Paper>
            <Grid container spacing={2}>
                <Grid item>
                    <Container>
                        <SuggestWord submitWords={props.sendWords} maxWords={10} timeLeft={27}/>
                    </Container>
                </Grid>
                <Grid item>
                    <Paper>
                        <Typography variant="subtitle2">Players</Typography>
                        <UsersList users={Array.from(users)}/>
                    </Paper>
                </Grid>
            </Grid>
        </Paper>
    );
}

export default SuggestionPhase;