package main

import (
	"bytes"
	"database/sql"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"sync"
	"sync/atomic"
	"time"

	"github.com/ZeeshanSaleem-official/MailChimp/http/handlers"
	"github.com/ZeeshanSaleem-official/MailChimp/internal/config"
	"github.com/ZeeshanSaleem-official/MailChimp/internal/config/types"
	"github.com/ZeeshanSaleem-official/MailChimp/internal/mailer"
	"github.com/ZeeshanSaleem-official/MailChimp/internal/storage"
	"github.com/ZeeshanSaleem-official/MailChimp/internal/storage/postgres"
	"github.com/go-co-op/gocron"
	"github.com/rs/cors"
	"golang.org/x/crypto/bcrypt"
)

var GlobalEngineStatus atomic.Value
var SuspendedUsers sync.Map

func init() {
	GlobalEngineStatus.Store("running")
}

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

	// Load initial engine status from DB
	status, err := store.GetEngineStatus()
	if err == nil {
		GlobalEngineStatus.Store(status)
		fmt.Printf("Loaded Global Engine Status: %s\n", status)
	}

	// Load currently suspended users into memory for fast kill-switch
	users, err := store.GetAllUsers()
	if err == nil {
		for _, u := range users {
			if u.Status == "suspended" || u.Status == "banned" {
				SuspendedUsers.Store(u.ID, true)
			}
		}
	}

	// Seed the database with a default admin if none exist
	err = seedAdminIfMissing(store)
	if err != nil {
		fmt.Println("Warning: Failed to seed admin account:", err)
	}

	// Scheduling the campaign
	s := gocron.NewScheduler(time.Local)
	s.Every(1).Minute().Do(func() {
		currentStatus := GlobalEngineStatus.Load().(string)
		if currentStatus != "running" {
			fmt.Printf("\n [%v] Scheduler skipped: Engine is currently %s\n", time.Now().Format("15:04:05"), currentStatus)
			return
		}

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
			runCampaign(camp.UserID, store, db, camp, cfg.SMTP.Host, cfg.SMTP.Port, cfg.SMTP.Username, cfg.SMTP.Password) 
			
			// Check if the queue is completely drained
			pendingCount, err := store.GetPendingQueueCount(camp.ID)
			if err == nil && pendingCount == 0 {
				store.UpdateCampaignStatus(camp.ID, "completed")
				fmt.Printf("✅ Campaign '%s' completed successfully!\n", camp.Name)
			} else {
				// Revert to pending so the scheduler picks up the remaining emails next time
				store.UpdateCampaignStatus(camp.ID, "pending")
				fmt.Printf("⏸️ Campaign '%s' paused mid-batch. %d emails remaining.\n", camp.Name, pendingCount)
			}
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
	// Callbacks for Kill Switch
	isEngineRunning := func() bool {
		return GlobalEngineStatus.Load().(string) == "running"
	}
	isUserSuspendedCheck := func(userID int) bool {
		if suspended, ok := SuspendedUsers.Load(userID); ok {
			return suspended.(bool)
		}
		return false
	}

	mux.HandleFunc("/api/recipients", handlers.AuthMiddleware(cfg.JWTSecret, handlers.GetRecipientHandler(store)))
	mux.HandleFunc("/api/campaign/run", handlers.AuthMiddleware(cfg.JWTSecret, handlers.RunCampaignHandler(store, triggerCallback)))
	mux.HandleFunc("/api/recipients/upload", handlers.AuthMiddleware(cfg.JWTSecret, handlers.UploadCSVHandler(store)))
	mux.HandleFunc("/api/campaign/send", handlers.AuthMiddleware(cfg.JWTSecret, handlers.SendCampaignHandler(store, testMailer, isEngineRunning, isUserSuspendedCheck)))
	mux.HandleFunc("/api/recipients/resend", handlers.AuthMiddleware(cfg.JWTSecret, handlers.ResendEmailHandler(store, testMailer)))
	mux.HandleFunc("/api/recipients/delete", handlers.AuthMiddleware(cfg.JWTSecret, handlers.DeleteRecipient(store)))
	// Landing Handlers
	mux.HandleFunc("/api/signup", handlers.SignUpHandlers(store))
	mux.HandleFunc("/api/login", handlers.LoginHandlers(store, cfg.JWTSecret))
	mux.HandleFunc("/api/logout", handlers.LogoutHandlers())
	// logs handlers
	mux.HandleFunc("/api/logs", handlers.AuthMiddleware(cfg.JWTSecret, handlers.GetLogsHandler(store)))
	
	// Admin handlers
	userStatusCallback := func(userID int, status string) {
		if status == "suspended" || status == "banned" {
			SuspendedUsers.Store(userID, true)
		} else {
			SuspendedUsers.Delete(userID)
		}
		fmt.Printf("Tenant-Level Kill Switch: User %d status updated to %s\n", userID, status)
	}
	mux.HandleFunc("/api/admin/users", handlers.AdminMiddleware(cfg.JWTSecret, handlers.GetAllUsersHandler(store)))
	mux.HandleFunc("/api/admin/users/status", handlers.AdminMiddleware(cfg.JWTSecret, handlers.UpdateUserStatusHandler(store, userStatusCallback)))
	mux.HandleFunc("/api/admin/users/role", handlers.AdminMiddleware(cfg.JWTSecret, handlers.UpdateUserRoleHandler(store)))
	mux.HandleFunc("/api/admin/users/quota", handlers.AdminMiddleware(cfg.JWTSecret, handlers.UpdateUserQuotaHandler(store)))
	mux.HandleFunc("/api/admin/stats", handlers.AdminMiddleware(cfg.JWTSecret, handlers.GetGlobalStatsHandler(store)))
	mux.HandleFunc("/api/admin/logs", handlers.AdminMiddleware(cfg.JWTSecret, handlers.GetGlobalLogsHandler(store)))

	// Engine controls
	engineStatusCallback := func(status string) {
		GlobalEngineStatus.Store(status)
		fmt.Printf("Global Engine Status updated to: %s\n", status)
	}
	mux.HandleFunc("/api/admin/engine", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handlers.AdminMiddleware(cfg.JWTSecret, handlers.GetEngineStatusHandler(store))(w, r)
		} else if r.Method == http.MethodPut {
			handlers.AdminMiddleware(cfg.JWTSecret, handlers.UpdateEngineStatusHandler(store, engineStatusCallback))(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

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

	// 1. Initialize the queue (only adds emails if they aren't already in the queue)
	err := store.InitializeCampaignQueue(camp.ID, userID, camp.TargetSegment)
	if err != nil {
		fmt.Printf("Error initializing campaign queue: %v\n", err)
		return
	}

	recipientchannel := make(chan types.Recipient)
	go func() {
		// 2. Fetch only 'pending' emails from the persistent queue
		fetchPendingFromQueue(camp.ID, userID, recipientchannel, db)
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

// seedAdminIfMissing checks the database for any admin accounts.
// If none are found, it creates a fail-safe Super Admin.
func seedAdminIfMissing(store storage.Storage) error {
	users, err := store.GetAllUsers()
	if err != nil {
		return err
	}

	for _, u := range users {
		if u.Role == "admin" {
			// An admin already exists, no need to seed.
			return nil
		}
	}

	fmt.Println(" No admin account detected. Seeding default Super Admin...")
	hash, err := bcrypt.GenerateFromPassword([]byte("admin123"), 10)
	if err != nil {
		return err
	}

	err = store.CreateUser("admin@mailchimp.local", string(hash), "admin")
	if err != nil {
		return err
	}
	
	fmt.Println("✅ Default Super Admin created! (Email: admin@mailchimp.local | Password: admin123)")
	return nil
}
