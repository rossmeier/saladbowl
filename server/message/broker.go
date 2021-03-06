package message

import (
	"errors"
	"sync"
)

type ToServerMsg struct {
	ClientID int
	reply    chan<- []byte
	Message  []byte
}

func (t *ToServerMsg) Reply(msg []byte) {
	t.reply <- msg
}

type Broker struct {
	toServer     chan ToServerMsg
	clientsLeave chan int
	clients      map[int]chan<- []byte
	nextClientID int
	mutex        sync.Mutex
}

func NewBroker() *Broker {
	return &Broker{
		toServer: make(chan ToServerMsg),
		clients:  make(map[int]chan<- []byte),
	}
}

type Client struct {
	id int
	b  *Broker
	c  chan []byte
}

func (c *Client) Send(msg []byte) {
	c.b.toServer <- ToServerMsg{
		ClientID: c.id,
		reply:    c.c,
		Message:  msg,
	}
}

func (c *Client) Destroy() {
	c.b.mutex.Lock()
	defer c.b.mutex.Unlock()
	delete(c.b.clients, c.id)
	close(c.c)
}

func (c *Client) Chan() <-chan []byte {
	return c.c
}

func (b *Broker) RegisterClient() *Client {
	toClient := make(chan []byte, 100)
	b.mutex.Lock()
	defer b.mutex.Unlock()

	c := &Client{
		id: b.nextClientID,
		c:  toClient,
		b:  b,
	}
	b.clients[b.nextClientID] = toClient
	b.nextClientID++
	return c
}

func (b *Broker) Broadcast(msg []byte) {
	for _, c := range b.clients {
		c <- msg
	}
}

func (b *Broker) SendToClient(id int, msg []byte) error {
	b.mutex.Lock()
	c, ok := b.clients[id]
	b.mutex.Unlock()
	if !ok {
		return errors.New("Client does not exist")
	}
	c <- msg
	return nil
}

func (b *Broker) ServerChan() <-chan ToServerMsg {
	return b.toServer
}

func (b *Broker) ClientsLeaveChan() <-chan int {
	return b.clientsLeave
}
