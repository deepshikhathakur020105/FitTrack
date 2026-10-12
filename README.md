# FitTrack

A comprehensive fitness tracking application designed to help you monitor health, fitness goals, and workout progress.

## Project structure

This repository is split into two main parts:

- `backend/` — Express + MySQL API
- `frontend/` — React + Vite client

## Quick start

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Common features

- Workout tracking
- Fitness dashboard
- Goal management
- Health metrics
- Authentication and user profiles
- Task management and admin endpoints

## Notes

- The backend requires MySQL and the required environment variables from `backend/.env.example`.
- The frontend uses Vite and expects the API URL in `frontend/.env`.
