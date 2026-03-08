package main

import (
	"bytes"
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

func main() {
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
		fetchRecipientsFromDB(recipientchannel, db)
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
