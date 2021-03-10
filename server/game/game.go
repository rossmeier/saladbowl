package game

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math/rand"
	"time"

	"git.sr.ht/~sircmpwn/go-bare"
	"github.com/google/uuid"
	"github.com/veecue/saladbowl/message"
	"github.com/veecue/saladbowl/protocol"
)

var (
	ErrNotJoined = errors.New("Join the game first")
)

var DefaultConfig protocol.GameConfig = protocol.GameConfig{
	MaxWords:       15,
	Rounds:         3,
	SuggestionTime: 180,
}

func genToken() string {
	tok, err := uuid.NewRandom()
	if err != nil {
		panic(err)
	}
	return tok.String()
}

func encode(msg protocol.ServerToClient) []byte {
	ret, err := bare.Marshal(&msg)
	if err != nil {
		panic(err)
	}
	return ret
}

type player struct {
	*protocol.Player
	token      string
	connection int
	words      []string
}

// Game holds the state of a game. Players, board, etc
type Game struct {
	Broker        *message.Broker
	bowlFull      []string
	bowlCurrent   []string
	players       []*player
	state         protocol.GameStatus
	config        protocol.GameConfig
	timer         chan func()
	playerQueues  map[protocol.Team][]*player
	currentPlayer *player
	lastWordToken string
}

func NewGame() *Game {
	return &Game{
		Broker:       message.NewBroker(),
		state:        protocol.Lobby,
		config:       DefaultConfig,
		timer:        make(chan func()),
		playerQueues: make(map[protocol.Team][]*player),
	}
}

func (g *Game) setTimer(d time.Duration, fn func()) {
	time.AfterFunc(d, func() {
		g.timer <- fn
	})
}

func (g *Game) RunHandler() {
	for {
		select {
		case msg := <-g.Broker.ServerChan():
			err := g.handleMessage(msg)
			if err != nil {
				log.Printf("Error handling client message: %v", err)
				msg.Reply(encode(protocol.Error{
					Message: err.Error(),
				}))
			}
		case connID := <-g.Broker.ClientsLeaveChan():
			for _, p := range g.players {
				if p.connection == connID {
					p.connection = -1
					p.Status = protocol.Disconnected
					g.broadcastPlayerList()
					break
				}
			}
		case fn := <-g.timer:
			fn()
		}
	}
}

func (g *Game) getPlayerByClientID(id int) *player {
	for _, p := range g.players {
		if p.connection == id {
			return p
		}
	}
	return nil
}

func (g *Game) broadcastPlayerList() {
	players := make([]protocol.Player, len(g.players))
	for i, p := range g.players {
		players[i] = *p.Player
	}
	g.Broker.Broadcast(encode(protocol.PlayerList(players)))
}

func (g *Game) handleClientHello(msg *protocol.ClientHello, orig message.ToServerMsg) error {
	if g.getPlayerByClientID(orig.ClientID) != nil {
		return errors.New("Client already known")
	}
	if msg.Token != nil {
		for _, p := range g.players {
			if p.token == *msg.Token {
				p.connection = orig.ClientID
				p.Status = protocol.Passive
				orig.Reply(encode(protocol.ServerHello{
					Token:    p.token,
					PlayerID: p.Id,
				}))
				g.broadcastPlayerList()
				return nil
			}
		}
	}
	id := len(g.players)
	token := genToken()
	team := protocol.Red
	if rand.Intn(2) == 0 {
		team = protocol.Blue
	}
	g.players = append(g.players, &player{
		Player: &protocol.Player{
			Name:   msg.Name,
			Id:     id,
			Score:  0,
			Status: protocol.Passive,
			Team:   team,
		},
		connection: orig.ClientID,
		token:      token,
	})
	orig.Reply(encode(protocol.ServerHello{
		Token:    token,
		PlayerID: id,
	}))
	g.broadcastPlayerList()
	return nil
}

func (g *Game) enterSuggestions() {
	g.state = protocol.Suggestions
	g.setTimer(time.Duration(g.config.SuggestionTime)*time.Second, g.enterPlaying)
}

func (g *Game) enterPlaying() {
	g.state = protocol.Playing
	g.bowlFull = g.bowlFull[:0]
	for _, p := range g.players {
		g.bowlFull = append(g.bowlFull, p.words...)
	}
	g.startRound()
}

func (g *Game) broadcastBowlState() {
	g.Broker.Broadcast(encode(protocol.BowlUpdate{
		Current: len(g.bowlCurrent),
		Total:   len(g.bowlFull),
	}))
}

func (g *Game) nextWord() {
	if len(g.bowlCurrent) == 0 {
		return
		// TODO cancel the timeout early
	}

	word := g.bowlCurrent[0]
	g.bowlCurrent = g.bowlCurrent[1:]
	g.broadcastBowlState()

	g.lastWordToken = genToken()
	g.Broker.SendToClient(g.currentPlayer.connection, encode(protocol.WordNew{
		Token:    g.lastWordToken,
		Word:     word,
		TimeLeft: 30, // TODO
	}))
}

func (g *Game) nextPlayer() {
	if len(g.bowlCurrent) == 0 {
		g.startRound()
	}

	// decide the team of the next player
	team := protocol.Red
	if g.currentPlayer != nil && g.currentPlayer.Team == protocol.Red {
		team = protocol.Blue
	}

	// if no players are in queue for the desired team, refill the queues
	if len(g.playerQueues[team]) == 0 {
		for _, p := range g.players {
			if p.Team == team {
				g.playerQueues[team] = append(g.playerQueues[team], p)
			}
		}
	}

	if g.currentPlayer != nil {
		g.currentPlayer.Status = protocol.Passive
	}

	g.currentPlayer = g.playerQueues[team][0]
	g.playerQueues[team] = g.playerQueues[team][1:]

	g.setTimer(30*time.Second, g.nextPlayer)
	g.currentPlayer.Status = protocol.Active
	g.broadcastPlayerList()
	g.nextWord()
}

func (g *Game) startRound() {
	g.bowlCurrent = g.bowlCurrent[:0]
	g.bowlCurrent = append(g.bowlCurrent, g.bowlFull...)
	rand.Shuffle(len(g.bowlCurrent), func(i int, j int) {
		g.bowlCurrent[i], g.bowlCurrent[j] = g.bowlCurrent[j], g.bowlCurrent[i]
	})
	g.broadcastBowlState()
	g.nextPlayer()
}

func (g *Game) handleWordSuggestions(msg *protocol.WordSuggestions, orig message.ToServerMsg) error {
	if g.state != protocol.Suggestions {
		return errors.New("Word suggestions can only be submitted during suggestion phase")
	}
	p := g.getPlayerByClientID(orig.ClientID)
	if p == nil {
		return ErrNotJoined
	}
	if len(*msg) > int(g.config.MaxWords) {
		return errors.New("Too many words in the suggestion")
	}
	p.words = p.words[:0]
	for _, sug := range *msg {
		p.words = append(p.words, sug.Word)
	}
	bowlSize := 0
	for _, p := range g.players {
		bowlSize += len(p.words)
	}
	g.Broker.Broadcast(encode(protocol.BowlUpdate{
		Current: bowlSize,
		Total:   bowlSize,
	}))
	return nil
}

func (g *Game) handleUpdatePlayerInfo(msg *protocol.UpdatePlayerInfo, orig message.ToServerMsg) error {
	if g.state != protocol.Lobby {
		return errors.New("Player info can be only changed in lobby")
	}
	p := g.getPlayerByClientID(orig.ClientID)
	if p == nil {
		return ErrNotJoined
	}
	if msg.Name != nil {
		p.Name = *msg.Name
	}
	if msg.Team != nil {
		p.Team = *msg.Team
	}
	g.broadcastPlayerList()
	return nil
}

func (g *Game) handleWordSuccess(msg *protocol.WordSuccess, orig message.ToServerMsg) error {
	if g.lastWordToken == "" || msg.Token != g.lastWordToken {
		return errors.New("Invalid token")
	}
	g.currentPlayer.Score++
	g.broadcastPlayerList()
	g.nextWord()
	return nil
}

func (g *Game) handleStartGame(orig message.ToServerMsg) error {
	if g.getPlayerByClientID(orig.ClientID) == nil {
		return ErrNotJoined
	}
	if g.state != protocol.Lobby {
		return errors.New("Can only start game from lobby phase")
	}
	playersPerTeam := make(map[protocol.Team]int)
	for _, p := range g.players {
		playersPerTeam[p.Team]++
	}
	for _, team := range []protocol.Team{protocol.Blue, protocol.Red} {
		if playersPerTeam[team] < 1 {
			return fmt.Errorf("Too few players in team %s", team.String())
		}
	}
	g.enterSuggestions()
	return nil
}

func (g *Game) handleMessage(msg message.ToServerMsg) error {
	var content protocol.ClientToServer
	err := bare.Unmarshal(msg.Message, &content)
	if err != nil {
		return err
	}

	s, _ := json.MarshalIndent(content, "", "  ")
	fmt.Println(string(s))

	switch content.(type) {
	case *protocol.ClientHello:
		return g.handleClientHello(content.(*protocol.ClientHello), msg)
	case *protocol.StartGame:
		return g.handleStartGame(msg)
	case *protocol.UpdatePlayerInfo:
		return g.handleUpdatePlayerInfo(content.(*protocol.UpdatePlayerInfo), msg)
	case *protocol.WordSuccess:
		return g.handleWordSuccess(content.(*protocol.WordSuccess), msg)
	case *protocol.WordSuggestions:
		return g.handleWordSuggestions(content.(*protocol.WordSuggestions), msg)
	}
	return errors.New("Unknown message")
}
