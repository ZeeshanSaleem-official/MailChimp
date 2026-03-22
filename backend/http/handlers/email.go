package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/ZeeshanSaleem-official/MailChimp/internal/config/types"
	"github.com/ZeeshanSaleem-official/MailChimp/internal/storage"
)

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

		// Use the Campaign struct from your types package
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
