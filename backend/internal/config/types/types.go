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
	Name          string `json:"name"`
	Subject       string `json:"subject"`
	TemplateFile  string `json:"templateFile"`
	TargetSegment string `json:"segment"`
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
	CreatedAt    time.Time `json:"created_at"`
}
