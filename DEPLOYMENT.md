# Deployment Guide

## Vercel Deployment (Frontend)

The frontend is configured to deploy on Vercel.

### Steps:

1. **Install Vercel CLI** (optional, can use web interface):
   ```bash
   npm i -g vercel
   ```

2. **Deploy from client directory**:
   ```bash
   cd client
   vercel
   ```

   Or connect your GitHub repo to Vercel and it will auto-deploy.

3. **Set Environment Variables in Vercel Dashboard**:
   - `VITE_API_URL` - Your backend API URL (e.g., `https://your-backend.railway.app` or `https://your-backend.render.com`)

### Vercel Configuration

The `client/vercel.json` file is already configured for Vercel deployment with:
- Build command: `npm run build`
- Output directory: `dist`
- Framework: Vite
- SPA routing rewrites

## Backend Deployment Options

### Option 1: Railway (Recommended)

1. Go to [Railway.app](https://railway.app)
2. Create new project from GitHub repo
3. Select the `server` folder
4. Add environment variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `JWT_SECRET` - Your JWT secret
   - `PORT` - (optional, defaults to 3001)
5. Railway will auto-detect Node.js and deploy

### Option 2: Render

1. Go to [Render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repo
4. Set root directory to `server`
5. Build command: `npm install && npm run migrate && npm run build`
6. Start command: `npm start`
7. Add environment variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `PORT`

### Option 3: Vercel Serverless Functions (Advanced)

Convert Express routes to Vercel serverless functions. This requires restructuring the backend code.

## Database Setup

### Option 1: Railway PostgreSQL

1. Create PostgreSQL service on Railway
2. Copy connection string to `DATABASE_URL`
3. Run migrations: `npm run migrate`

### Option 2: Supabase

1. Create project on [Supabase](https://supabase.com)
2. Get connection string from Settings > Database
3. Use as `DATABASE_URL`

### Option 3: Neon

1. Create project on [Neon](https://neon.tech)
2. Get connection string
3. Use as `DATABASE_URL`

## Post-Deployment Steps

1. **Run migrations** on production database:
   ```bash
   cd server
   DATABASE_URL="your-production-db-url" npm run migrate
   ```

2. **Seed database** (optional):
   ```bash
   DATABASE_URL="your-production-db-url" npm run seed
   ```

3. **Update CORS** in `server/src/index.ts` if needed:
   ```typescript
   app.use(cors({
     origin: ['https://your-frontend.vercel.app'],
     credentials: true
   }));
   ```

4. **Update frontend API URL** in Vercel environment variables

## Environment Variables Summary

### Frontend (Vercel)
- `VITE_API_URL` - Backend API URL

### Backend (Railway/Render)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `PORT` - Server port (optional)
- `NODE_ENV` - Set to `production`

## Quick Deploy Commands

### Frontend (Vercel)
```bash
cd client
vercel --prod
```

### Backend (Railway CLI)
```bash
cd server
railway up
```

