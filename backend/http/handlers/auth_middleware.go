package handlers

import (
	"context"
	"fmt"
	"net/http"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const UserIDKey contextKey = "userID"

func AuthMiddleware(jwtSecret string, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Grab the Authorization token from cookie
		cookie, err := r.Cookie("jwt")
		if err != nil {
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

		// Extract the claims (the data payload inside the JWT)
		claims, ok := parsedToken.Claims.(jwt.MapClaims)

		if !ok {
			http.Error(w, "Invalid Token Payload", http.StatusUnauthorized)
			return
		}
		// extracting user ID
		userIDFloat, ok := claims["userID"].(float64)

		if !ok {
			http.Error(w, "User ID is missing token", http.StatusUnauthorized)
			return
		}
		userID := int(userIDFloat)
		// Inject the userID into the request Context
		ctx := context.WithValue(r.Context(), UserIDKey, userID)
		// send the context
		next(w, r.WithContext(ctx))
	}
}
