package storage

import "github.com/ZeeshanSaleem-official/MailChimp/internal/config/types"

type Storage interface {
	// recipients
	GetAllRecipients(userID int, segment string) ([]types.RecipientAPI, error)
	UpdateEmailStatus(userID int, email string, status string) error
	AddRecipients(userID int, name string, email string, segment string) error
	DeleteRecipient(userID int, recipientID int) error
	
	// campaigns and queue
	GetPendingCampaigns() ([]types.Campaign, error)
	UpdateCampaignStatus(campaignID int, status string) error
	InitializeCampaignQueue(campaignID int, userID int, segment string) error
	GetPendingQueueCount(campaignID int) (int, error)
	UpdateQueueEmailStatus(campaignID int, email string, status string) error
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
	GetUsersPaginated(page int, limit int, search string) ([]types.User, int, error)
	UpdateUserStatus(userID int, status string) error
	UpdateUserRole(userID int, role string) error
	GetGlobalStats() (types.GlobalStats, error)
	GetGlobalEmailLogs(limit int) ([]types.GlobalEmailLog, error)
	GetGlobalEmailLogsPaginated(page int, limit int, search string) ([]types.GlobalEmailLog, int, error)
	// engine controls
	GetEngineStatus() (string, error)
	UpdateEngineStatus(status string) error
}
