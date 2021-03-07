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

    const [readyState, setReadyState] = useState(false);


    useEffect(() => {
        const ws = new WebSocket(socketUrl);
        ws.binaryType = 'arraybuffer';

        ws.onopen = () => {
            console.log('Connected to socket');
            clearTimeout(timeout);
            setReadyState(true);

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
            setReadyState(false);

            switch (ev.code) {
                case 1005:
                case 1000:
                    console.log('closing connection');
                    break;
                default:
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

    return {send, data, readyState};

}

export default useWebsocket;