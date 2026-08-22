# FitTrack - Complete Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
│  (React SPA - Vite, Zustand, Axios)                          │
│  - LoginPage, SignupPage, DashboardPage                      │
│  - State Management: Auth, Users, Tasks                      │
│  - Error Boundaries, Protected Routes                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                 HTTP/REST + JWT
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  API GATEWAY (Express)                       │
│  - CORS Middleware                                           │
│  - JWT Authentication Middleware                             │
│  - Input Validation (express-validator)                      │
│  - Error Handler                                             │
└────────────────────────┬────────────────────────────────────┘
                         │
            ┌────────────┼────────────┬──────────────┐
            ▼            ▼            ▼              ▼
    ┌───────────────┐┌──────────┐┌──────────┐┌──────────────┐
    │ Auth Routes   ││User      ││Task      ││Admin Routes  │
    │               ││Routes    ││Routes    ││              │
    │- signup       │├──────────┤├──────────┤├──────────────┤
    │- login        ││- me      ││- create  ││- getUsers    │
    │- verify-email ││- profile ││- update  ││- getStats    │
    │- forgot-pwd   ││- prefs   ││- delete  ││- suspend     │
    │- reset-pwd    ││          ││          ││- activate    │
    └───────────────┘└──────────┘└──────────┘└──────────────┘
            │            │            │              │
            └────────────┼────────────┴──────────────┘
                         │
                         ▼
    ┌────────────────────────────────────────────────┐
    │        DATA ACCESS & SERVICES LAYER            │
    │                                                 │
    │  - authService (JWT, password hashing)        │
    │  - emailService (Nodemailer)                   │
    │  - streakService (calculation logic)           │
    │  - validationMiddleware (input rules)          │
    └────────────────┬───────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
    ┌─────────┐ ┌──────────┐ ┌─────────────┐
    │  MySQL  │ │Nodemailer│ │Redis Cache  │
    │ Database│ │  Server  │ │(Optional)   │
    └─────────┘ └──────────┘ └─────────────┘
```

## Database Schema Relationships

```
USERS (Primary)
├── id (UUID PK)
├── email (UNIQUE)
├── password_hash
├── role (user/admin)
└── is_active

    │
    ├─→ USER_PROFILES (1:1)
    │   ├── user_id (FK)
    │   ├── age, gender
    │   ├── height_cm, weight_kg
    │   └── fitness_level, preferences
    │
    ├─→ USER_PREFERENCES (1:1)
    │   ├── user_id (FK)
    │   └── preferences (JSON)
    │
    ├─→ TASKS (1:Many)
    │   ├── user_id (FK)
    │   ├── title, category
    │   ├── is_completed
    │   └── task_date
    │
    ├─→ LOGIN_ACTIVITY (1:Many)
    │   ├── user_id (FK)
    │   ├── login_date (UNIQUE per user)
    │   └── created_at
    │
    ├─→ STREAKS (1:1)
    │   ├── user_id (FK)
    │   ├── current_streak
    │   └── longest_streak
    │
    ├─→ EMAIL_TOKENS (1:Many)
    │   ├── user_id (FK)
    │   ├── token (UNIQUE)
    │   ├── expires_at
    │   └── is_used
    │
    └─→ PASSWORD_RESET_TOKENS (1:Many)
        ├── user_id (FK)
        ├── token (UNIQUE)
        ├── expires_at
        └── is_used
```

## Authentication Flow Diagram

```
SIGNUP FLOW:
┌────────────┐
│   User     │
└──────┬─────┘
       │ POST /auth/signup
       │ {name, email, password}
       ▼
┌─────────────────────────────┐
│  1. Validate input          │
│  2. Hash password           │
│  3. Create user record      │
│  4. Create profile/prefs    │
│  5. Generate email token    │
│  6. Send verification email │
└──────┬──────────────────────┘
       │
       ▼
  ✅ Account created
  📧 Verification email sent
       │
       │ User clicks link
       │ GET /verify-email/:token
       ▼
┌──────────────────────────────┐
│  1. Validate token (not used) │
│  2. Not expired              │
│  3. Mark email verified      │
│  4. Mark token as used       │
└──────┬───────────────────────┘
       │
       ▼
  ✅ Email verified
  🔓 Can now login


LOGIN FLOW:
┌────────────┐
│   User     │
└──────┬─────┘
       │ POST /auth/login
       │ {email, password}
       ▼
┌─────────────────────────────┐
│  1. Find user by email      │
│  2. Verify password (bcrypt)│
│  3. Check account active    │
│  4. Record login activity   │
│  5. Calculate streak        │
│  6. Generate JWT tokens     │
└──────┬──────────────────────┘
       │
       ▼
  ✅ Login success
  🔑 Access token + Refresh token
       │
       │ Store in localStorage
       ▼
  📊 Access protected endpoints
  

TOKEN REFRESH FLOW:
┌────────────┐
│   API Call │ (Access Token expired)
└──────┬─────┘
       │ 401 Unauthorized
       ▼
┌──────────────────────────────┐
│  1. Check refresh token      │
│  2. Valid? Not expired?      │
│  3. Generate new access token│
│  4. Store new token          │
└──────┬───────────────────────┘
       │
       ▼
  ✅ Tokens refreshed
  🔄 Retry original request
```

## Data Flow - Task Management

```
CREATE TASK:
 Frontend                Backend                Database
    │                        │                      │
    │ POST /tasks            │                      │
    │ {title, date}          │                      │
    ├────────────────────────>                      │
    │                        │ Validate input       │
    │                        │ Check user owns      │
    │                        │                      │
    │                        │ INSERT into tasks    │
    │                        ├─────────────────────>
    │                        │                      │
    │                        │ Return taskId        │
    │ <────────────────────────                     │
    │                        │                      │
    │ Update local state     │                      │
    │ Show success toast     │                      │
    │                        │                      │

UPDATE TASK:
 Frontend                Backend                Database
    │                        │                      │
    │ PUT /tasks/:taskId     │                      │
    │ {is_completed: true}   │                      │
    ├────────────────────────>                      │
    │                        │ Verify ownership     │
    │                        │ Validate allowed     │
    │                        │ fields               │
    │                        │                      │
    │                        │ UPDATE tasks SET     │
    │                        ├─────────────────────>
    │                        │                      │
    │                        │ Return success       │
    │ <────────────────────────                     │
    │                        │                      │
    │ Update local state     │                      │
    │ Show success toast     │                      │
    │                        │                      │
```

## Streak Calculation Pipeline

```
DAILY LOGIN:
┌──────────────┐
│  User Login  │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────┐
│  Check: Today already logged in?│
│  Query: login_activity          │
└────┬────────────────────┬───────┘
     │ YES                │ NO
     │                    │
     ▼                    ▼
  ✅ Skip            ┌──────────────────────────┐
                     │ Insert login_activity    │
                     └────┬─────────────────────┘
                          │
                          ▼
                 ┌──────────────────────────────┐
                 │  Calculate Streak:           │
                 │  1. Get all login dates      │
                 │  2. Count consecutive days   │
                 │  3. From most recent         │
                 │  4. Until gap found          │
                 └────┬─────────────────────────┘
                      │
                      ▼
             ┌──────────────────────────────┐
             │  Update streaks table:       │
             │  - current_streak = N        │
             │  - longest_streak = max(N)   │
             └──────┬───────────────────────┘
                    │
                    ▼
           ✅ Streak updated
           🔥 User streak = N days
```

## Error Handling Flow

```
API REQUEST:
┌──────────────┐
│   Request    │
└──────┬───────┘
       │
       ▼
┌──────────────────────────┐
│  Try {                   │
│    - Validate input      │
│    - Database query      │
│    - Process data        │
│  }                       │
└─┬──────────────────┬─────┘
  │                  │
  │ Success          │ Error
  │                  │
  ▼                  ▼
┌──────────────┐ ┌────────────────────┐
│ Return data  │ │ Catch error {      │
│ Status: 200  │ │   Log error        │
└──────────────┘ │   Set status code  │
                 │   Send error msg   │
                 │ }                  │
                 └────┬───────────────┘
                      │
                      ▼
            ┌──────────────────────────┐
            │ Frontend Error Handler   │
            │ - Show error toast       │
            │ - Offer retry/dismiss    │
            │ - Log for debugging      │
            └──────────────────────────┘
```

## Performance Optimization Layers

```
┌─────────────────────────────────────┐
│  1. CLIENT CACHING                  │
│  - localStorage: auth tokens        │
│  - Zustand: app state               │
│  - Browser cache: assets            │
└─────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  2. API CACHING (Redis)             │
│  - User profile cache               │
│  - Admin stats cache                │
│  - Video list cache                 │
│  - TTL: 5-15 minutes                │
└─────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  3. DATABASE OPTIMIZATION           │
│  - Connection pooling               │
│  - Query indexing                   │
│  - Batch operations                 │
│  - Prepared statements              │
└─────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  4. CODE SPLITTING & LAZY LOADING   │
│  - Vite chunks: vendor, state, api  │
│  - Route-based code splitting       │
│  - Dynamic imports for modals       │
└─────────────────────────────────────┘
```

---

**Diagram Legend:**
- `→` = Data flow
- `├→` = Relationship
- `✅` = Success state
- `❌` = Error state
- `🔄` = Retry/Repeat
