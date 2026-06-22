package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/ZeeshanSaleem-official/MailChimp/internal/storage"
)

// GetAllUsersHandler fetches all users (Admin only)
func GetAllUsersHandler(store storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		users, err := store.GetAllUsers()
		if err != nil {
			http.Error(w, "Failed to fetch users", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(users)
	}
}

// UpdateUserStatusHandler updates a user's status (Admin only)
func UpdateUserStatusHandler(store storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPut {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var payload struct {
			UserID int    `json:"user_id"`
			Status string `json:"status"`
		}

		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, "Invalid input", http.StatusBadRequest)
			return
		}

		if payload.Status != "active" && payload.Status != "suspended" && payload.Status != "banned" {
			http.Error(w, "Invalid status", http.StatusBadRequest)
			return
		}

		err := store.UpdateUserStatus(payload.UserID, payload.Status)
		if err != nil {
			http.Error(w, "Failed to update user status", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "User status updated successfully!"})
	}
}
