package game

import (
	"errors"
	"fmt"
	"log"

	"git.sr.ht/~sircmpwn/go-bare"
	"github.com/google/uuid"
	"github.com/veecue/saladbowl/message"
	"github.com/veecue/saladbowl/protocol"
)

func Encode(msg protocol.ServerToClient) []byte {
	ret, err := bare.Marshal(msg)
	if err != nil {
		panic(err)
	}
	return ret
}

type Player struct {
	*protocol.Player
	token      string
	connection int
}

// Game holds the state of a game. Players, board, etc
type Game struct {
	Broker      *message.Broker
	bowlFull    []string
	bowlCurrent []string
	players     []*Player
	state       protocol.GameStatus
}

func NewGame() *Game {
	return &Game{
		Broker:      message.NewBroker(),
		bowlFull:    make([]string, 0),
		bowlCurrent: make([]string, 0),
		state:       protocol.Lobby,
	}
}

func (g *Game) RunHandler() {
	for {
		select {
		case msg := <-g.Broker.ServerChan():
			err := g.HandleMessage(msg)
			if err != nil {
				log.Printf("Error handling client message: %v", err)
			}
		case connID := <-g.Broker.ClientsLeaveChan():
			for _, p := range g.players {
				if p.connection == connID {
					p.connection = -1
					p.Status = protocol.Disconnected
					g.BroadcastPlayerList()
					break
				}
			}
		}
	}
}

func (g *Game) GetPlayerByClientID(id int) *Player {
	for _, p := range g.players {
		if p.connection == id {
			return p
		}
	}
	return nil
}

func (g *Game) BroadcastPlayerList() {
	players := make([]protocol.Player, len(g.players))
	for i, p := range g.players {
		players[i] = *p.Player
	}
	g.Broker.Broadcast(Encode(protocol.PlayerList(players)))
}

func (g *Game) HandleClientHello(msg protocol.ClientHello, orig message.ToServerMsg) error {
	if g.GetPlayerByClientID(orig.ClientID) != nil {
		return errors.New("Client already known")
	}
	if msg.Token != nil {
		for _, p := range g.players {
			if p.token == *msg.Token {
				p.connection = orig.ClientID
				p.Status = protocol.Passive
				orig.Reply(Encode(protocol.ServerHello{
					Token: p.token,
				}))
				g.BroadcastPlayerList()
				return nil
			}
		}
	}
	id := len(g.players)
	token, err := uuid.NewRandom()
	if err != nil {
		return fmt.Errorf("Error generating token: %w", err)
	}
	g.players = append(g.players, &Player{
		Player: &protocol.Player{
			Name:   msg.Name,
			Id:     id,
			Score:  0,
			Status: protocol.Passive,
		},
		connection: orig.ClientID,
		token:      token.String(),
	})
	orig.Reply(Encode(protocol.ServerHello{
		Token: token.String(),
	}))
	g.BroadcastPlayerList()
	return nil
}

func (g *Game) HandleMessage(msg message.ToServerMsg) error {
	var content protocol.ClientToServer
	err := bare.Unmarshal(msg.Message, &content)
	if err != nil {
		return err
	}
	switch content.(type) {
	case protocol.ClientHello:
		return g.HandleClientHello(content.(protocol.ClientHello), msg)
	case protocol.WordSuccess:

	case protocol.WordSuggestions:
	}
	return nil
}
