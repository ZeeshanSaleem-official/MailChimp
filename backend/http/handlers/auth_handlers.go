package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/ZeeshanSaleem-official/MailChimp/internal/config/types"
	"github.com/ZeeshanSaleem-official/MailChimp/internal/storage"
	"github.com/golang-jwt/jwt/v5"
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

func GenerateToken(user types.User, secret string) (string, error) {
	// Create the claims (the data inside the token)
	claims := jwt.MapClaims{
		"id":    user.ID,
		"email": user.Email,
		"exp":   time.Now().Add(time.Hour * 24).Unix(),
	}
	// Create the token blueprint
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	// Sign it with your YAML secret
	return token.SignedString([]byte(secret))
}

func LoginHandlers(store storage.Storage, jwtSecret string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var payload AuthPayload

		err := json.NewDecoder(r.Body).Decode(&payload)
		if err != nil {
			http.Error(w, "Inavlid Input", http.StatusBadRequest)
			return
		}
		// Get Users
		var u *types.User
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
		token, err := GenerateToken(*u, jwtSecret)
		if err != nil {
			http.Error(w, "Failed to Generate Token", http.StatusInternalServerError)
			return
		}
		// Send Token to react
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Logged In Successfully!!",
			"token":   token,
		})

	}
}
