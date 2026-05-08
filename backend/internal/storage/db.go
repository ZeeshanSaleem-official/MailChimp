package storage

import (
	"database/sql"
	"fmt"
	"log"
	"time" //  Need this for the time.Sleep() pause

	_ "github.com/lib/pq"
)

func InitDB(connSTr string) (*sql.DB, error) {
	var db *sql.DB
	var err error

	//  Try to connect up to 5 times
	for i := 1; i <= 5; i++ {
		db, err = sql.Open("postgres", connSTr)
		if err == nil {
			err = db.Ping()
			if err == nil {
				break // Success! Break out of the loop
			}
		}

		fmt.Printf("Database not ready, retrying in 2 seconds (Attempt %d/5)...\n", i)
		time.Sleep(2 * time.Second)
	}

	// If it fails after 5 attempts, kill the server
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database after 5 attempts: %v", err)
	}

	fmt.Println(" PostgreSQL Database connected successfully!")

	// for user Schema
	userQuery := `
	CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		email VARCHAR(150) UNIQUE NOT NULL,
		password_hash TEXT NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		userRole VARCHAR(150) NOT NULL
	)
	`
	_, err = db.Exec(userQuery)
	if err != nil {
		return nil, fmt.Errorf("Failed to create users table: %v", err)
	}

	// email, and foreign key should be unique even name or remaining fields remains same
	// for Recipients Schema

	query := `
	CREATE TABLE IF NOT EXISTS recipients(
		id SERIAL PRIMARY KEY,
		user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		name VARCHAR(100) NOT NULL,
		email VARCHAR(150)  NOT NULL, 
		segment VARCHAR(50) DEFAULT 'general',
		status VARCHAR(50) DEFAULT 'pending',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(user_id, email)
	)
	`
	_, err = db.Exec(query)
	if err != nil {
		return nil, fmt.Errorf("failed to create table: %v", err)
	}

	// For storing Campaign Data
	campaignQuery := `
	CREATE TABLE IF NOT EXISTS campaigns (
		id SERIAL PRIMARY KEY,
		user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		name VARCHAR(150) NOT NULL,
		subject VARCHAR(255) NOT NULL,
		template_file VARCHAR(100) DEFAULT 'promo.tmpl',
		target_segment VARCHAR(50) DEFAULT 'general',
		status VARCHAR(50) DEFAULT 'pending',
		scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	)
	`
	_, err = db.Exec(campaignQuery)
	if err != nil {
		return nil, fmt.Errorf("Failed to create campaigns data table: %v", err)
	}

	log.Println("Schema initialized.")
	return db, nil
}
