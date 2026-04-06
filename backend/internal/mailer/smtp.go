package mailer

import (
	"fmt"
	"net/smtp"
)

type Mailer struct {
	Host     string `json:"host"`
	Port     int    `json:"port"`
	Username string `json:"username"`
	Password string `json:"password"`
}

func NewMailer(host string, port int, username string, password string) *Mailer {
	return &Mailer{
		Host:     host,
		Port:     port,
		Username: username,
		Password: password,
	}
}
func (m *Mailer) SendEmail(to string, subject string, body string) error {
	addr:=fmt.Sprintf("%s:%d",m.Host,m.Port)

	// Set up the authentication mechanism
	auth:=smtp.PlainAuth("",m.Username,m.Password,m.Host)

	// Craft the exact SMTP raw message format
	header:=fmt.Sprintf("To:%s\r\n",to)
	header+= fmt.Sprintf("Subject:%s\r\n",subject)
	header += "MIME-version: 1.0;\r\n"
	header += "Content-Type: text/html; charset=\"UTF-8\";\r\n"

	header += "\r\n"

	msg:=[]byte(header +body)

	// Fire the email to user
	err:=smtp.SendMail(addr,auth,m.Username,[]string{to},msg)
	
	if err!=nil {
		return fmt.Errorf("failed to send mail to %s:%w",to,err)
	}
	return nil
}