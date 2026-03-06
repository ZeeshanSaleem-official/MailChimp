package main

import (
	"bytes"
	"fmt"
	"html/template"
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
	for i := 1; i <= workerCount; i++ {
		wg.Add(1)
		go emailWorker(i, recipientchannel, &wg)
	}
	wg.Wait()
}

func executeEmail(r Recipient) (string, error) {
	t, err := template.ParseFiles("email.tmpl")
	if err != nil {
		return "", err
	}
	var tpl bytes.Buffer
	err = t.Execute(&tpl, r)
	if err != nil {
		return "", err
	}
	return tpl.String(), nil
}
