package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/ZeeshanSaleem-official/MailChimp/internal/config/types"
	"github.com/ZeeshanSaleem-official/MailChimp/internal/storage"
	"golang.org/x/crypto/bcrypt"
)

type AuthPayload struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func SignUpHandlers(store storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var payload AuthPayload
		//Decode the incoming email and password
		err := json.NewDecoder(r.Body).Decode(&payload)
		if err != nil {
			http.Error(w, "Invalid input", http.StatusBadRequest)
			return
		}
		// Hashing of Password
		hash, err := bcrypt.GenerateFromPassword([]byte(payload.Password), 10)
		if err != nil {
			http.Error(w, "Error while securing password", http.StatusBadRequest)
			return
		}
		// Creating user and Save to Database
		err = store.CreateUser(payload.Email, string(hash))
		if err != nil {
			http.Error(w, "User Already exists or DB error", http.StatusConflict)
			return
		}
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{"message": "Account created successfully!"})
	}
}

func LoginHandlers(store storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var payload AuthPayload

		err := json.NewDecoder(r.Body).Decode(&payload)
		if err != nil {
			http.Error(w, "Inavlid Input", http.StatusBadRequest)
			return
		}
		// Get Users
		var u types.User
		u, err = store.GetUser(payload.Email)
		if err != nil {
			http.Error(w, "Error while getting user for validation", http.StatusBadRequest)
			return
		}
		fmt.Printf("User acquired")
		// Decryption of Password
		err = bcrypt.CompareHashAndPassword([]byte(u.HashPassword), []byte(payload.Password))
		if err != nil {
			http.Error(w, "Error while decryption", http.StatusUnauthorized)
			return
		}
		// Status Ok
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"message": "Logged In Successfully!!"})

	}
}
