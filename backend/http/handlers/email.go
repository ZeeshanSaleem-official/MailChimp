package handlers

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/ZeeshanSaleem-official/MailChimp/internal/config/types"
	"github.com/ZeeshanSaleem-official/MailChimp/internal/mailer"
	"github.com/ZeeshanSaleem-official/MailChimp/internal/storage"
)

// Get Recipients for sending emails
func GetRecipientHandler(store storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := r.Context().Value(UserIDKey).(int)
		if !ok {
			// If the ID isn't there, cleanly reject the request instead of crashing the server
			http.Error(w, "Unauthorized: User ID missing from context", http.StatusUnauthorized)
			return
		}
		segmentFilter := r.URL.Query().Get("segment")

		// Ask the storage interface for the data, no SQL needed here!
		users, err := store.GetAllRecipients(userID, segmentFilter)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(users)
	}
}

// Run Campaign manually
func RunCampaignHandler(triggerWorker func(userID int, camp types.Campaign)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, "Method should be POST", http.StatusMethodNotAllowed)
			return
		}
		//Extract dynamic userID from the request context!
		userID, ok := r.Context().Value(UserIDKey).(int)
		if !ok {
			http.Error(w, "Unauthorized: User ID missing from context", http.StatusUnauthorized)
			return
		}

		var newCampaign types.Campaign
		err := json.NewDecoder(r.Body).Decode(&newCampaign)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if newCampaign.TemplateFile == "" {
			newCampaign.TemplateFile = "promo.tmpl"
		}

		// // Trigger the Go workers in the background via the callback
		// go func() {
		// 	triggerWorker(userID, newCampaign)
		// }()

		// Trigger the Go worker and pass the userID into it!
		// We pass userID into the anonymous function safely
		go func(uID int, camp types.Campaign) {
			triggerWorker(uID, camp)
		}(userID, newCampaign)
		w.WriteHeader(http.StatusOK)

		response := map[string]string{
			"status":  "success",
			"message": fmt.Sprintf("Campaign %s is now running", newCampaign.Name),
		}
		json.NewEncoder(w).Encode(response)
	}
}

// For fetching the data from the CSV upload file
func UploadCSVHandler(store storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}
		// Extract dynamic userID from the request context!
		userID, ok := r.Context().Value(UserIDKey).(int)
		if !ok {
			http.Error(w, "Unauthorized: User ID missing from context", http.StatusUnauthorized)
			return
		}
		// Parse the multipart form (Max upload size: 10MB)
		err := r.ParseMultipartForm(10 << 20)
		if err != nil {
			http.Error(w, "Failed to get email from file", http.StatusBadRequest)
			return
		}

		//Extract the file using the exact name UI sent
		file, header, err := r.FormFile("file")
		if err != nil {
			http.Error(w, "Error during getting file from request", http.StatusBadRequest)
			return
		}
		defer file.Close()
		fmt.Printf("\n[Incoming File] Received %s (%d bytes)\n", header.Filename, header.Size)

		reader := csv.NewReader(file)
		// line of code for not reading the column name
		_, _ = reader.Read()
		// read remaining all details
		for {
			record, err := reader.Read()

			if err == io.EOF {
				break
			}
			if err != nil {
				http.Error(w, "Error during reading file from csv", http.StatusBadRequest)
				return
			}
			err = store.AddRecipients(userID, record[0], record[1], record[2])
			if err != nil {
				http.Error(w, "Error during adding record in Database", http.StatusBadRequest)
				return
			}
		}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"success", "message":"File parsed successfully"}`))
	}

}

// For sending the campaign
func SendCampaignHandler(store storage.Storage, mail *mailer.Mailer) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed in the send Capmaign Handler", http.StatusMethodNotAllowed)
			return
		}
		// Extract dynamic userID from the request context!
		userID, ok := r.Context().Value(UserIDKey).(int)
		if !ok {
			http.Error(w, "Unauthorized: User ID missing from context", http.StatusUnauthorized)
			return
		}
		// Struct for the get data from react UI
		var payload struct {
			Subject string `json:"subject"`
			Body    string `json:"body"`
			Segment string `json:"segment"`
		}
		// Decoding the payload from the UI
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, "Error during decoding the UI values", http.StatusBadRequest)
			return
		}

		// Call the recipients function for getting users of segment
		users, err := store.GetAllRecipients(userID, payload.Segment)
		if err != nil {
			http.Error(w, "Error while calling backend for users", http.StatusInternalServerError)
			return
		}
		// Loop through whole segment and send emails
		go func() {
			for _, user := range users {
				err := mail.SendEmail(user.Email, payload.Subject, payload.Body)
				if err != nil {
					fmt.Printf("Error while sending mail to %s\r\n%v\n", user.Email, err)
					_ = store.UpdateEmailStatus(userID, user.Email, "failed")
					continue
				}
				updateErr := store.UpdateEmailStatus(userID, user.Email, "sent")
				if updateErr != nil {
					fmt.Printf("Email sent to %s, but DB update failed: %v\n", user.Email, updateErr)
				}
			}
		}()
		// After successful send write header status to OK!
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"success", "message":"Campaign dispatched!"}`))
	}
}

func ResendEmailHandler(store storage.Storage, mail *mailer.Mailer) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not Allowed", http.StatusMethodNotAllowed)
			return
		}
		// Extract userID for authentication and authorization
		userID, ok := r.Context().Value("userIDKey").(int)
		if !ok {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		// struct for recipients email
		var payload struct {
			Email string `json:"email"`
		}
		// Decoding of struct
		err := json.NewDecoder(r.Body).Decode(&payload)
		if err != nil {
			http.Error(w, "Invalid JSON Payload", http.StatusBadRequest)
			return
		}
		//send email again
		err = mail.SendEmail(payload.Email, "Tech Bird: Delivery Retry",
			"<h1>We are retrying your email!</h1><p>Our engine successfully re-fired this message.</p>")
		if err != nil {
			http.Error(w, "Error while resending email", http.StatusBadRequest)
			return
		}
		//updating email status
		err = store.UpdateEmailStatus(userID, payload.Email, "sent")
		if err != nil {
			http.Error(w, "Email sent, but DB update failed", http.StatusInternalServerError)
			return
		}
		// Return success to React
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "Email resent successfully!"})

	}
}
