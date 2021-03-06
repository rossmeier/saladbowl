package main

import (
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"testing"
	"time"

	"git.sr.ht/~sircmpwn/go-bare"
	"github.com/gorilla/websocket"
	"github.com/stretchr/testify/assert"
	"github.com/veecue/saladbowl/protocol"
)

func encode(msg protocol.ClientToServer) []byte {
	ret, err := bare.Marshal(&msg)
	if err != nil {
		panic(err)
	}
	return ret
}

func TestAll(t *testing.T) {
	go main()
	time.Sleep(time.Second)
	c, _, err := websocket.DefaultDialer.Dial("ws://localhost:8080/ws", nil)
	assert.NoError(t, err)
	msg := encode(protocol.ClientHello{
		Name: "Test",
	})
	fmt.Println(hex.EncodeToString(msg))
	go func() {
		for {
			tp, msg, err := c.ReadMessage()
			assert.NoError(t, err)
			log.Printf("%x", msg)
			switch tp {
			case websocket.BinaryMessage:
				var content protocol.ServerToClient
				err := bare.Unmarshal(msg, &content)
				assert.NoError(t, err)
				s, _ := json.MarshalIndent(content, "", "  ")
				fmt.Println(string(s))
			default:
				log.Println("Unknown reply")
			}
		}
	}()
	c.WriteMessage(websocket.BinaryMessage, msg)
	time.Sleep(3 * time.Second)
}
