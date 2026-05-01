package handlers

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware(jwtSecret string, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Grab the Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Missing Authorization token", http.StatusUnauthorized)
			return
		}
		// Strip the "Bearer " prefix to get the raw token strings
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "Invalid Authorization format. Expected 'Bearer <token>'", http.StatusUnauthorized)
			return
		}
		tokenString := parts[1]
		parsedToken, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
			_, ok := t.Method.(*jwt.SigningMethodHMAC)
			if !ok {
				return nil, fmt.Errorf("Unexpected SigningMethod")
			}
			return []byte(jwtSecret), nil
		})
		if err != nil || !parsedToken.Valid {
			http.Error(w, "Invalid  or expired token", http.StatusUnauthorized)
			return
		}
		next(w, r)
	}
}
