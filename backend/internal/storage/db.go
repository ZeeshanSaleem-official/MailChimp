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
		userRole VARCHAR(150) NOT NULL,
		daily_quota INTEGER DEFAULT 500
	)
	`
	_, err = db.Exec(userQuery)
	if err != nil {
		return nil, fmt.Errorf("Failed to create users table: %v", err)
	}

	// Ensure status column exists (for backward compatibility)
	alterUserQuery := `ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';`
	_, err = db.Exec(alterUserQuery)
	if err != nil {
		fmt.Printf("Warning: failed to add status column to users: %v\n", err)
	}

	alterQuotaQuery := `ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_quota INTEGER DEFAULT 500;`
	_, err = db.Exec(alterQuotaQuery)
	if err != nil {
		fmt.Printf("Warning: failed to add daily_quota column to users: %v\n", err)
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

	// For storing logs data
	logsEmail := ` CREATE TABLE IF NOT EXISTS email_logs(
		id SERIAL PRIMARY KEY,
    	user_id INT NOT NULL,              
    	campaign_name VARCHAR(255),        
    	recipient_email VARCHAR(255),     
    	status VARCHAR(50),                
    	sent_at TIMESTAMP DEFAULT NOW()    
	)`
	_, err = db.Exec(logsEmail)
	if err != nil {
		return nil, fmt.Errorf("Failed to create Email logs data table: %v", err)
	}

	// For persistent campaign queuing (Flawless Resume/Pause)
	queueQuery := `
	CREATE TABLE IF NOT EXISTS campaign_queue (
		id SERIAL PRIMARY KEY,
		campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
		recipient_email VARCHAR(150) NOT NULL,
		status VARCHAR(50) DEFAULT 'pending',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(campaign_id, recipient_email)
	)
	`
	_, err = db.Exec(queueQuery)
	if err != nil {
		return nil, fmt.Errorf("Failed to create campaign_queue table: %v", err)
	}

	// For storing system-wide settings (Kill Switch)
	systemSettingsQuery := `
	CREATE TABLE IF NOT EXISTS system_settings (
		setting_key VARCHAR(50) PRIMARY KEY,
		setting_value VARCHAR(255) NOT NULL
	)
	`
	_, err = db.Exec(systemSettingsQuery)
	if err != nil {
		return nil, fmt.Errorf("Failed to create system_settings table: %v", err)
	}

	// Seed default engine status
	seedEngineStatus := `
	INSERT INTO system_settings (setting_key, setting_value) 
	VALUES ('engine_status', 'running') 
	ON CONFLICT (setting_key) DO NOTHING
	`
	_, err = db.Exec(seedEngineStatus)
	if err != nil {
		fmt.Printf("Warning: failed to seed engine_status: %v\n", err)
	}

	log.Println("Schema initialized.")
	return db, nil
}
