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
		segmentFilter := r.URL.Query().Get("segment")

		// Ask the storage interface for the data, no SQL needed here!
		users, err := store.GetAllRecipients(segmentFilter)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(users)
	}
}

// Run Campaign manually for the Postman(later will be done using the frontend)
func RunCampaignHandler(triggerWorker func(types.Campaign)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, "Method should be POST", http.StatusMethodNotAllowed)
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

		// Trigger the Go workers in the background via the callback
		go func() {
			triggerWorker(newCampaign)
		}()

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

		if r.Method == "Options" {
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
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
			err = store.AddRecipients(record[0], record[1], record[2])
			if err != nil {
				http.Error(w, "Error during adding record in Database", http.StatusBadRequest)
				return
			}
		}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"success", "message":"File parsed successfully"}`))
	}

}
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
		users, err := store.GetAllRecipients(payload.Segment)
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
					_ = store.UpdateEmailStatus(user.Email, "failed")
					continue
				}
				updateErr := store.UpdateEmailStatus(user.Email, "sent")
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
