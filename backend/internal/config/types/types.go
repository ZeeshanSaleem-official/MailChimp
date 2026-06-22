package types

import "time"

type Recipient struct {
	Name  string
	Email string
}
type EmailData struct {
	User Recipient
	Camp Campaign
}
type Campaign struct {
	ID            int    `json:"id"`
	UserID        int    `json:"user_id"`
	Name          string `json:"name"`
	Subject       string `json:"subject"`
	TemplateFile  string `json:"templateFile"`
	TargetSegment string `json:"segment"`
	Status        string `json:"status"`
}
type RecipientAPI struct {
	ID      int    `json:"id"`
	Name    string `json:"name"`
	Email   string `json:"email"`
	Segment string `json:"segment"`
	Status  string `json:"status"`
}

type User struct {
	ID           int       `json:"id"`
	Email        string    `json:"email"`
	HashPassword string    `json:"-"` // for security password written as -
	Role         string    `json:"user"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"created_at"`
}

// EmailLog represents a single sent email record in the historical ledger
type EmailLog struct {
	ID             int       `json:"id"`
	UserID         int       `json:"user_id"`
	CampaignName   string    `json:"campaign_name"`
	RecipientEmail string    `json:"recipient_email"`
	Status         string    `json:"status"`
	SentAt         time.Time `json:"sent_at"`
}

type GlobalStats struct {
	TotalUsers    int `json:"total_users"`
	GlobalQueue   int `json:"global_queue"`
	TotalSent     int `json:"total_sent"`
	TotalFailures int `json:"total_failures"`
}
