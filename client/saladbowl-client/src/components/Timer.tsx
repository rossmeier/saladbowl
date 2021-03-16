import {useEffect, useState} from "react";
import {Typography} from "@material-ui/core";

function Timer(props: { options: Intl.DateTimeFormatOptions, timeLeft: number }) {
    const [seconds, setSeconds] = useState(props.timeLeft);
    const [target, setTarget] = useState(new Date(Date.now() + props.timeLeft * 1000));

    function tick(target: Date) {
        const diff = target.getTime() - Date.now();
        const seconds = Math.floor(diff / 1000);
        setSeconds(Math.max(0, seconds));
    }

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (seconds >= 0) {
            interval = setInterval(() => tick(target), 500);
        }

        return () => clearInterval(interval);
    }, [seconds, target]);

    const {options} = props;
    const prefix = seconds < 0 ? '+ ' : '';
    return <Typography>{prefix + new Date(0,0,0,0,0,Math.abs(seconds)).toLocaleString(undefined, options)}</Typography>
}

export default Timer