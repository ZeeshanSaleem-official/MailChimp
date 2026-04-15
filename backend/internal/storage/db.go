package storage

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
)

func InitDB(connSTr string) (*sql.DB, error) {
	db, err := sql.Open("postgres", connSTr)
	if err != nil {
		return nil, err
	}
	err = db.Ping()
	if err != nil {
		return nil, err
	}
	fmt.Println(" PostgreSQL Database connected successfully!")
	// email should be unique even name or remaining fields remains same
	// for Recipients Schema

	query := `
	CREATE TABLE IF NOT EXISTS recipients(
	id SERIAL PRIMARY KEY,
		name VARCHAR(100) NOT NULL,
		email VARCHAR(150) UNIQUE NOT NULL, 
		segment VARCHAR(50) DEFAULT 'general',
		status VARCHAR(50) DEFAULT 'pending',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	)
	`
	_, err = db.Exec(query)
	if err != nil {
		return nil, fmt.Errorf("failed to create table: %v", err)
	}
	// for user Schema
	userQuery := `
	CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
	`
	_, err = db.Exec(userQuery)
	if err != nil {
		return nil, fmt.Errorf("Failed to create table: %v", err)
	}
	log.Println("Schema initialized.")
	return db, nil
}
