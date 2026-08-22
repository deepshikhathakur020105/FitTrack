# FitTrack Backend API

## Setup Instructions

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- Redis 7+ (optional, for caching)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your credentials

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

### Using Docker

```bash
docker-compose up -d
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/verify-email/:token` - Verify email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password
- `POST /api/auth/refresh` - Refresh JWT token

### Users
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/preferences` - Get preferences
- `PUT /api/users/preferences` - Update preferences

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/day/:date` - Get tasks for a specific day
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:taskId` - Update task
- `DELETE /api/tasks/:taskId` - Delete task
- `DELETE /api/tasks/day/:date` - Delete all tasks for a day

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/stats` - Get dashboard stats
- `GET /api/admin/recent-signups` - Get recent signups
- `GET /api/admin/top-streaks` - Get top streaks
- `PUT /api/admin/users/:userId/suspend` - Suspend user
- `PUT /api/admin/users/:userId/activate` - Activate user
- `GET /api/admin/users/:userId` - Get user details

## Security Features

- ✅ bcryptjs password hashing
- ✅ JWT authentication with refresh tokens
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Input validation & sanitization
- ✅ SQL injection prevention (prepared statements)
- ✅ Rate limiting ready (implement with express-rate-limit)
- ✅ Email verification tokens
- ✅ Password reset tokens with expiry

## Next Steps

1. Update `process.env.JWT_SECRET` with a strong random value
2. Configure email credentials
3. Set up database backups
4. Implement rate limiting
5. Add request logging
6. Deploy to production server
