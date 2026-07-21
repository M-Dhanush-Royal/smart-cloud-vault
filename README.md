# smart-cloud-vault
A secure cloud-based file storage and management system built using Node.js, Express.js, MongoDB, AWS S3, HTML, CSS, and JavaScript. Users can upload, organize, manage, and access files from anywhere through a modern dashboard interface.

 Features

 Authentication

User Signup

User Login

Secure Session Management

Logout

 Cloud File Storage

Upload Files to AWS S3

Download Files

Preview Files

Open Files in Browser

Delete Files

Rename Files

Folder Management

Create Folder

Rename Folder

Delete Folder

Store Files Inside Folders

 Dashboard Analytics

Total Files Count

Total Folders Count

Storage Usage

Recent Activity

Search & Filter

Search Files

Filter Images

Filter PDFs

Filter Documents

Filter ZIP Files

Profile Management

Profile Name

Profile Image

User Role

Modern UI

Responsive Dashboard

Sidebar Navigation

Drag & Drop Upload

Dark Theme Interface

Tech Stack

Frontend

HTML5

CSS3

JavaScript

Backend

Node.js

Express.js

Database

MongoDB Atlas

Cloud Storage

AWS S3

Authentication

JWT

Bcrypt.js

Other Packages

Multer

Multer-S3

Mongoose

Cors

Dotenv

Project Structure

smart-cloud-study-vault/

│

├── models/

│   ├── User.js

│   ├── File.js

│   └── Folder.js

│

├── public/

│   ├── admin.html

│   ├── admin.js

│   ├── auth.css

│   ├── auth.js

│   ├── dashboard.html

│   ├── dashboard.css

│   ├── dashboard.js

│   ├── files.html

│   ├── files.js

│   ├── folder.html

│   ├── folder.js

│   ├── login.html

│   ├── signup.html

│   ├── settings.html

│   └── settings.js

│

├── .env

├── .env.example

├── .gitignore

├── package.json

├── package-lock.json

└── server.js

Installation

1. Clone Repository

git clone https://github.com/yourusername/smart-cloud-study-vault.git

2. Open Project

cd smart-cloud-study-vault

3. Install Dependencies

npm install

Environment Variables



Create a .env file in the root directory.



PORT=3000



MONGO_URI=your_mongodb_atlas_connection



AWS_ACCESS_KEY=your_access_key

AWS_SECRET_KEY=your_secret_key

AWS_REGION=ap-south-1

S3_BUCKET=your_bucket_name



JWT_SECRET=your_jwt_secret



GOOGLE_CLIENT_ID=your_google_client_id

GOOGLE_CLIENT_SECRET=your_google_client_secret

GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

AWS S3 Setup

Create Bucket

Login to AWS Console

Open S3 Service

Create Bucket

Choose Region

Create Bucket



Example:



S3_BUCKET=smart-cloud-vault-storage

IAM Permissions



Attach:



AmazonS3FullAccess



to your IAM User.



MongoDB Atlas Setup

Create MongoDB Atlas Account

Create Cluster

Create Database User

Allow Network Access

Copy Connection String



Example:



MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/cloudvault

Run Project


Start Server

node server.js

or

npm start

Expected Output:

Server running on port 3000

MongoDB Connected

Application Pages

Page	Description

/signup.html	User Registration

/login.html	User Login

/dashboard.html	Dashboard

/files.html	File Management

/folder.html	Folder Management

/settings.html	User Settings

/admin.html	Admin Panel

Dashboard Modules

Dashboard

Upload Files

Storage Statistics

Recent Activity

Files

View All Files

Search Files

Preview Files

Download Files

Delete Files

Folders

Create Folder

Rename Folder

Delete Folder

Folder-Based Uploads

Settings

Profile Information

Profile Image

User Preferences

Security Features

Password Hashing using Bcrypt

JWT Authentication

Protected Routes

AWS Secure Storage

MongoDB Data Protection

Future Enhancements

AI File Classification

OCR Document Reading

File Sharing Links

Team Collaboration

Activity Logs

Version Control

Two-Factor Authentication

AI Search Assistant

Voice Commands

Smart File Recommendations

Developer



Muddakka Gari Dhanush Royal



Computer Science & Engineering


RL Jalappa Institute of Technology (RLJIT)

Graduation Year: 2027

License

This project is developed for educational, learning, and academic purposes. It can be freely modified and used for educational projects.




## Architecture Diagram

![Cloud Architecture](Smart%20Cloud%20Study%20Vault%20Architecture.drawio.png)

## Architecture Overview

This project follows a 3-tier cloud architecture.

### Client Tier
- HTML
- CSS
- JavaScript
- Users access the application through a web browser.

### Application Tier
- AWS Load Balancer
- Node.js + Express.js servers
- Authentication using JWT and bcrypt

### Data Tier
- Redis Cache for frequently accessed data
- MongoDB Atlas for user data and file metadata
- AWS S3 for storing uploaded files

## Scaling

The AWS Load Balancer distributes incoming traffic across multiple application servers. Additional servers can be added to handle increased user traffic.

## Caching

Redis stores frequently accessed data to reduce database load and improve application performance.

