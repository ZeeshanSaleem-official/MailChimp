package storage

import "github.com/ZeeshanSaleem-official/MailChimp/internal/config/types"

type Storage interface {
	GetAllRecipients() ([]types.RecipientAPI, error)
	UpdateEmailStatus(email string, status string) error
}
