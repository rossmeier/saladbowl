package main

import (
	"embed"
	"net/http"
	"path"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/veecue/saladbowl/game"
)

var upgrader = websocket.Upgrader{}
var current = game.NewGame()

//go:embed public/*
var publicFiles embed.FS

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

type prefixedFS struct {
	inner  http.FileSystem
	prefix string
}

func (p *prefixedFS) Open(name string) (http.File, error) {
	return p.inner.Open(path.Join(p.prefix, name))
}

func main() {
	// run main game handler in the background
	go current.RunHandler()

	r := gin.Default()
	r.GET("/ws", wsHandler)
	r.GET("/", indexHandler)
	r.StaticFS("/public/", &prefixedFS{http.FS(publicFiles), "public"})
	r.Run()
}
