import {
    BowlUpdate,
    GameStatus,
    PlayerList,
    ServerHello,
    WordNew,
    Error,
    ServerToClient
} from "./messages";

enum PlayerStatusValue {
    ACTIVE,
    PASSIVE,
    DISCONNECTED
}

enum TeamValue {
    RED,
    BLUE,
}

type PlayerValue = {
    name: string,
    team: TeamValue,
    id: number,
    status: PlayerStatusValue,
    score: number
}

enum GameStatusValue {
    LOBBY,
    SUGGESTION,
    PLAYING
}

type ServerHelloValue = { token: string, playerID: number };
type BowlUpdateValue = { total: number, current: number };
type PlayerListValue = PlayerValue[];
type WordNewValue = { word: string, timeLeft: number, token: string };
type ErrorValue = { message: string };

type ClientToServerUnion = BowlUpdate | Error | GameStatus | ServerHello | PlayerList | WordNew;

class Client {
    onMessage(arraybuffer: ArrayBuffer) {
        const uint8Array = new Uint8Array(arraybuffer);

        const [message, length] = ServerToClient.unpack(uint8Array);

        console.log(message);

        const {type, value} = message;
        if (!type) {
            console.log('Message type is not defined');
            return;
        }

        if (!value) {
            console.log('Message value is not defined');
            return;
        }

        const clazz: ClientToServerUnion = new type();

        if (clazz instanceof BowlUpdate) {
            this.onBowlUpdate(value);
        } else if (clazz instanceof Error) {
            this.onError(value);
        } else if (clazz instanceof GameStatus) {
            this.onGameStatus(value)
        } else if (clazz instanceof PlayerList) {
            this.onPlayerList(value);
        } else if (clazz instanceof ServerHello) {
            this.onServerHello(value);
        } else if (clazz instanceof WordNew) {
            this.onWordNew(value);
        } else {
            console.warn('Unknown class: ' + type);
        }
    }

    onBowlUpdate(value: BowlUpdateValue) {

    }

    onError(value: ErrorValue) {

    }

    onGameStatus(value: GameStatusValue) {

    }

    onPlayerList(value: PlayerListValue) {

    }


    onServerHello(value: ServerHelloValue) {

    }

    onWordNew(value: WordNewValue) {

    }
}

export default Client;
export {Client};