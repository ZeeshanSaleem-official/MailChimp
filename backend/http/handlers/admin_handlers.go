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

// UpdateUserRoleHandler toggles a user's role (make admin)
func UpdateUserRoleHandler(store storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPut {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var payload struct {
			UserID int    `json:"user_id"`
			Role   string `json:"role"`
		}

		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, "Invalid request payload", http.StatusBadRequest)
			return
		}

		if payload.Role != "admin" && payload.Role != "user" {
			http.Error(w, "Invalid role", http.StatusBadRequest)
			return
		}

		err := store.UpdateUserRole(payload.UserID, payload.Role)
		if err != nil {
			http.Error(w, "Failed to update user role", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "User role updated successfully!"})
	}
}

// GetGlobalStatsHandler fetches system-wide stats (Admin only)
func GetGlobalStatsHandler(store storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		stats, err := store.GetGlobalStats()
		if err != nil {
			http.Error(w, "Failed to fetch global stats", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(stats)
	}
}

// GetGlobalLogsHandler fetches the recent activity firehose
func GetGlobalLogsHandler(store storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		logs, err := store.GetGlobalEmailLogs(100) // limit to 100
		if err != nil {
			http.Error(w, "Failed to fetch global logs", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(logs)
	}
}

// UpdateUserQuotaHandler updates a user's daily quota (Admin only)
func UpdateUserQuotaHandler(store storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPut {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var payload struct {
			UserID int `json:"user_id"`
			Quota  int `json:"daily_quota"`
		}

		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, "Invalid input", http.StatusBadRequest)
			return
		}

		if payload.Quota < 0 {
			http.Error(w, "Invalid quota", http.StatusBadRequest)
			return
		}

		err := store.UpdateUserQuota(payload.UserID, payload.Quota)
		if err != nil {
			http.Error(w, "Failed to update user quota", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "User quota updated successfully!"})
	}
}

// GetEngineStatusHandler fetches the global engine status (Admin only)
func GetEngineStatusHandler(store storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		status, err := store.GetEngineStatus()
		if err != nil {
			http.Error(w, "Failed to fetch engine status", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": status})
	}
}

// UpdateEngineStatusHandler updates the global engine status (Admin only)
func UpdateEngineStatusHandler(store storage.Storage, onStatusChange func(string)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPut {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var payload struct {
			Status string `json:"status"`
		}

		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, "Invalid input", http.StatusBadRequest)
			return
		}

		if payload.Status != "running" && payload.Status != "paused" && payload.Status != "stopped" {
			http.Error(w, "Invalid status", http.StatusBadRequest)
			return
		}

		err := store.UpdateEngineStatus(payload.Status)
		if err != nil {
			http.Error(w, "Failed to update engine status", http.StatusInternalServerError)
			return
		}

		// Sync the in-memory engine status in main
		if onStatusChange != nil {
			onStatusChange(payload.Status)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "Engine status updated to " + payload.Status, "status": payload.Status})
	}
}
