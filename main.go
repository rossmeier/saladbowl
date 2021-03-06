package main

import (
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/veecue/saladbowl/game"
)

var upgrader = websocket.Upgrader{}
var current = game.NewGame()

func wsHandler(c *gin.Context) {
	if !c.IsWebsocket() {
		panic("Not a websocket")
	}
	con, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		panic(err)
	}
	defer con.Close()
	client := current.Broker.RegisterClient()
	go func() {
		for msg := range client.Chan() {
			con.WriteMessage(websocket.BinaryMessage, msg)
		}
	}()
	for {
		mt, message, err := con.ReadMessage()
		if websocket.IsCloseError(err, 1001) {
			client.Destroy()
			return
		}
		if err != nil {
			panic(err)
		}
		switch mt {
		case websocket.PingMessage:
			con.WriteMessage(websocket.PongMessage, message)
		case websocket.BinaryMessage:
			client.Send(message)
		}
	}
}

func indexHandler(c *gin.Context) {

}

func main() {
	// run main game handler in the background
	go current.RunHandler()

	r := gin.Default()
	r.GET("/ws", wsHandler)
	r.GET("/", indexHandler)
	r.Static("/public", "public")
	r.Run()
}
