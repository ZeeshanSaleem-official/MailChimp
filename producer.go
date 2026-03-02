package main

import (
	"encoding/csv"
	"fmt"
	"os"
)

func loadRecipients(filePath string) error {
	// we will use the channels and much more
	f, err := os.Open(filePath)
	if err != nil {
		return err
	}
	Reader := csv.NewReader(f)
	records, err := Reader.ReadAll()
	if err != nil {
		return err
	}
	for _, record := range records[1:] {
		fmt.Println(record)
	}
	return nil
}
