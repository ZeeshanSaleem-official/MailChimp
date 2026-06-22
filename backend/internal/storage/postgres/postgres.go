package postgres

import (
	"database/sql"
	"fmt"

	"github.com/ZeeshanSaleem-official/MailChimp/internal/config/types"
)

type PostgresStore struct {
	db *sql.DB
}

func NewPostgresStore(db *sql.DB) *PostgresStore {
	return &PostgresStore{db: db}
}

// Get all recipients function
func (p *PostgresStore) GetAllRecipients(userID int, segment string) ([]types.RecipientAPI, error) {
	var rows *sql.Rows
	var err error
	if segment == "" || segment == "all" {
		query := "SELECT id, name, email, segment, status FROM recipients WHERE user_id = $1 ORDER BY id ASC"
		rows, err = p.db.Query(query, userID)
	} else {
		query := `SELECT id, name, email, segment, status FROM recipients WHERE user_id = $1 AND segment = $2`
		rows, err = p.db.Query(query, userID, segment)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []types.RecipientAPI
	for rows.Next() {
		var u types.RecipientAPI
		err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Segment, &u.Status)
		if err != nil {
			continue
		}
		users = append(users, u)
	}
	return users, nil
}

// Update email status
func (p *PostgresStore) UpdateEmailStatus(userID int, email string, status string) error {
	query := `UPDATE recipients SET status=$1 WHERE user_id = $2 AND email=$3`
	_, err := p.db.Exec(query, status, userID, email)
	return err
}

// Add Recipients(from UI to Database) function
func (p *PostgresStore) AddRecipients(userID int, name string, email string, segment string) error {
	query := "INSERT INTO recipients (user_id,name, email, segment) VALUES ($1,$2,$3,$4) ON CONFLICT (user_id, email) DO NOTHING"
	_, err := p.db.Exec(query, userID, name, email, segment)
	if err != nil {
		return err
	}

	return nil
}

// Creating a user for authentication
func (p *PostgresStore) CreateUser(email string, hashPassword string, userRole string) error {
	query := `INSERT INTO users (email, password_hash, userRole) VALUES ($1, $2, $3)`
	_, err := p.db.Exec(query, email, hashPassword, userRole)
	if err != nil {
		return err
	}
	return nil
}

// Getting a user for validation
func (p *PostgresStore) GetUser(email string) (*types.User, error) {
	query := `SELECT id, email, password_hash, userRole, status FROM users WHERE email = $1`
	rows := p.db.QueryRow(query, email)
	var u types.User
	var status sql.NullString
	err := rows.Scan(&u.ID, &u.Email, &u.HashPassword, &u.Role, &status)
	if err != nil {
		return nil, err
	}
	if status.Valid {
		u.Status = status.String
	} else {
		u.Status = "active"
	}
	return &u, nil
}

// Fetch Campaigns that are ready to send
func (p *PostgresStore) GetPendingCampaigns() ([]types.Campaign, error) {
	query := `SELECT id, user_id, name, subject, template_file, target_segment, status FROM campaigns WHERE status = 'pending' AND scheduled_at <= NOW()`
	rows, err := p.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var campaigns []types.Campaign
	for rows.Next() {
		var c types.Campaign
		err := rows.Scan(&c.ID, &c.UserID, &c.Name, &c.Subject, &c.TemplateFile, &c.TargetSegment, &c.Status)
		if err != nil {
			continue
		}
		campaigns = append(campaigns, c)
	}
	return campaigns, nil
}

// Updating Campaign Status
func (p *PostgresStore) UpdateCampaignStatus(campaignID int, status string) error {
	query := `UPDATE campaigns SET status = $1 WHERE id = $2`
	_, err := p.db.Exec(query, status, campaignID)
	return err
}

// Delete a recipient
func (p *PostgresStore) DeleteRecipient(userID int, recipientID int) error {
	query := ` DELETE FROM recipients WHERE id = $1 AND user_id = $2`
	result, err := p.db.Exec(query, recipientID, userID)
	if err != nil {
		return err
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return fmt.Errorf("zero rows were deleted! The ID didn't match anything in the database")
	}
	return nil

}

// Log an email event to the permanent ledger

func (p *PostgresStore) LogEmailEvent(userID int, campaignName string, recipientEmail string, status string) error {
	query := `INSERT INTO email_logs (user_id, campaign_name, recipient_email, status) VALUES ($1, $2, $3, $4)`
	_, err := p.db.Exec(query, userID, campaignName, recipientEmail, status)
	if err != nil {
		return err
	}
	return nil
}

// Fetch all email logs for the Analytics tab

func (p *PostgresStore) GetEmailLogs(userID int) ([]types.EmailLog, error) {
	query := `SELECT id, campaign_name, recipient_email, status, sent_at FROM email_logs WHERE user_id = $1 ORDER BY sent_at DESC`
	rows, err := p.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []types.EmailLog

	for rows.Next() {
		var l types.EmailLog
		err := rows.Scan(&l.ID, &l.CampaignName, &l.RecipientEmail, &l.Status, &l.SentAt)
		if err == nil {
			logs = append(logs, l)
		}
	}
	return logs, nil

}

// GetAllUsers fetches all users for the Admin Dashboard
func (p *PostgresStore) GetAllUsers() ([]types.User, error) {
	query := `SELECT id, email, userRole, status, created_at FROM users ORDER BY id ASC`
	rows, err := p.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []types.User
	for rows.Next() {
		var u types.User
		var status sql.NullString
		err := rows.Scan(&u.ID, &u.Email, &u.Role, &status, &u.CreatedAt)
		if err != nil {
			continue
		}
		if status.Valid {
			u.Status = status.String
		} else {
			u.Status = "active"
		}
		users = append(users, u)
	}
	return users, nil
}

// UpdateUserStatus changes a user's status (e.g., active, suspended, banned)
func (p *PostgresStore) UpdateUserStatus(userID int, status string) error {
	query := `UPDATE users SET status = $1 WHERE id = $2`
	_, err := p.db.Exec(query, status, userID)
	return err
}

// GetGlobalStats fetches platform-wide statistics for the Super Admin
func (p *PostgresStore) GetGlobalStats() (types.GlobalStats, error) {
	var stats types.GlobalStats

	// Count total users
	err := p.db.QueryRow(`SELECT COUNT(*) FROM users`).Scan(&stats.TotalUsers)
	if err != nil {
		return stats, err
	}

	// Count global queue (pending or processing campaigns)
	// We count total pending campaigns, or we can count total pending recipients.
	// Since campaigns hold the queue state:
	err = p.db.QueryRow(`SELECT COUNT(*) FROM campaigns WHERE status = 'pending' OR status = 'processing'`).Scan(&stats.GlobalQueue)
	if err != nil {
		return stats, err
	}

	// Count total sent emails globally
	err = p.db.QueryRow(`SELECT COUNT(*) FROM email_logs WHERE status = 'sent'`).Scan(&stats.TotalSent)
	if err != nil {
		return stats, err
	}

	// Count total failed emails globally
	err = p.db.QueryRow(`SELECT COUNT(*) FROM email_logs WHERE status = 'failed'`).Scan(&stats.TotalFailures)
	if err != nil {
		return stats, err
	}

	return stats, nil
}

// GetGlobalEmailLogs fetches the recent activity feed across the entire platform
func (p *PostgresStore) GetGlobalEmailLogs(limit int) ([]types.GlobalEmailLog, error) {
	query := `
		SELECT e.id, u.email as sender_email, e.campaign_name, e.recipient_email, e.status, e.sent_at 
		FROM email_logs e 
		JOIN users u ON e.user_id = u.id 
		ORDER BY e.sent_at DESC 
		LIMIT $1
	`
	rows, err := p.db.Query(query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []types.GlobalEmailLog
	for rows.Next() {
		var l types.GlobalEmailLog
		err := rows.Scan(&l.ID, &l.SenderEmail, &l.CampaignName, &l.RecipientEmail, &l.Status, &l.SentAt)
		if err == nil {
			logs = append(logs, l)
		}
	}
	return logs, nil
}
