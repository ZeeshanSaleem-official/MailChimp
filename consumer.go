package main

import "fmt"

func emailWorker(id int, ch chan Recipient) {
	for recipient := range ch {
		fmt.Println(id, recipient)
	}
}
