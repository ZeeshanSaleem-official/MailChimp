package types

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
