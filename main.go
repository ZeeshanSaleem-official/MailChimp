package main

import (
	"fmt"
	"sync"
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
	var wg sync.WaitGroup
	for i := 0; i <= workerCount; i++ {
		wg.Add(1)
		go emailWorker(i, recipientchannel, &wg)
	}
	wg.Wait()
}
