GoLang Email Dispatcher (MailChimp Engine) 🚀

A robust, enterprise-grade email dispatcher system built with Go (Golang) and React. This project demonstrates advanced backend architecture, concurrency, and full-stack integration.

Developed by Zeeshan Saleem (L1F22BSSE0031) as part of a BSSE software engineering initiative.

🌟 Features

Concurrent Workers: Utilizes Go's powerful Goroutines and Channels to process and send emails concurrently, ensuring high performance.

Persistent Storage: Integrated with PostgreSQL to safely store recipient data, preventing duplicate sends and tracking state.

Dynamic Segmentation: Target specific user groups (e.g., "premium" vs "general") dynamically via SQL filtering.

Template Engine: Uses Go's html/template to dynamically inject user and campaign data into customized HTML emails.

Resilient Error Handling: Automatically catches SMTP failures, prevents app crashes, and updates the database status to failed for future retries.

Background Scheduling: Uses gocron to run automated, scheduled campaigns in the background without blocking the main server.

REST API & React Dashboard: Serves real-time campaign statistics and user statuses to a modern React frontend via JSON.

🛠️ Tech Stack

Backend: Go (Golang)

Database: PostgreSQL (with database/sql & pq driver)

Frontend: React.js, Tailwind CSS, Lucide Icons

Local SMTP Testing: Mailpit

Configuration: YAML (koanf / viper)

Task Scheduling: gocron

🚀 How to Run (Local Environment)

1. Prerequisites

Install Go

Install and run PostgreSQL

Install and run Mailpit (via Docker or binaries) for capturing test emails on port 1025.

2. Configuration

Create a local.yml file in the root directory (this file is git-ignored for security):

env: "local"
storage_path: "postgres://postgres:yourpassword@localhost:5432/yourdb?sslmode=disable"


3. Run the Backend

go run .


The server will initialize the database, start the background scheduler, and open the REST API on http://localhost:8080.

4. API Endpoints

GET /api/recipients - Returns a JSON array of all recipients and their current email delivery status.