package main

import (
	"database/sql"
	"encoding/csv"
	"fmt"
	"os"

	"github.com/ZeeshanSaleem-official/MailChimp/internal/config/types"
)

// Import Recipients from CSV
func importCSVtoDB(userID int, filePath string, db *sql.DB) error {
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

	// Updated query to include user_id and segment (defaulting to 'general')
	// We also updated the CONFLICT clause to use our new unique constraint!
	query := `INSERT INTO recipients (user_id, name, email, segment) 
              VALUES ($1, $2, $3, 'general') 
              ON CONFLICT (user_id, email) DO NOTHING;`

	for _, record := range records[1:] {
		_, err = db.Exec(query, userID, record[0], record[1])
		if err != nil {
			return err
		}
	}
	fmt.Printf("All emails are added to Database successfully!!\r\n")
	return nil
}

// fetch all recipients from email
func fetchRecipientsFromDB(userID int, ch chan types.Recipient, db *sql.DB, seg string) error {
	defer close(ch)

	query := "SELECT email, name FROM recipients WHERE segment = $1 AND user_id = $2"

	// Reading from database
	row, err := db.Query(query, seg, userID)
	if err != nil {
		return err
	}
	defer row.Close()

	for row.Next() {
		var email string
		var name string

		err = row.Scan(&email, &name)
		if err != nil {
			fmt.Printf("Error scanning row: %v\n", err)
			continue
		}
		fmt.Printf("Email: %s | Name: %s\n", email, name)

		// Send through channel
		ch <- types.Recipient{
			Name:  name,
			Email: email,
		}
	}
	fmt.Printf("All emails loaded into the channel successfully!!\n")
	return nil
}
