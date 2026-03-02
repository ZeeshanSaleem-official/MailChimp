package main

import (
	"encoding/csv"
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
}
