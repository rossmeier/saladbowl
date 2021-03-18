import {Button, Grid, Tooltip, Typography} from "@material-ui/core";
import Timer from "./Timer";

function Explain(props: { word: string, timeLeft: number, onSuccess: () => void, onSkip?: () => void }) {
    return (
        <div>
            <Typography variant="subtitle1">Explain</Typography>
            <Grid container direction="column" className="">
                <Grid item>
                    <Tooltip title="Time left">
                        <Timer options={{minute: '2-digit', second: '2-digit'}} timeLeft={props.timeLeft}/>
                    </Tooltip>
                </Grid>
                <Grid item className="Word">
                    <Tooltip title="Explain this word">
                        <Typography variant="subtitle1">{props.word}</Typography>
                    </Tooltip>
                </Grid>
                <Grid item>
                    <Button onClick={props.onSuccess}>Success</Button>
                    <Button onClick={props.onSkip} disabled={typeof props.onSkip === "function"}>Skip</Button>
                </Grid>
            </Grid>
        </div>
    );
}

export default Explain