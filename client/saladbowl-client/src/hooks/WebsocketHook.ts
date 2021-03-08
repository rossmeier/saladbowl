import {useEffect, useReducer, useState} from "react";

type MessageData = undefined | ArrayBuffer;
type SendData = string | ArrayBuffer | Blob | ArrayBufferView;

function useWebsocket({
                          socketUrl,
                          retry: defaultRetry = 3,
                          retryInterval = 1500
                      }: { socketUrl: string, retry?: number, retryInterval?: number }
) {
    const [data, setData]: [MessageData, ((value: (((prevState: MessageData) => MessageData) | MessageData)) => void)] = useState();

    const [send, setSend] = useState(() => (data: SendData) => undefined);

    const [retry, setRetry] = useState(defaultRetry);

    function reducer(state: { retrying: boolean, ready: boolean }, action: 'retry' | 'connect' | 'close') {
        switch (action) {
            case "retry":
                return {retrying: true, ready: false};
            case "connect":
                return {retrying: false, ready: true};
            case "close":
                return {retrying: false, ready: false};
            default:
                throw Error('Unknown action: ' + action)
        }
    }

    const [state, dispatcher] = useReducer(reducer, {retrying: false, ready: false});


    useEffect(() => {
        const ws = new WebSocket(socketUrl);
        ws.binaryType = 'arraybuffer';

        ws.onopen = () => {
            console.log(`Connected to socket. (${ws.url})`);
            clearTimeout(timeout);
            dispatcher('connect');

            setSend(() => {
                return (data: SendData) => {
                    ws.send(data);
                    return undefined;
                };
            });
        }

        ws.onmessage = ev => {
            const msg = ev.data;
            setData(msg);
        }

        let timeout: NodeJS.Timeout;
        ws.onclose = ev => {
            switch (ev.code) {
                case 1005:
                case 1000:
                    dispatcher('close');
                    console.log('closing connection');
                    break;
                default:
                    dispatcher('retry');
                    // retry
                    if (retry > 0) {
                        console.log(`lost connection, trying to reconnect... (remaining: ${retry})`);
                        timeout = setTimeout(() => {
                            setRetry(retry => retry - 1);
                        }, retryInterval);
                    } else {
                        console.log('closing connection');
                    }
            }
        };

        return () => {
            ws.close();
            clearTimeout(timeout);
        }
    }, [retry]);

    return {send, data, ready: state.ready, retrying: state.retrying};

}

export default useWebsocket;