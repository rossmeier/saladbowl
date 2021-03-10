import messages, {
    BowlUpdate, ClientHello,
    ClientToServer,
    Error,
    GameStatus,
    PlayerList,
    ServerHello,
    ServerToClient,
    StartGame, UpdatePlayerInfo,
    WordNew, WordSuccess, WordSuggestions
} from "./messages";
import {PlayerStatus, Team, UserType} from "../components/User";
import {UnionValue} from "./bare";
import {SaladBowlStatus} from "../components/SaladBowl";

interface Message<T> {
    type: new () => T,
    value: {}
}

interface BowlUpdateMessage extends Message<BowlUpdate> {
    value: { total: BigInt, current: BigInt }
}

type PlayerValue = {
    name: string,
    team: Team,
    id: BigInt,
    status: PlayerStatus,
    score: number
}


interface PlayerListMessage extends Message<PlayerList> {
    value: PlayerValue[]
}

interface ErrorMessage extends Message<Error> {
    value: { message: string }
}

enum GameStatusValue {
    LOBBY,
    SUGGESTION,
    PLAYING
}

interface GameStatusMessage extends Message<GameStatus> {
    value: GameStatusValue;
}

interface ServerHelloMessage extends Message<ServerHello> {
    value: { token: string, playerID: BigInt }
}

interface WordNewMessage extends Message<WordNew> {
    value: { word: string, timeLeft: BigInt, token: string }
}

type ServerToClientMessage = Message<BowlUpdate | ServerHelloMessage | PlayerListMessage>

function isMessage(message: any) {
    return 'type' in message && 'value' in message;
}

function isBowlUpdate(message: any): message is BowlUpdateMessage {
    return new message.type() instanceof BowlUpdate;
}

function isError(message: any): message is ErrorMessage {
    return new message.type() instanceof Error;
}

function isGameStatus(message: any): message is GameStatusMessage {
    return new message.type() instanceof GameStatus;
}

function isPlayerList(message: any): message is PlayerListMessage {
    return new message.type() instanceof PlayerList;
}

function isServerHello(message: any): message is ServerHelloMessage {
    return new message.type() instanceof ServerHello;
}

function isWordNew(message: any): message is WordNewMessage {
    return new message.type() instanceof WordNew;
}


type ClientToServerUnion = BowlUpdate | Error | GameStatus | ServerHello | PlayerList | WordNew;

function protoUserToUser(protoUser: PlayerValue): UserType {
    return {...protoUser, id: Number(protoUser.id), score: Number(protoUser.score),};
}

class Client {
    onMessage(arraybuffer: ArrayBuffer) {
        const uint8Array = new Uint8Array(arraybuffer);

        // if the unpack call does not fail, bare.js guarantees this returned types.
        const [msg, length] = ServerToClient.unpack(uint8Array) as [ServerToClientMessage, number];

        console.log(msg);

        if (isBowlUpdate(msg)) {
            const total = Number(msg.value.total);
            const current = Number(msg.value.current)
            this.onBowlUpdate({current, total});
        } else if (isError(msg)) {
            this.onError(msg.value);
        } else if (isGameStatus(msg)) {
            this.onGameStatus(msg.value as any); // TODO handle conversion properly
        } else if (isPlayerList(msg)) {
            const users = msg.value.map(user => protoUserToUser(user));
            this.onPlayerList(users);
        } else if (isServerHello(msg)) {
            const playerID = Number(msg.value.playerID);
            this.onServerHello({...msg.value, playerID});
        } else if (isWordNew(msg)) {
            const timeLeft = Number(msg.value.timeLeft)
            this.onWordNew({...msg.value, timeLeft});
        } else {
            console.warn('Unknown message: ' + msg);
        }
    }

    onBowlUpdate(value: { total: number, current: number }) {
        console.warn('received onBowlUpdate, but onBowlUpdate')
    }

    onError(value: { message: string }) {
        console.warn('received Error, but onError not assigned');
    }

    onGameStatus(value: SaladBowlStatus) {
        console.warn('received Error, but onGameStatus not assigned');
    }

    onPlayerList(value: UserType[]) {
        console.warn('received Error, but onPlayerListr not assigned');
    }


    onServerHello(value: { token: string, playerID: number }) {
        console.warn('received Error, but onServerHello not assigned');
    }

    onWordNew(value: { word: string, timeLeft: number, token: string }) {
        console.warn('received Error, but onWordNew not assigned');
    }

    clientHello(name: string, token?: string): Uint8Array {
        return ClientToServer.pack(new UnionValue(ClientHello, {name, token}));
    }

    startGame(): Uint8Array {
        return ClientToServer.pack(new UnionValue(StartGame));
    }

    updatePlayerInfo(name?: string, team?: Team): Uint8Array {
        return ClientToServer.pack(new UnionValue(UpdatePlayerInfo, {name, team}))
    }

    wordSuggestions(words: {word: string}[]): Uint8Array {
        return ClientToServer.pack(new UnionValue(WordSuggestions, words));
    }

    wordSuccess(token: string){
        return ClientToServer.pack(new UnionValue(WordSuccess, {token}));
    }

}

export default Client;
export {Client};