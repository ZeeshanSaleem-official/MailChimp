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
	query := `SELECT id, email, password_hash, userRole, status, daily_quota FROM users WHERE email = $1`
	rows := p.db.QueryRow(query, email)
	var u types.User
	var status sql.NullString
	err := rows.Scan(&u.ID, &u.Email, &u.HashPassword, &u.Role, &status, &u.DailyQuota)
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

// Getting a user by ID
func (p *PostgresStore) GetUserByID(id int) (*types.User, error) {
	query := `SELECT id, email, password_hash, userRole, status, daily_quota FROM users WHERE id = $1`
	rows := p.db.QueryRow(query, id)
	var u types.User
	var status sql.NullString
	err := rows.Scan(&u.ID, &u.Email, &u.HashPassword, &u.Role, &status, &u.DailyQuota)
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
	query := `
		SELECT c.id, c.user_id, c.name, c.subject, c.template_file, c.target_segment, c.status 
		FROM campaigns c
		JOIN users u ON c.user_id = u.id
		WHERE c.status = 'pending' 
		  AND c.scheduled_at <= NOW() 
		  AND (u.status = 'active' OR u.status IS NULL)
	`
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

// InitializeCampaignQueue populates the queue for a new campaign
func (p *PostgresStore) InitializeCampaignQueue(campaignID int, userID int, segment string) error {
	// Only insert if they don't already exist for this campaign
	query := `
		INSERT INTO campaign_queue (campaign_id, recipient_email, status)
		SELECT $1, email, 'pending'
		FROM recipients
		WHERE user_id = $2 
		AND ($3 = 'all' OR $3 = '' OR segment = $3)
		ON CONFLICT (campaign_id, recipient_email) DO NOTHING
	`
	_, err := p.db.Exec(query, campaignID, userID, segment)
	return err
}

// GetPendingQueueCount returns the number of pending emails for a campaign
func (p *PostgresStore) GetPendingQueueCount(campaignID int) (int, error) {
	query := `SELECT COUNT(*) FROM campaign_queue WHERE campaign_id = $1 AND status = 'pending'`
	var count int
	err := p.db.QueryRow(query, campaignID).Scan(&count)
	return count, err
}

// UpdateQueueEmailStatus updates the status of a specific email in the queue
func (p *PostgresStore) UpdateQueueEmailStatus(campaignID int, email string, status string) error {
	query := `UPDATE campaign_queue SET status=$1 WHERE campaign_id = $2 AND recipient_email=$3`
	_, err := p.db.Exec(query, status, campaignID, email)
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
	query := `SELECT id, email, userRole, status, daily_quota, created_at FROM users ORDER BY id ASC`
	rows, err := p.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []types.User
	for rows.Next() {
		var u types.User
		var status sql.NullString
		err := rows.Scan(&u.ID, &u.Email, &u.Role, &status, &u.DailyQuota, &u.CreatedAt)
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

// UpdateUserRole changes a user's role (e.g., user, admin)
func (p *PostgresStore) UpdateUserRole(userID int, role string) error {
	// In the DB it is called userRole, but let's make sure:
	// db.go: userRole VARCHAR(150) NOT NULL
	query := `UPDATE users SET userRole = $1 WHERE id = $2`
	_, err := p.db.Exec(query, role, userID)
	return err
}

// UpdateUserQuota updates the daily sending limit for a user
func (p *PostgresStore) UpdateUserQuota(userID int, quota int) error {
	query := `UPDATE users SET daily_quota = $1 WHERE id = $2`
	_, err := p.db.Exec(query, quota, userID)
	return err
}

// GetDailySentCount fetches the total emails sent by a user today
func (p *PostgresStore) GetDailySentCount(userID int) (int, error) {
	query := `SELECT COUNT(*) FROM email_logs WHERE user_id = $1 AND sent_at >= CURRENT_DATE`
	var count int
	err := p.db.QueryRow(query, userID).Scan(&count)
	return count, err
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

// GetGlobalEmailLogsPaginated fetches paginated activity feed across the entire platform
func (p *PostgresStore) GetGlobalEmailLogsPaginated(page int, limit int, search string) ([]types.GlobalEmailLog, int, error) {
	offset := (page - 1) * limit
	var totalCount int
	var logs []types.GlobalEmailLog

	countQuery := `
		SELECT COUNT(*) 
		FROM email_logs e
		JOIN users u ON e.user_id = u.id
		WHERE ($1 = '' OR e.recipient_email ILIKE '%' || $1 || '%' OR u.email ILIKE '%' || $1 || '%')
	`
	err := p.db.QueryRow(countQuery, search).Scan(&totalCount)
	if err != nil {
		return nil, 0, err
	}

	query := `
		SELECT e.id, u.email as sender_email, e.campaign_name, e.recipient_email, e.status, e.sent_at 
		FROM email_logs e 
		JOIN users u ON e.user_id = u.id 
		WHERE ($1 = '' OR e.recipient_email ILIKE '%' || $1 || '%' OR u.email ILIKE '%' || $1 || '%')
		ORDER BY e.sent_at DESC 
		LIMIT $2 OFFSET $3
	`
	rows, err := p.db.Query(query, search, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	for rows.Next() {
		var l types.GlobalEmailLog
		err := rows.Scan(&l.ID, &l.SenderEmail, &l.CampaignName, &l.RecipientEmail, &l.Status, &l.SentAt)
		if err == nil {
			logs = append(logs, l)
		}
	}
	return logs, totalCount, nil
}

// GetUsersPaginated fetches users for the Admin Dashboard with pagination and search
func (p *PostgresStore) GetUsersPaginated(page int, limit int, search string) ([]types.User, int, error) {
	offset := (page - 1) * limit
	var totalCount int
	var users []types.User

	countQuery := `SELECT COUNT(*) FROM users WHERE ($1 = '' OR email ILIKE '%' || $1 || '%')`
	err := p.db.QueryRow(countQuery, search).Scan(&totalCount)
	if err != nil {
		return nil, 0, err
	}

	query := `
		SELECT id, email, userRole, status, daily_quota, created_at 
		FROM users 
		WHERE ($1 = '' OR email ILIKE '%' || $1 || '%')
		ORDER BY id ASC 
		LIMIT $2 OFFSET $3
	`
	rows, err := p.db.Query(query, search, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	for rows.Next() {
		var u types.User
		var status sql.NullString
		err := rows.Scan(&u.ID, &u.Email, &u.Role, &status, &u.DailyQuota, &u.CreatedAt)
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
	return users, totalCount, nil
}

// GetEngineStatus fetches the global kill switch status
func (p *PostgresStore) GetEngineStatus() (string, error) {
	query := `SELECT setting_value FROM system_settings WHERE setting_key = 'engine_status'`
	var status string
	err := p.db.QueryRow(query).Scan(&status)
	if err != nil {
		if err == sql.ErrNoRows {
			return "running", nil // default
		}
		return "", err
	}
	return status, nil
}

// UpdateEngineStatus updates the global kill switch status
func (p *PostgresStore) UpdateEngineStatus(status string) error {
	query := `
		INSERT INTO system_settings (setting_key, setting_value) 
		VALUES ('engine_status', $1) 
		ON CONFLICT (setting_key) 
		DO UPDATE SET setting_value = EXCLUDED.setting_value
	`
	_, err := p.db.Exec(query, status)
	return err
}
