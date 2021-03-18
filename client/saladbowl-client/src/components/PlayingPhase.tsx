import {PlayerStatus, UserType} from "./User";
import Explain from "./Explain";
import {Typography} from "@material-ui/core";
import Guess from "./Guess";

function PlayingPhase(props: { meID: number, users: Map<number, UserType>, wordNew: { word: string, timeLeft: number }, onSuccess: () => void, bowlUpdate: { current: number, total: number } }) {
    const {meID, users, onSuccess, wordNew: {word, timeLeft}, bowlUpdate} = props;

    const user = users.get(meID);

    let content;
    if (!user) {
        content = <Typography color="error">Error: current user is missing'</Typography>;
    } else {
        if (user.status === PlayerStatus.ACTIVE) {
            content =
                <Explain onSkip={() => console.log('skipped')} onSuccess={onSuccess} word={word} timeLeft={timeLeft}/>
        } else {
            const activeUsers = Array.from(users.values()).filter(u => u.status === PlayerStatus.ACTIVE);
            if (activeUsers.length === 0) {
                console.warn('No active user');
            }
            content = <Guess user={activeUsers[0]} bowlUpdate={bowlUpdate}/>
        }
    }

    return content;
}

export default PlayingPhase