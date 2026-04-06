package main

import (
	"bytes"
	"database/sql"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/ZeeshanSaleem-official/MailChimp/http/handlers"
	"github.com/ZeeshanSaleem-official/MailChimp/internal/config"
	"github.com/ZeeshanSaleem-official/MailChimp/internal/config/types"
	"github.com/ZeeshanSaleem-official/MailChimp/internal/mailer"
	"github.com/ZeeshanSaleem-official/MailChimp/internal/storage"
	"github.com/ZeeshanSaleem-official/MailChimp/internal/storage/postgres"
	"github.com/go-co-op/gocron"
)

func main() {
	// for testing a mail
	testMailer:=mailer.NewMailer("sandbox.smtp.mailtrap.io",2525,"6b0b665ff82a07","d2b35bbb4dfb46")
	err:=testMailer.SendEmail("zeeshan@test.com", "System Online", "<h1>Tech Bird Mailer is ALIVE!</h1><p>The engine is working perfectly.</p>")
	if err!=nil {
		fmt.Println("Engine Failed!!",err)
	}else{
		fmt.Println("Engine fired Mail successfully! Check Maitrap")
	}
	// custom Campaign
	myCampaign := types.Campaign{
		Name:          "Spring Sale 2026",
		Subject:       "Exclusive 50 percent off for Premium Members!",
		TemplateFile:  "promo.tmpl",
		TargetSegment: "premium",
	}

	fmt.Println("Email Dispatcher using GoLang Backend!!!")
	cfg := config.MustLoad("local.yml")
	fmt.Printf("loaded Config for Environment %s\n", cfg.Env)

	//initialaize the db
	db, err := storage.InitDB(cfg.StoragePath)
	if err != nil {
		log.Fatalf("Fatal DB Error: %v", err)
	}
	defer db.Close()

	// Initialize  Clean Architecture Storage!
	store := postgres.NewPostgresStore(db)

	// CSV to DB
	importCSVtoDB("./mail.csv", db)

	// Scheduling the campaign
	s := gocron.NewScheduler(time.Local)
	s.Every(1).Minute().Do(func() {
		fmt.Printf("\n [%v] Scheduled Task Triggered: Starting Campaign '%s'...\n", time.Now().Format("15:04:05"), myCampaign.Name)
		runCampaign(store, db, myCampaign)
		fmt.Println(" Campaign execution finished. Waiting for next schedule...")
	})
	fmt.Println(" Scheduler started! Waiting for the next scheduled run...")
	s.StartAsync()

	// Create the bridge function for the POST route
	triggerCallback := func(req types.Campaign) {
		runCampaign(store, db, req)
	}

	// Register the Clean Handlers
	http.HandleFunc("/api/recipients", handlers.GetRecipientHandler(store))
	http.HandleFunc("/api/campaign/run", handlers.RunCampaignHandler(triggerCallback))
	http.HandleFunc("/api/recipients/upload", handlers.UploadCSVHandler(store))

	fmt.Println(" Web Server is running on http://localhost:8080")
	fmt.Println(" Scheduler is running in the background...")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

// Run campaign dynamically
func runCampaign(store storage.Storage, db *sql.DB, camp types.Campaign) {
	recipientchannel := make(chan types.Recipient)
	go func() {
		fetchRecipientsFromDB(recipientchannel, db, camp.TargetSegment)
	}()

	workerCount := 5
	var wg sync.WaitGroup
	for i := 1; i <= workerCount; i++ {
		wg.Add(1)
		go emailWorker(i, recipientchannel, &wg, camp, store)
	}
	wg.Wait()
}

// Execute email template
func executeEmail(r types.EmailData, templateName string) (string, error) {
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
