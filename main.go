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
	workerCount := 5
	go func() {
		for i := 0; i <= workerCount; i++ {
			emailWorker(i, recipientchannel)
		}
	}()

	time.Sleep(3 * time.Second)
}
