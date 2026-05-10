package storage

import "github.com/ZeeshanSaleem-official/MailChimp/internal/config/types"

type Storage interface {
	GetAllRecipients(userID int, segment string) ([]types.RecipientAPI, error)
	UpdateEmailStatus(userID int, email string, status string) error
	AddRecipients(userID int, name string, email string, segment string) error
	DeleteRecipient(userID int, recipientID int) error
	CreateUser(email string, passwordHash string, userRole string) error
	GetUser(email string) (*types.User, error)
}
