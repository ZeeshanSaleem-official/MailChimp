package main

import (
	"database/sql"
	"fmt"
	"net/smtp"
	"sync"
	"time"
)

func emailWorker(id int, ch chan Recipient, wg *sync.WaitGroup, camp Campaign, db *sql.DB) {
	defer wg.Done()
	for recipient := range ch {
		smtpHost := "localhost"
		smtpPort := "1025"

		// formattedMsg := fmt.Sprintf("To: %s\r\nSubject: Test Email\r\n\r\n%s\r\n", recipient.Email, "Just Testing email")
		// msg := []byte(formattedMsg)
		dataForTemplate := EmailData{
			User: recipient,
			Camp: camp,
		}
		msg, err := executeEmail(dataForTemplate, camp.TemplateFile)
		if err != nil {
			fmt.Printf("Worker: %d Error executing template for %s: %v\n", id, recipient.Email, err)
			continue
		}

		// fmt.Printf("Worker: %d: Sending email to: %s \r\n", id, recipient.Email)
		err = smtp.SendMail(smtpHost+":"+smtpPort, nil, "zeeshan@gmail.com", []string{recipient.Email}, []byte(msg))
		if err != nil {
			fmt.Printf("Worker: %d Error during sending email for %s: %v\n", id, recipient.Email, err)
			UpdateEmailStatus(db, recipient.Email, "failed")
			continue
		}
		err = UpdateEmailStatus(db, recipient.Email, "sent")
		if err != nil {
			fmt.Printf("Worker: %d Error during updating email status for %s: %v\n", id, recipient.Email, err)
			continue
		}
		time.Sleep(50 * time.Millisecond)
		// fmt.Printf("Worker: %d: Sent email to: %s \r\n", id, recipient.Email)
	}
}
