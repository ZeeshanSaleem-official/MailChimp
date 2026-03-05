package main

import (
	"fmt"
	"log"
	"net/smtp"
	"sync"
	"time"
)

func emailWorker(id int, ch chan Recipient, wg *sync.WaitGroup) {
	defer wg.Done()
	for recipient := range ch {
		smtpHost := "localhost"
		smtpPort := "1025"

		formattedMsg := fmt.Sprintf("To: %s\r\nSubject: Test Email\r\n\r\n%s\r\n", recipient.Email, "Just Testing email")
		msg := []byte(formattedMsg)
		fmt.Printf("Worker: %d: Sending email to: %s \r\n", id, recipient.Email)
		err := smtp.SendMail(smtpHost+":"+smtpPort, nil, "zeeshan@gmail.com", []string{recipient.Email}, msg)
		if err != nil {
			log.Fatal(err)
		}
		time.Sleep(50 * time.Millisecond)
		fmt.Printf("Worker: %d: Sent email to: %s \r\n", id, recipient.Email)
	}
}
