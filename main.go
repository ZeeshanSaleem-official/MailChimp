package main

import (
	"bytes"
	"database/sql"
	"fmt"
	"html/template"
	"log"
	"sync"

	"github.com/ZeeshanSaleem-official/MailChimp/internal/config"
	"github.com/ZeeshanSaleem-official/MailChimp/internal/storage"
)

type Recipient struct {
	Name  string
	Email string
}
type EmailData struct {
	User Recipient
	Camp Campaign
}
type Campaign struct {
	Name          string
	Subject       string
	TemplateFile  string
	TargetSegment string
}

func main() {
	myCampaign := Campaign{
		Name:          "Spring Sale 2026",
		Subject:       "Exclusive 50 percent off for Premium Members!",
		TemplateFile:  "promo.tmpl",
		TargetSegment: "premium",
	}
	fmt.Println("Email Dispatcher using GoLang Backend!!!")
	cfg := config.MustLoad("local.yml")
	fmt.Printf("loaded Config for Environment %s\n", cfg.Env)
	db, err := storage.InitDB(cfg.StoragePath)
	if err != nil {
		log.Fatalf("Fatal DB Error: %v", err)
	}
	defer db.Close()
	recipientchannel := make(chan Recipient)
	go func() {
		importCSVtoDB("./mail.csv", db)
		fetchRecipientsFromDB(recipientchannel, db, "premium")
	}()
	workerCount := 5
	var wg sync.WaitGroup
	for i := 1; i <= workerCount; i++ {
		wg.Add(1)
		go emailWorker(i, recipientchannel, &wg, myCampaign, db)
	}
	wg.Wait()
}

func executeEmail(r EmailData, templateName string) (string, error) {

	t, err := template.ParseFiles(templateName)
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
func UpdateEmailStatus(db *sql.DB, email string, status string) error {
	query := `UPDATE recipients SET status=$1 WHERE email=$2`
	_, err := db.Exec(query, status, email)
	if err != nil {
		return err
	}
	return nil
}
