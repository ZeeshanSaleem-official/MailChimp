package main

import (
	"encoding/csv"
	"os"
)

func loadRecipients(filePath string, ch chan Recipient) error {
	defer close(ch)
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
	// Reading from channel
	for _, record := range records[1:] {
		ch <- Recipient{
			Name:  record[0],
			Email: record[1],
		}
	}
	return nil
}
