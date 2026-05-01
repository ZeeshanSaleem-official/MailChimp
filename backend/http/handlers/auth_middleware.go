package handlers

import (
	"fmt"
	"net/http"

	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware(jwtSecret string, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Grab the Authorization token from cookie
		cookie, err := r.Cookie("jwt")
		if cookie.Value == "" {
			http.Error(w, "Missing authentication cookie", http.StatusUnauthorized)
			return
		}
		tokenString := cookie.Value
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
