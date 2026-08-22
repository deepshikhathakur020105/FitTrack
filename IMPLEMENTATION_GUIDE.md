# FitTrack - Full Stack Implementation Guide

## 🚀 Project Overview

FitTrack is an elite fitness platform with a modern full-stack architecture:

- **Backend**: Node.js + Express + MySQL + JWT Authentication
- **Frontend**: React + Vite + Zustand + Tailwind CSS
- **Database**: MySQL with optimized schema
- **Email**: Nodemailer for verification & password reset
- **Deployment**: Docker + GitHub Actions

---

## 📋 Phase 1: Local Setup & Development

### Backend Setup

```bash
cd backend
npm install

# Setup database
# Make sure MySQL is running, then:
mysql -u root -p < database/schema.sql

# Create .env file
cp .env.example .env
# Update with your credentials

# Run migrations
npm run migrate

# Start development server
npm run dev
# Server runs on http://localhost:5000
```

### Frontend Setup

```bash
cd frontend
npm install

# Create .env file
cp .env.example .env

# Start development server
npm run dev
# App runs on http://localhost:3000
```

### Using Docker (Recommended)

```bash
# From backend directory
docker-compose up -d

# Database will be initialized automatically
# MySQL: localhost:3306
# Redis: localhost:6379
# API: localhost:5000
```

---

## 🔐 Security Implementation

### ✅ Features Implemented

#### 1. Password Security
- Passwords hashed with bcryptjs (salt rounds: 12)
- Minimum 6 characters enforced
- Never stored in plaintext
- Secure comparison preventing timing attacks

```javascript
// Backend auth.js
const passwordHash = await bcrypt.hash(password, 12);
const isValidPassword = await bcrypt.compare(password, user.password_hash);
```

#### 2. JWT Authentication
- Access tokens (1 hour expiry)
- Refresh tokens (7 days expiry)
- Token refresh middleware
- Automatic token rotation

```javascript
// Frontend api.js
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Automatically refresh token
      const { data } = await refreshTokens();
      localStorage.setItem('accessToken', data.accessToken);
      return api(originalRequest);
    }
  }
);
```

#### 3. Email Verification
- Email tokens with 24-hour expiry
- Token verification required before account activation
- Resend verification email capability

```sql
CREATE TABLE email_tokens (
  id VARCHAR(36) PRIMARY KEY,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT FALSE
);
```

#### 4. Password Reset
- Secure reset tokens (32-byte random)
- 24-hour expiry window
- One-time use only
- Email notification

#### 5. CORS & Security Headers
- Helmet.js for security headers
- CORS restricted to frontend origin
- XSS protection
- Content Security Policy

```javascript
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
```

#### 6. Input Validation
- Express-validator for all endpoints
- Email format validation
- Password strength requirements
- SQL injection prevention (prepared statements)

```javascript
const signupValidations = [
  body('name').trim().notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 })
];
```

#### 7. Protected Routes
- Admin middleware checks role
- User ownership verification
- Soft deletes for user accounts

```javascript
router.use(authMiddleware, adminMiddleware);
// Only accessible by admins with valid JWT
```

---

## 🏗️ Database Architecture

### Schema Highlights

1. **Users Table**: Core authentication
   - UUID primary key
   - Email unique constraint
   - Hashed password storage
   - Role-based access (user/admin)
   - Soft delete support

2. **User Profiles**: Extended user data
   - Body measurements
   - Health information
   - Preferences
   - Activity level

3. **Tasks Table**: Daily planner
   - Composite index on (user_id, task_date)
   - Category enumeration
   - Completion tracking

4. **Streaks Table**: Cached calculations
   - Current streak (updated on login)
   - Longest streak (historical)
   - Prevents expensive recalculation

5. **Login Activity**: Audit trail
   - Unique constraint per user per day
   - Used for streak calculation
   - Performance indexed

### Indexes Strategy

```sql
-- Frequently filtered columns
INDEX idx_email (email)              -- Auth queries
INDEX idx_user_date (user_id, task_date) -- Daily tasks
INDEX idx_is_completed (is_completed)    -- Stats queries
INDEX idx_role (role)                -- Admin filtering
```

---

## 🎯 Features Implementation

### 1. Authentication Flow

#### Signup
```
1. User submits: name, email, password, goal
2. Validation: email format, password strength
3. Check: email doesn't exist
4. Hash: password with bcrypt
5. Create: user, profile, preferences, streaks tables
6. Send: verification email with token
7. Response: user can now verify email
```

#### Login
```
1. User submits: email, password
2. Find: user by email
3. Verify: password against hash
4. Check: account active status
5. Record: login activity for streak
6. Generate: JWT tokens
7. Response: access & refresh tokens
```

#### Email Verification
```
1. User receives: verification email link
2. Link: /verify-email/:token
3. Validate: token exists, not expired, not used
4. Update: user.is_email_verified = TRUE
5. Mark: token as used
```

#### Password Reset
```
1. User submits: email
2. Generate: reset token (32-byte random)
3. Store: token with 24h expiry
4. Send: reset email with link
5. User: clicks link, submits new password
6. Validate: token, new password strength
7. Update: password hash, mark token as used
```

### 2. Task Management

```javascript
// Create task
POST /api/tasks
{
  title: "Morning Yoga",
  category: "workout",
  scheduled_time: "07:00",
  duration_min: 30,
  task_date: "2024-08-22"
}

// Get today's tasks
GET /api/tasks/day/2024-08-22

// Mark complete
PUT /api/tasks/:taskId
{ is_completed: true }

// Delete task
DELETE /api/tasks/:taskId
```

### 3. Streak Calculation

```javascript
// Automatic on login
const updateStreak = async (userId) => {
  // Get login dates (last 30 days)
  const dates = await getLoginDates(userId);
  
  // Calculate current streak
  let streak = 0;
  for (const date of dates) {
    if (isConsecutiveDay(date)) {
      streak++;
    } else {
      break;
    }
  }
  
  // Update streaks table
  await updateStreakInDB(userId, streak);
};
```

### 4. Admin Dashboard

```javascript
// User management
GET /api/admin/users?page=1&limit=20&search=john
GET /api/admin/users/:userId
PUT /api/admin/users/:userId/suspend
PUT /api/admin/users/:userId/activate

// Statistics
GET /api/admin/stats
// Returns: total_users, active_today, avg_streak, etc.

GET /api/admin/recent-signups
GET /api/admin/top-streaks
```

---

## 🎨 Frontend Architecture

### State Management (Zustand)

```javascript
// useAuthStore
- signup(name, email, password, goal)
- login(email, password)
- logout()
- verifyEmail(token)
- forgotPassword(email)
- resetPassword(token, password)

// useUserStore
- loadProfile()
- updateProfile(data)
- loadPreferences()
- updatePreferences(data)

// useTaskStore
- loadTasksForDay(date)
- createTask(data)
- updateTask(id, updates)
- deleteTask(id)
- clearDay(date)
```

### Component Structure

```
src/
├── components/
│   ├── Toast.jsx           # Notifications
│   ├── Loading.jsx         # Loaders & Skeleton
│   ├── ErrorBoundary.jsx   # Error handling
│   └── ProtectedRoute.jsx  # Auth guard
├── pages/
│   ├── LoginPage.jsx
│   ├── SignupPage.jsx
│   └── DashboardPage.jsx
├── services/
│   ├── api.js              # Axios instance
│   └── api-service.js      # API calls
├── store/
│   ├── authStore.js        # Auth state
│   └── taskStore.js        # Task state
├── styles/
│   └── globals.css         # Design tokens
└── App.jsx                 # Router setup
```

### API Client with Interceptors

```javascript
// Automatic token refresh
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        // Refresh tokens
        const { data } = await api.post('/auth/refresh', { refreshToken });
        // Store new tokens
        localStorage.setItem('accessToken', data.accessToken);
        // Retry original request
        return api(originalRequest);
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 🧪 Testing Strategy

### Backend Tests

```bash
# Unit tests (coming soon)
npm test

# Integration tests
npm test -- --integration

# Coverage
npm test -- --coverage
```

### Frontend Tests

```bash
# Component tests
npm test

# E2E tests with Playwright
npm run test:e2e
```

### API Testing

```bash
# Test endpoints with curl
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

---

## 📦 Deployment

### Environment Variables

**Backend** (.env)
```
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://fittrack.com

DB_HOST=your-rds-endpoint.amazonaws.com
DB_USER=admin
DB_PASSWORD=strong_password_here
DB_NAME=fittrack

JWT_SECRET=generate-with: openssl rand -base64 32
JWT_REFRESH_SECRET=another-random-secret

EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=app-password-from-gmail
```

**Frontend** (.env)
```
VITE_API_URL=https://api.fittrack.com/api
```

### Docker Deployment

```bash
# Build images
docker build -t fittrack-api ./backend
docker build -t fittrack-frontend ./frontend

# Run with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### GitHub Actions CI/CD

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy backend
        run: |
          ssh ${{ secrets.SERVER_USER }}@${{ secrets.SERVER_IP }}
          cd /app/fittrack
          git pull origin main
          npm install
          npm run build
          pm2 restart fittrack-api
      - name: Deploy frontend
        run: |
          npm run build
          aws s3 sync dist/ s3://fittrack-bucket
```

---

## 🛠️ Troubleshooting

### Database Connection Issues

```bash
# Check MySQL is running
mysql -u root -p -e "SELECT 1"

# Verify credentials in .env
# Reset database
mysql -u root -p < database/schema.sql
```

### JWT Token Errors

```
Error: Invalid token
→ Check token not expired
→ Verify JWT_SECRET matches backend & frontend
→ Clear localStorage and re-login
```

### CORS Errors

```
Error: Access to XMLHttpRequest blocked by CORS policy
→ Ensure FRONTEND_URL in backend .env matches your frontend origin
→ Check credentials: true in axios config
```

### Email Not Sending

```
Error: Authentication failed
→ Use Gmail App Password (not regular password)
→ Enable "Less secure app access" if using personal Gmail
→ Check EMAIL_USER and EMAIL_PASSWORD in .env
```

---

## 📊 Database Optimization

### Query Performance

```sql
-- Login activity query (optimized with indexes)
SELECT login_date 
FROM login_activity 
WHERE user_id = ? AND login_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY login_date DESC;
-- ✅ Uses: INDEX idx_user_id, INDEX idx_login_date

-- Task queries (composite index)
SELECT * FROM tasks 
WHERE user_id = ? AND task_date = ?
ORDER BY scheduled_time;
-- ✅ Uses: INDEX idx_user_date (user_id, task_date)
```

### Connection Pooling

```javascript
// MySQL connection pool (10 connections)
const pool = mysql.createPool({
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true
});
```

---

## 📈 Monitoring & Logging

### Log Levels

```javascript
// Development
console.log('ℹ️ Info message');
console.error('❌ Error occurred');

// Production (use Winston/Pino)
logger.info('User signup', { userId, email });
logger.error('Database error', error);
```

### Health Checks

```bash
# API health
curl http://localhost:5000/api/health
# Returns: { "status": "OK", "timestamp": "..." }

# Database check
SELECT 1 FROM users LIMIT 1;
```

---

## 🚀 Performance Optimization

### Frontend (Vite Code Splitting)

```javascript
// vite.config.js
rollupOptions: {
  output: {
    manualChunks: {
      'vendor': ['react', 'react-dom'],
      'state': ['zustand'],
      'api': ['axios']
    }
  }
}
// Result: Separate JS chunks for faster loading
```

### Backend (Database Optimization)

```javascript
// Batch queries
const [stats] = await pool.query(`
  SELECT 
    COUNT(*) as total_users,
    SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) as active_users
  FROM users
`);
// ✅ Single query instead of two
```

---

## 📞 Support & Documentation

- **API Docs**: `/docs` (add Swagger UI)
- **Frontend Guide**: `./frontend/README.md`
- **Backend Guide**: `./backend/README.md`
- **Database Schema**: `./backend/database/schema.sql`

---

## 🎓 Key Learnings

1. **Security First**: Hash passwords, validate input, use HTTPS
2. **Scalable Architecture**: Separate frontend/backend, use databases
3. **Error Handling**: Graceful failures, user-friendly messages
4. **Code Quality**: Modular code, separation of concerns
5. **Testing**: Unit + integration tests for reliability

---

**Last Updated**: August 22, 2024
**Version**: 1.0.0
