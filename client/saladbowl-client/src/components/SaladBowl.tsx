import Lobby from "./Lobby";
import {PlayerStatus, Team, UserType} from "./User";
import {useEffect, useState} from "react";
import {ClientHello, ClientToServer} from "../protocol/messages";
import {UnionValue} from "../protocol/bare";
import Client from "../protocol/MessageHandler";
import useWebsocket from "../hooks/WebsocketHook";


const dummy0 = {name: 'User1', id: 0, team: Team.RED, status: PlayerStatus.ACTIVE, score: 27};
const dummyUser = new Map<number, UserType>([
    [0, dummy0],
    [1, {name: 'User1', id: 1, team: Team.RED, status: PlayerStatus.ACTIVE, score: 27}],
    [2, {name: 'User2', id: 2, team: Team.RED, status: PlayerStatus.ACTIVE, score: 27}],
    [3, {name: 'User3', id: 3, team: Team.RED, status: PlayerStatus.ACTIVE, score: 27}],
    [4, {name: 'User4', id: 4, team: Team.RED, status: PlayerStatus.ACTIVE, score: 27}],
    [5, {name: 'User5', id: 5, team: Team.RED, status: PlayerStatus.ACTIVE, score: 27}]
]);

const host = window.location.hostname

function SaladBowl() {

    const [playerID, setPlayerID] = useState(NaN);
    const [token, setToken] = useState(sessionStorage.getItem('user-token'));
    const [users, setUsers] = useState(new Map<number, UserType>());
    const [messageHandler, setMessageHandler] = useState(new Client());

    const ws = useWebsocket({
        socketUrl: `ws://${host}:8080/ws${token ? '/' : ''}${token}`
    });

    useEffect(() => {
        if (ws.data){
            messageHandler.onMessage(ws.data);
        }
    }, [ws.data]);

    useEffect(() => {
        if (!ws.readyState){
            console.log('socket disconnected');
        }
    }, [ws.readyState]);

    useEffect(() => {
        if (token) {
            sessionStorage.setItem('user-token', token);
        }
    }, [token])

    useEffect(() => {
        messageHandler.onServerHello = value => {
            setToken(value.token);
            setPlayerID(value.playerID);
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