package main

import (
	"database/sql"
	"encoding/csv"
	"fmt"
	"os"
)

func importCSVtoDB(filePath string, db *sql.DB) error {
	// Read from CSV
	f, err := os.Open(filePath)
	if err != nil {
		return err
	}
	defer f.Close()
	Reader := csv.NewReader(f)
	records, err := Reader.ReadAll()
	if err != nil {
		return err
	}
	// Insert into the Database
	query := `INSERT INTO recipients (name, email) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING;`

	for _, record := range records[1:] {
		_, err = db.Exec(query, record[0], record[1])
		if err != nil {
			return err
		}
	}
	fmt.Printf("All emails are added to Database successfully!!\r\n")
	return nil
}

// fetch all recipients from email
func fetchRecipientsFromDB(ch chan Recipient, db *sql.DB, seg string) error {
	defer close(ch)

	query := "SELECT email, name FROM recipients WHERE segment = $1"

	// Reading from channel
	row, err := db.Query(query, seg)
	if err != nil {
		return err
	}
	for row.Next() {
		var email string
		var name string

		err = row.Scan(&email, &name)
		if err != nil {
			fmt.Printf("Error scanning row: %v\n", err)
			continue
		}
		fmt.Printf("Email: %s\r Name:%s\r", email, name)
		defer row.Close()
		//Send through channel
		ch <- Recipient{
			Name:  name,
			Email: email,
		}
	}
	fmt.Printf("All emails are sent successfully!!\r\n")
	return nil
}
