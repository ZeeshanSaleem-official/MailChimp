package postgres

import (
	"database/sql"

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
	if segment == "" {
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
	query := "INSERT INTO recipients (user_id,name, email, segment) VALUES ($1,$2,$3,$4) ON CONFLICT (email) DO NOTHING"
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
	query := `SELECT id, email, password_hash, userRole FROM users WHERE email = $1`
	rows := p.db.QueryRow(query, email)
	var u types.User
	err := rows.Scan(&u.ID, &u.Email, &u.HashPassword, &u.Role)
	if err != nil {
		return nil, err
	}
	return &u, nil
}
