package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/ZeeshanSaleem-official/MailChimp/internal/storage"
	"golang.org/x/crypto/bcrypt"
)

func SignUpHandlers(store storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var input struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}
		//Decode the incoming email and password
		err := json.NewDecoder(r.Body).Decode(&input)
		if err != nil {
			http.Error(w, "Invalid input", http.StatusBadRequest)
			return
		}
		// Hashing of Password
		hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), 10)
		if err != nil {
			http.Error(w, "Error while securing password", http.StatusBadRequest)
			return
		}
		// Creating user and Save to Database
		err = store.CreateUser(input.Email, string(hash))
		if err != nil {
			http.Error(w, "User Already exists or DB error", http.StatusConflict)
			return
		}
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{"message": "Account created successfully!"})
	}
}
