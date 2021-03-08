import Lobby from "./Lobby";
import {UserType} from "./User";
import {useEffect, useState} from "react";
import {ClientHello, ClientToServer} from "../protocol/messages";
import {UnionValue} from "../protocol/bare";
import Client from "../protocol/MessageHandler";
import useWebsocket from "../hooks/WebsocketHook";


const dummyUser = new Map<number, UserType>(
    Array.from([0, 1, 2, 3, 4, 5].map(id => [id, {
        name: 'User' + id * 3,
        id: id,
        team: Math.floor((Math.random() * 10) % 2),
        status: Math.floor((Math.random() * 10) % 3),
        score: id * Math.floor(Math.random() * 1000)
    }]))
);

const host = window.location.host
const hostname = window.location.hostname
const port: number | undefined = 8080;

function SaladBowl({token: gameToken}: { token?: string | null }) {

    const [playerID, setPlayerID] = useState(NaN);
    const [token, setToken] = useState(sessionStorage.getItem('userToken'));
    const [users, setUsers] = useState(new Map<number, UserType>());
    const [messageHandler, setMessageHandler] = useState(new Client());

    const ws = useWebsocket({
        socketUrl: `ws://${port ? hostname : host}${port ? ':' + port : ''}/ws${gameToken ? '/'+gameToken : ''}`,
        retry: 3,
    });

    useEffect(() => {
        if (ws.data) {
            messageHandler.onMessage(ws.data);
        }
    }, [ws.data]);

    useEffect(() => {

        if (!ws.ready && ws.retrying) {
            console.log('socket disconnected, reconnecting...');
            // TODO display info to user
        } else if (!ws.ready && !ws.retrying) {
            console.log('socket disconnected');
            // TODO offer user to reconnect.
        } else {
            console.log('socket connected');
        }

    }, [ws.ready, ws.retrying]);

    useEffect(() => {
        if (token) {
            sessionStorage.setItem('userToken', token);
        }
    }, [token])

    useEffect(() => {
        messageHandler.onServerHello = value => {
            setToken(value.token);
            setPlayerID(value.playerID);
        }
        messageHandler.onPlayerList = value => {
            // We need to make sure newUser is interpreted as array of tuples [any, any][] and not as array of arrays (type1 | type2)[][].
            // The second value is of type any so we don't need to import PlayerValue from th MessageHandler
            // TODO Type correctly, after merging types from User.tsx and MessageHandler.ts to a single location.
            const newUser: [number, any][] = value.map(user => [user.id, user]);
            setUsers(users => new Map(newUser));
        }
    }, [messageHandler]);

    const joinGame = (username: string) => {
        console.log('joining game as user ' + username);
        const obj = new UnionValue(ClientHello, {name: username});
        ws.send(ClientToServer.pack(obj));
    }

    const user = users.get(playerID);

    return <div className="SaladBowl">
        <Lobby user={user} users={dummyUser} joinGame={joinGame}/>
    </div>
}

export default SaladBowl

export {SaladBowl}