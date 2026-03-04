package main

import (
	"encoding/csv"
	"fmt"
	"os"
)

func loadRecipients(filePath string, ch chan Recipient) error {
	f, err := os.Open(filePath)
	if err != nil {
		return err
	}
	Reader := csv.NewReader(f)
	records, err := Reader.ReadAll()
	if err != nil {
		return err
	}
	defer f.Close()
	// Reading from channel
	for _, record := range records[1:] {
		fmt.Println(record)
		ch <- Recipient{
			Name:  record[0],
			Email: record[1],
		}
	}
	return nil
}
