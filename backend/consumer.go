package main

import (
	"fmt"
	"net/smtp"
	"sync"
	"time"

	"github.com/ZeeshanSaleem-official/MailChimp/internal/config/types"
	"github.com/ZeeshanSaleem-official/MailChimp/internal/storage"
)

func emailWorker(workerId int, userID int, ch chan types.Recipient, wg *sync.WaitGroup, camp types.Campaign, store storage.Storage, smtpHost string, smtpPort int, smtpUser string, smtpPass string) {
	defer wg.Done()
	for recipient := range ch {
		if GlobalEngineStatus.Load().(string) != "running" {
			fmt.Printf("Worker: %d Engine paused/stopped. Halting mid-batch processing.\n", workerId)
			break
		}
		// smtpHost := "localhost"
		// smtpPort := "1025"

		// formattedMsg := fmt.Sprintf("To: %s\r\nSubject: Test Email\r\n\r\n%s\r\n", recipient.Email, "Just Testing email")
		// msg := []byte(formattedMsg)
		dataForTemplate := types.EmailData{
			User: recipient,
			Camp: camp,
		}
		// executing the email using template dynamically
		body, err := executeEmail(dataForTemplate, camp.TemplateFile)
		if err != nil {
			fmt.Printf("Worker: %d Error executing template for %s: %v\n", workerId, recipient.Email, err)
			continue
		}
		// fmt.Printf("Worker: %d: Sending email to: %s \r\n", id, recipient.Email)

		// Stich the required headers
		headers := fmt.Sprintf("To: %s\r\nSubject: %s\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n", recipient.Email, camp.Subject)
		//  Combine them
		finalmessage := headers + body

		//sending the email
		// Create the address string by formatting the string and integer together
		addr := fmt.Sprintf("%s:%d", smtpHost, smtpPort)

		//  Create the Authentication object!
		auth := smtp.PlainAuth("", smtpUser, smtpPass, smtpHost)

		//  Pass 'auth', and use smtpUser as the sender
		err = smtp.SendMail(addr, auth, smtpUser, []string{recipient.Email}, []byte(finalmessage))
		// Use the new addr variable
		// err = smtp.SendMail(addr, nil, "zeeshan@gmail.com", []string{recipient.Email}, []byte(finalmessage))
		// Update email Status
		if err != nil {
			fmt.Printf("Worker: %d Error during sending email for %s: %v\n", workerId, recipient.Email, err)
			store.UpdateEmailStatus(userID, recipient.Email, "failed")
			continue
		}
		// Update the email Status function
		err = store.UpdateEmailStatus(userID, recipient.Email, "sent")
		if err != nil {
			fmt.Printf("Worker: %d Error during updating email status for %s: %v\n", workerId, recipient.Email, err)
			continue
		}
		time.Sleep(50 * time.Millisecond)
		// fmt.Printf("Worker: %d: Sent email to: %s \r\n", id, recipient.Email)
	}
}
