# Quote Management System

## Overview

Quote Management System is a web-based application designed to manage the quotation workflow between customers, sales users, pricing users, approvers, and managers.

The system helps users create, manage, review, and approve quotation records in a structured way. It is intended to support the quotation process from collecting customer request information, preparing quote details, calculating quotation data, and managing approval status.

This project is built as a full-stack web application with a separated backend and frontend architecture.

---

## Main Objectives

- Manage quotation records in one system.
- Support quote creation, update, and tracking.
- Organize quotation-related information clearly.
- Provide backend APIs for quotation setup and business logic.
- Provide a frontend interface for users to interact with the system.
- Separate backend and frontend code for easier development and maintenance.

---

## Tech Stack

### Backend

- Node.js
- Express.js
- MongoDB / Mongoose
- dotenv
- RESTful API structure

### Frontend

- React.js
- JavaScript
- HTML / CSS
- API integration with backend services

---

## Project Structure

```txt
QUOTE_MANAGEMENT_SYSTEM
│
├── backend
│   │
│   ├── node_modules
│   │
│   ├── src
│   │   │
│   │   ├── config
│   │   │   └── Database and environment configuration
│   │   │
│   │   ├── middlewares
│   │   │   └── Middleware functions such as authentication, validation, and error handling
│   │   │
│   │   ├── modules
│   │   │   └── Main business modules of the backend system
│   │   │
│   │   ├── routes
│   │   │   └── API route definitions
│   │   │
│   │   └── system
│   │       └── Shared system-level utilities and configurations
│   │
│   ├── .env
│   ├── app.js
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
│
├── frontend 
│
├── .gitignore
└── README.md