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
	"github.com/rs/cors"
)

func main() {
	// for testing a mail
	cfg := config.MustLoad("local.yml")

	testMailer := mailer.NewMailer(
		cfg.SMTP.Host,
		cfg.SMTP.Port,
		cfg.SMTP.Username,
		cfg.SMTP.Password)
	err := testMailer.SendEmail("zeeshan@test.com", "System Online", "<h1>Tech Bird Mailer is ALIVE!</h1><p>The engine is working perfectly.</p>")
	if err != nil {
		fmt.Println("Engine Failed!!", err)
	} else {
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
	fmt.Printf("loaded Config for Environment %s\n", cfg.Env)

	//initialaize the db
	db, err := storage.InitDB(cfg.StoragePath)
	if err != nil {
		log.Fatalf("Fatal DB Error: %v", err)
	}
	defer db.Close()

	// Initialize  Clean Architecture Storage!
	store := postgres.NewPostgresStore(db)

	// Scheduling the campaign
	s := gocron.NewScheduler(time.Local)
	s.Every(1).Minute().Do(func() {
		fmt.Printf("\n [%v] Scheduled Task Triggered: Starting Campaign '%s'...\n", time.Now().Format("15:04:05"), myCampaign.Name)
		// runCampaign(1, store, db, myCampaign)
		// fmt.Println(" Campaign execution finished. Waiting for next schedule...")

		pendingCampaigns, err := store.GetPendingCampaigns()
		if err != nil {
			fmt.Println("Error fetching campaigns from DB:", err)
			return
		}
		if len(pendingCampaigns) == 0 {
			fmt.Println(" No pending campaigns found. Going back to sleep.")
			return
		}
		for _, camp := range pendingCampaigns {
			fmt.Printf(" Firing Campaign: '%s' for User ID: %d\n", camp.Name, camp.UserID)
			err := store.UpdateCampaignStatus(camp.ID, "processing")
			if err != nil {
				fmt.Printf("Error sending campaigns for user ID : %d\n to email recipient: %d", camp.UserID, err)
				continue
			}
			// run campaign
			runCampaign(camp.UserID, store, db, camp, cfg.SMTP.Host, cfg.SMTP.Port, cfg.SMTP.Username, cfg.SMTP.Password) // mark the campaign to completed
			store.UpdateCampaignStatus(camp.ID, "completed")
			fmt.Printf("✅ Campaign '%s' completed successfully!\n", camp.Name)
		}
	})
	fmt.Println(" Scheduler started! Waiting for the next scheduled run...")
	s.StartAsync()

	// Create the bridge function for the POST route
	triggerCallback := func(userID int, req types.Campaign) {
		runCampaign(userID, store, db, req, cfg.SMTP.Host, cfg.SMTP.Port, cfg.SMTP.Username, cfg.SMTP.Password)
	}
	// Create a dedicated router
	mux := http.NewServeMux()

	// Authorized  Handlers
	mux.HandleFunc("/api/recipients", handlers.AuthMiddleware(cfg.JWTSecret, handlers.GetRecipientHandler(store)))
	mux.HandleFunc("/api/campaign/run", handlers.AuthMiddleware(cfg.JWTSecret, handlers.RunCampaignHandler(triggerCallback)))
	mux.HandleFunc("/api/recipients/upload", handlers.AuthMiddleware(cfg.JWTSecret, handlers.UploadCSVHandler(store)))
	mux.HandleFunc("/api/campaign/send", handlers.AuthMiddleware(cfg.JWTSecret, handlers.SendCampaignHandler(store, testMailer)))
	mux.HandleFunc("/api/recipients/resend", handlers.AuthMiddleware(cfg.JWTSecret, handlers.ResendEmailHandler(store, testMailer)))
	mux.HandleFunc("/api/recipients/delete", handlers.AuthMiddleware(cfg.JWTSecret, handlers.DeleteRecipient(store)))
	// Landing Handlers
	mux.HandleFunc("/api/signup", handlers.SignUpHandlers(store))
	mux.HandleFunc("/api/login", handlers.LoginHandlers(store, cfg.JWTSecret))
	mux.HandleFunc("/api/logout", handlers.LogoutHandlers())
	// logs handlers
	mux.HandleFunc("/api/logs", handlers.AuthMiddleware(cfg.JWTSecret, handlers.GetLogsHandler(store)))
	
	// Admin handlers
	mux.HandleFunc("/api/admin/users", handlers.AdminMiddleware(cfg.JWTSecret, handlers.GetAllUsersHandler(store)))
	mux.HandleFunc("/api/admin/users/status", handlers.AdminMiddleware(cfg.JWTSecret, handlers.UpdateUserStatusHandler(store)))
	mux.HandleFunc("/api/admin/stats", handlers.AdminMiddleware(cfg.JWTSecret, handlers.GetGlobalStatsHandler(store)))

	fmt.Println(" Web Server is running on http://localhost:8080")
	fmt.Println(" Scheduler is running in the background...")
	// Configure CORS to allow  React frontend (Fort Knox settings)
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		AllowCredentials: true,
	})
	// Wrap  mux with the CORS handler
	handler := c.Handler(mux)
	// Start the server using the wrapped handler
	log.Fatal(http.ListenAndServe(":8080", handler))
}

// Run campaign dynamically
func runCampaign(userID int, store storage.Storage, db *sql.DB, camp types.Campaign, smtpHost string, smtpPort int, smtpUser string, smtpPass string) {
	cfg := config.MustLoad("local.yml")

	recipientchannel := make(chan types.Recipient)
	go func() {
		fetchRecipientsFromDB(userID, recipientchannel, db, camp.TargetSegment)
	}()

	workerCount := 5
	var wg sync.WaitGroup
	for i := 1; i <= workerCount; i++ {
		wg.Add(1)
		go emailWorker(i, userID, recipientchannel, &wg, camp, store, smtpHost, smtpPort, cfg.SMTP.Username, cfg.SMTP.Password)
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
