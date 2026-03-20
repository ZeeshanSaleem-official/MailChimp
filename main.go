package main

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/ZeeshanSaleem-official/MailChimp/internal/config"
	"github.com/ZeeshanSaleem-official/MailChimp/internal/storage"
	"github.com/go-co-op/gocron"
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
type RecipientAPI struct {
	ID      int    `json:"id"`
	Name    string `json:"name"`
	Email   string `json:"email"`
	Segment string `json:"segment"`
	Status  string `json:"status"`
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
	importCSVtoDB("./mail.csv", db)
	// Run campaign at some schedule
	s := gocron.NewScheduler(time.Local)
	s.Every(1).Minute().Do(func() {
		fmt.Printf("\n [%v] Scheduled Task Triggered: Starting Campaign '%s'...\n", time.Now().Format("15:04:05"), myCampaign.Name)
		runCampaign(db, myCampaign)
		fmt.Println(" Campaign execution finished. Waiting for next schedule...")
	})
	fmt.Println(" Scheduler started! Waiting for the next scheduled run...")
	s.StartAsync()

	//routes

	http.HandleFunc("/api/recipients", getRecipientHandler(db))
	http.HandlerFunc("/api/campaign/run",runCampaignHandler(db))
	
	fmt.Println(" Web Server is running on http://localhost:8080")
	fmt.Println(" Scheduler is running in the background...")
	log.Fatal(http.ListenAndServe(":8080", nil))

}

// Run campaign dynamically
func runCampaign(db *sql.DB, camp Campaign) {

	recipientchannel := make(chan Recipient)
	go func() {
		fetchRecipientsFromDB(recipientchannel, db, camp.TargetSegment)
	}()
	workerCount := 5
	var wg sync.WaitGroup
	for i := 1; i <= workerCount; i++ {
		wg.Add(1)
		go emailWorker(i, recipientchannel, &wg, camp, db)
	}
	wg.Wait()

}

// execute the template for email
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

// Update the email status after send or failure
func UpdateEmailStatus(db *sql.DB, email string, status string) error {
	query := `UPDATE recipients SET status=$1 WHERE email=$2`
	_, err := db.Exec(query, status, email)
	if err != nil {
		return err
	}
	return nil
}

// Fetch data from db to show into frontend
func getRecipientHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Content-Type", "application/json")
		query := "SELECT id, name, email, segment, status FROM recipients ORDER BY id ASC"
		rows, err := db.Query(query)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var users []RecipientAPI
		for rows.Next() {
			var u RecipientAPI
			err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Segment, &u.Status)
			if err != nil {
				continue
			}
			users = append(users, u)
		}
		err = json.NewEncoder(w).Encode(users)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}
}

// Get data from UI and than trigger the emails
func runCampaignHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, "The Methods should be a POST", http.StatusMethodNotAllowed)
			return
		}
		//Decoding the body payload by React to Compaign
		var newCampaign Campaign
		err := json.NewDecoder(r.Body).Decode(&newCampaign)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		// if the template file is set to empty
		if newCampaign.TemplateFile == "" {
			newCampaign.TemplateFile = "promo.tmpl"
		}
		go func() {
			fmt.Printf("\n manual campaign triggered via API: %s, targeting the segment: %s\n ", newCampaign.Name, newCampaign.TargetSegment)
			runCampaign(db, newCampaign)
			fmt.Println(" Manual Campaign execution finished.")
		}()
		//sent the status ok back to UI
		w.Header().Set("Content-Type", "applciation/json")
		w.WriteHeader(http.StatusOK)

		response:= map[string]string{
			"status":"success",
			"message":fmt.Sprintf("Campagin %s is now running",newCampaign.Name)
		}
		json.NewEncoder(w).Encode(response)
	}

}
