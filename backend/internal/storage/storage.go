package storage

import "github.com/ZeeshanSaleem-official/MailChimp/internal/config/types"

type Storage interface {
	// recipients
	GetAllRecipients(userID int, segment string) ([]types.RecipientAPI, error)
	UpdateEmailStatus(userID int, email string, status string) error
	AddRecipients(userID int, name string, email string, segment string) error
	DeleteRecipient(userID int, recipientID int) error
	// logs
	LogEmailEvent(userID int, campaignName string, recipientEmail string, status string) error
	GetEmailLogs(userID int) ([]types.EmailLog, error)
	// users
	CreateUser(email string, passwordHash string, userRole string) error
	GetUser(email string) (*types.User, error)
	GetUserByID(id int) (*types.User, error)
	GetDailySentCount(userID int) (int, error)
	UpdateUserQuota(userID int, quota int) error
	// admin
	GetAllUsers() ([]types.User, error)
	UpdateUserStatus(userID int, status string) error
	UpdateUserRole(userID int, role string) error
	GetGlobalStats() (types.GlobalStats, error)
	GetGlobalEmailLogs(limit int) ([]types.GlobalEmailLog, error)
}
