# FitTrack Backend API

## Setup Instructions

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- Redis 7+ (optional)

### Installation

```bash
npm install
cp .env.example .env
# Update .env with your credentials
npm run migrate
npm run dev
```

### Using Docker

```bash
docker-compose up -d
```

## API Endpoints

### Auth
- `POST /api/auth/signup` - Register
- `POST /api/auth/login` - Login
- `POST /api/auth/verify-email/:token` - Verify email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password
- `POST /api/auth/refresh` - Refresh JWT token

### Users
- `GET /api/users/me` - Get profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/preferences` - Get preferences
- `PUT /api/users/preferences` - Update preferences

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/day/:date` - Get tasks for date
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:taskId` - Update task
- `DELETE /api/tasks/:taskId` - Delete task

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/stats` - Get stats
- `GET /api/admin/recent-signups` - Recent signups
- `GET /api/admin/top-streaks` - Top streaks
- `PUT /api/admin/users/:userId/suspend` - Suspend user
- `PUT /api/admin/users/:userId/activate` - Activate user
- `GET /api/admin/users/:userId` - User details

## Security Features

✅ bcryptjs password hashing
✅ JWT authentication with refresh tokens
✅ CORS protection
✅ Helmet security headers
✅ Input validation & sanitization
✅ SQL injection prevention
✅ Email verification tokens
✅ Password reset tokens with expiry
