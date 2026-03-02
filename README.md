# Jashoda Jewellers - Backend API

Backend API service for Jashoda Jewellers platform built with Node.js, Express, and PostgreSQL.

## 📋 Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Default Admin Credentials](#default-admin-credentials)
- [Authentication](#authentication)
- [Technologies Used](#technologies-used)
- [Available Scripts](#available-scripts)
- [Security Features](#security-features)
- [Response Format](#response-format)

## ✨ Features

- ✅ User authentication with JWT
- ✅ User management (CRUD operations)
- ✅ Pagination and filtering
- ✅ Input validation
- ✅ Error handling middleware
- ✅ Logging system with Winston
- ✅ Database migrations and seeds
- ✅ RESTful API design
- ✅ Password hashing with bcrypt
- ✅ Soft delete functionality
- ✅ Health check endpoint

## 📁 Project Structure

```
Jashoda BE/
├─ migrations/                ← Knex migrations
│  └─ 20240101000001_create_users_table.js
├─ seeds/                     ← Knex seeds
│  └─ 001_default_admin.js
├─ src/
│  ├─ app/                    ← Application modules
│  │  ├─ auth/
│  │  │  ├─ auth.controller.js
│  │  │  ├─ auth.service.js
│  │  │  ├─ auth.routes.js
│  │  │  └─ auth.model.js
│  │  ├─ users/
│  │  │  ├─ user.controller.js
│  │  │  ├─ user.service.js
│  │  │  ├─ user.routes.js
│  │  │  ├─ user.model.js
│  │  │  └─ index.js
│  │  └─ index.js             ← Module aggregator
│  ├─ config/
│  │  ├─ env.js               ← Environment variables
│  │  ├─ knex.js              ← Knex configuration
│  │  └─ app.js                ← App-level config
│  ├─ db/
│  │  ├─ knex.js              ← Knex instance
│  │  ├─ connection.js         ← DB connection handler
│  │  └─ transactions.js      ← Transaction utilities
│  ├─ middlewares/
│  │  ├─ auth.middleware.js   ← JWT authentication
│  │  ├─ error.middleware.js  ← Error handling
│  │  └─ validate.middleware.js ← Input validation
│  ├─ routes/
│  │  └─ v1/
│  │     ├─ auth.routes.js
│  │     └─ index.js           ← API versioning
│  ├─ utils/
│  │  ├─ logger.js            ← Winston logger
│  │  ├─ response.js          ← Response helpers
│  │  ├─ helpers.js           ← Utility functions
│  │  └─ jwt.js               ← JWT utilities
│  ├─ constants/
│  │  └─ messages.js           ← Message constants
│  └─ index.js                ← Express app setup
├─ app.js                     ← Server entry point
├─ knexfile.js                ← Knex configuration file
├─ package.json
├─ .env                       ← Environment variables (create this)
└─ README.md
```

## 🔧 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v12 or higher) - [Download](https://www.postgresql.org/download/)
- **npm** or **yarn** - Comes with Node.js

## 📦 Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd "Jashoda BE"
```

2. **Install dependencies:**
```bash
npm install
```

## ⚙️ Configuration

1. **Create a `.env` file in the root directory:**

Copy the following template and update with your values:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_CLIENT=pg
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=jashoda_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Password Hashing Configuration
BCRYPT_SALT_ROUNDS=10

# Application
APP_NAME=Jashoda Jewellers API
APP_URL=http://localhost:3000
```

2. **Update the database credentials** in `.env` file according to your PostgreSQL setup.

**Important:** 
- Change `JWT_SECRET` to a strong, random string in production
- Use a strong password for `DB_PASSWORD`
- Adjust `BCRYPT_SALT_ROUNDS` (recommended: 10-12)

## 🗄️ Database Setup

1. **Create the PostgreSQL database:**

```sql
CREATE DATABASE jashoda_db;
```

Or using psql command line:
```bash
psql -U postgres -c "CREATE DATABASE jashoda_db;"
```

2. **Run migrations to create tables:**
```bash
npm run migrate
```

3. **Run seeds to create default admin user:**
```bash
npm run seed
```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```
This will start the server with nodemon for auto-reloading on file changes.

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

You should see:
```
🚀 Jashoda Jewellers API is running on port 3000
📍 Environment: development
🌐 Server URL: http://localhost:3000
📚 API Base URL: http://localhost:3000/api/v1
```

## 📡 API Endpoints

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication

#### Login
- **POST** `/api/v1/auth/login`
- **Description:** Authenticate user and get JWT token
- **Body:**
```json
{
  "email": "admin@jashoda.com",
  "password": "Admin@123"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "Admin User",
      "email": "admin@jashoda.com",
      "username": "admin",
      "first_name": "Admin",
      "last_name": "User",
      "status": "active"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Users

#### Get All Users (Protected)
- **GET** `/api/v1/users`
- **Description:** Get paginated list of users
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:**
  - `page` (optional, default: 1) - Page number
  - `limit` (optional, default: 10) - Items per page
  - `status` (optional) - Filter by status: `active`, `inactive`, `suspended`
  - `search` (optional) - Search in name, email, username, first_name, last_name
  - `sortBy` (optional, default: `created_at`) - Field to sort by
  - `sortOrder` (optional, default: `desc`) - Sort order: `asc` or `desc`
- **Example:** `/api/v1/users?page=1&limit=10&status=active&search=admin`

#### Get User by ID (Protected)
- **GET** `/api/v1/users/:id`
- **Description:** Get user details by ID
- **Headers:** `Authorization: Bearer <token>`

#### Create User (Public)
- **POST** `/api/v1/users/register`
- **Description:** Register a new user
- **Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "username": "johndoe",
  "first_name": "John",
  "last_name": "Doe",
  "password": "SecurePass123",
  "status": "active",
  "address": "123 Main St",
  "country": "India",
  "city": "Mumbai",
  "state": "Maharashtra"
}
```

#### Update User (Protected)
- **PUT** `/api/v1/users/:id`
- **Description:** Update user information
- **Headers:** `Authorization: Bearer <token>`
- **Body:** (all fields optional except those being updated)
```json
{
  "name": "John Updated",
  "status": "inactive",
  "city": "Delhi"
}
```

#### Delete User (Protected)
- **DELETE** `/api/v1/users/:id`
- **Description:** Soft delete a user
- **Headers:** `Authorization: Bearer <token>`

### Health Check
- **GET** `/health`
- **Description:** Check server and database status
- **Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected"
}
```

## 👤 Default Admin Credentials

After running the seed, you can login with:

- **Email:** `admin@jashoda.com`
- **Password:** `Admin@123`

**⚠️ Important:** Change the default admin password after first login in production!

## 🔐 Authentication

### How to Use JWT Tokens

1. **Login** to get a token:
```bash
POST /api/v1/auth/login
{
  "email": "admin@jashoda.com",
  "password": "Admin@123"
}
```

2. **Use the token** in subsequent requests:
```bash
GET /api/v1/users
Headers: {
  "Authorization": "Bearer <your-token-here>"
}
```

3. **Token Expiration:** Tokens expire after the time specified in `JWT_EXPIRES_IN` (default: 7 days)

## 📊 User Table Schema

The users table includes the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer | Primary key (auto-increment) |
| `name` | String(255) | Full name (required) |
| `email` | String(255) | Email address (required, unique) |
| `username` | String(100) | Username (required, unique) |
| `first_name` | String(100) | First name (required) |
| `last_name` | String(100) | Last name (required) |
| `password` | String(255) | Hashed password (required) |
| `status` | Enum | User status: `active`, `inactive`, `suspended` (default: `active`) |
| `address` | Text | Address (optional) |
| `country` | String(100) | Country (optional) |
| `city` | String(100) | City (optional) |
| `state` | String(100) | State (optional) |
| `created_at` | Timestamp | Creation timestamp |
| `updated_at` | Timestamp | Last update timestamp |
| `deleted_at` | Timestamp | Soft delete timestamp (nullable) |

## 🛠️ Technologies Used

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Knex.js** - SQL query builder and migrations
- **JWT (jsonwebtoken)** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **Winston** - Logging
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the server in production mode |
| `npm run dev` | Start the server in development mode with nodemon |
| `npm run migrate` | Run database migrations |
| `npm run migrate:rollback` | Rollback the last migration |
| `npm run seed` | Run database seeds |
| `npm run migrate:make <name>` | Create a new migration file |
| `npm run seed:make <name>` | Create a new seed file |

## 🔒 Security Features

- ✅ Password hashing with bcrypt (configurable salt rounds)
- ✅ JWT token-based authentication
- ✅ Input validation with express-validator
- ✅ SQL injection protection (via Knex)
- ✅ Helmet.js for security headers
- ✅ CORS configuration
- ✅ Environment variable protection
- ✅ Error handling without exposing sensitive information
- ✅ Soft delete functionality

## 📝 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  },
  "meta": {
    // Additional metadata (e.g., pagination)
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": {
    // Error details (optional)
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Validation Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format",
      "value": "invalid-email"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🐛 Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `pg_isready` or `psql -U postgres`
- Check database credentials in `.env`
- Ensure database exists: `psql -U postgres -l`

### Migration Issues
- Check if database exists
- Verify connection settings in `.env`
- Try rolling back and re-running: `npm run migrate:rollback && npm run migrate`

### Port Already in Use
- Change `PORT` in `.env` file
- Or kill the process using the port

### JWT Token Issues
- Verify `JWT_SECRET` is set in `.env`
- Check token expiration time
- Ensure token is included in `Authorization` header as `Bearer <token>`

## 📄 License

This project is proprietary software for Jashoda Jewellers.

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📞 Support

For issues or questions, please contact the development team.

---

**Built with ❤️ for Jashoda Jewellers**
