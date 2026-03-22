package main

import (
	"fmt"
	"net/smtp"
	"sync"
	"time"

	"github.com/ZeeshanSaleem-official/MailChimp/internal/config/types"
	"github.com/ZeeshanSaleem-official/MailChimp/internal/storage"
)

func emailWorker(id int, ch chan types.Recipient, wg *sync.WaitGroup, camp types.Campaign, store storage.Storage) {
	defer wg.Done()
	for recipient := range ch {
		smtpHost := "localhost"
		smtpPort := "1025"

		// formattedMsg := fmt.Sprintf("To: %s\r\nSubject: Test Email\r\n\r\n%s\r\n", recipient.Email, "Just Testing email")
		// msg := []byte(formattedMsg)
		dataForTemplate := types.EmailData{
			User: recipient,
			Camp: camp,
		}
		// executing the email using template dynamically
		msg, err := executeEmail(dataForTemplate, camp.TemplateFile)
		if err != nil {
			fmt.Printf("Worker: %d Error executing template for %s: %v\n", id, recipient.Email, err)
			continue
		}
		// fmt.Printf("Worker: %d: Sending email to: %s \r\n", id, recipient.Email)

		//sending the email
		err = smtp.SendMail(smtpHost+":"+smtpPort, nil, "zeeshan@gmail.com", []string{recipient.Email}, []byte(msg))
		// Update email Status
		if err != nil {
			fmt.Printf("Worker: %d Error during sending email for %s: %v\n", id, recipient.Email, err)
			store.UpdateEmailStatus(recipient.Email, "failed")
			continue
		}
		// Update the email Status function
		err = store.UpdateEmailStatus(recipient.Email, "sent")
		if err != nil {
			fmt.Printf("Worker: %d Error during updating email status for %s: %v\n", id, recipient.Email, err)
			continue
		}
		time.Sleep(50 * time.Millisecond)
		// fmt.Printf("Worker: %d: Sent email to: %s \r\n", id, recipient.Email)
	}
}
