package main

import (
	"encoding/json"
	"fmt"
	"log"
	"testing"
	"time"

	"git.sr.ht/~sircmpwn/go-bare"
	"github.com/gorilla/websocket"
	"github.com/stretchr/testify/assert"
	"github.com/veecue/saladbowl/game"
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
	// overwrite the one game with a new default config
	game.DefaultConfig.SuggestionTime = 5
	current = game.NewGame()

	go main()
	time.Sleep(time.Second)
	c, _, err := websocket.DefaultDialer.Dial("ws://localhost:8080/ws", nil)
	assert.NoError(t, err)
	go func() {
		for {
			tp, msg, err := c.ReadMessage()
			assert.NoError(t, err)
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
	c.WriteMessage(websocket.BinaryMessage, encode(protocol.ClientHello{
		Name: "Test",
	}))
	c.WriteMessage(websocket.BinaryMessage, encode(protocol.WordSuggestions{
		struct {
			Word string `bare:"word"`
		}{Word: "bla"},
	}))
	c.WriteMessage(websocket.BinaryMessage, encode(protocol.StartGame{}))
	c.WriteMessage(websocket.BinaryMessage, encode(protocol.WordSuggestions{
		struct {
			Word string `bare:"word"`
		}{Word: "bla"},
	}))
	time.Sleep(5 * time.Second)
	time.Sleep(3 * time.Second)
}
