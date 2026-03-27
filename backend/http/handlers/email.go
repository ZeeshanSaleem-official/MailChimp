package handlers

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/ZeeshanSaleem-official/MailChimp/internal/config/types"
	"github.com/ZeeshanSaleem-official/MailChimp/internal/storage"
)

// Get Recipients for sending emails
func GetRecipientHandler(store storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Content-Type", "application/json")

		// Ask the storage interface for the data, no SQL needed here!
		users, err := store.GetAllRecipients()
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
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

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

		w.Header().Set("Content-Type", "application/json")
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
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "Post,Options")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

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
		// Later will send to the Database
		fmt.Printf("\n[Incoming File] Received %s (%d bytes)\n", header.Filename, header.Size)

		reader := csv.NewReader(file)
		// for not reading the column name
		_, _ = reader.Read()
		for {
			record, err := reader.Read()

			if err == io.EOF {
				break
			}
			if err != nil {
				http.Error(w, "Error during reading file from csv", http.StatusBadRequest)
			}
			fmt.Printf("Parsed Row -> Name: %s | Email: %s | Segment: %s\n", record[0], record[1], record[2])
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"success", "message":"File parsed successfully"}`))
	}

}
