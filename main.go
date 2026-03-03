package main

import "fmt"

type Recipient struct {
	Name  string
	Email string
}

func main() {
	fmt.Println("Email Dispatcher using GoLang Backend!!!")
	recipientchannel := make(chan Recipient)
	loadRecipients("./mail.csv", recipientchannel)

}
