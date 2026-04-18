package storage

import "github.com/ZeeshanSaleem-official/MailChimp/internal/config/types"

type Storage interface {
	GetAllRecipients(segment string) ([]types.RecipientAPI, error)
	UpdateEmailStatus(email string, status string) error
	AddRecipients(name string, email string, segment string) error
	CreateUser(email string, passwordHash string) error
	GetUser(email string) (types.User, error)
}
