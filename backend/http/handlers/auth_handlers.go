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
	UserRole string `json:"userRole"`
}

// Sign up Hanlder
func SignUpHandlers(store storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
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
		// Force role to "user" for all public signups to prevent privilege escalation
		err = store.CreateUser(payload.Email, string(hash), "user")
		if err != nil {
			fmt.Println("DB ERROR:", err)
			http.Error(w, "Database failed to create user", http.StatusInternalServerError)
			return
		}
		// if err != nil {
		// 	http.Error(w, "User Already exists or DB error", http.StatusConflict)
		// 	return
		// }
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{"message": "Account created successfully!"})
	}
}

// Generateing cookie token
func GenerateToken(user types.User, secret string) (string, error) {
	// Create the claims (the data inside the token)
	claims := jwt.MapClaims{
		"userID": user.ID,
		"email":  user.Email,
		"role":   user.Role,
		"exp":    time.Now().Add(time.Hour * 24).Unix(),
	}
	// Create the token blueprint
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	// Sign it with your YAML secret
	return token.SignedString([]byte(secret))
}

// Log in Handler
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
		// THE HTTP-ONLY COOKIE
		cookie := &http.Cookie{
			Name:     "jwt",
			Value:    token,
			Expires:  time.Now().Add(24 * time.Hour),
			HttpOnly: true,
			Secure:   false,
			Path:     "/",
			SameSite: http.SameSiteLaxMode,
		}
		http.SetCookie(w, cookie)
		// Send final success  to react(frontend)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Logged In Successfully!!",
			"role":    u.Role,
		})

	}
}

// Logout Handler
func LogoutHandlers() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cookie := &http.Cookie{
			Name:     "jwt",
			Value:    " ",
			Expires:  time.Unix(0, 0),
			MaxAge:   -1,
			HttpOnly: true,
			Secure:   false,
			Path:     "/",
			SameSite: http.SameSiteLaxMode,
		}
		http.SetCookie(w, cookie)
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"Message":"Successfully Logged out}`))
	}
}

// Delete Recipient
func DeleteRecipient(store storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		//  Approve the browser preflight test
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method != http.MethodDelete {
			http.Error(w, "Method not Allowed", http.StatusMethodNotAllowed)
			return
		}
		// Extracting userID
		userID, ok := r.Context().Value(UserIDKey).(int)
		if !ok {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		var payload struct {
			ID int `json:"id"`
		}
		// Decoding payload
		err := json.NewDecoder(r.Body).Decode(&payload)
		if err != nil {
			http.Error(w, "Invalid JSON Payload", http.StatusBadRequest)
			return
		}
		// Delete Recipients
		err = store.DeleteRecipient(userID, payload.ID)
		if err != nil {
			http.Error(w, "Failed to Delete DB from database", http.StatusInternalServerError)
			return
		}
		// Send Success Receipt
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"message":"Contact deleted successfully!"}`))
	}
}
