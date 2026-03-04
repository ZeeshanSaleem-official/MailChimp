package main

import (
	"fmt"
	"time"
)

type Recipient struct {
	Name  string
	Email string
}

func main() {
	fmt.Println("Email Dispatcher using GoLang Backend!!!")
	recipientchannel := make(chan Recipient)
	go func() {
		loadRecipients("./mail.csv", recipientchannel)
	}()
	go emailWorker(1, recipientchannel)

	time.Sleep(3 * time.Second)
}
