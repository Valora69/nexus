# Google OAuth Setup Guide

This guide will help you complete the Google OAuth setup for your application.

## ✅ Completed Changes

All code changes have been implemented:

1. ✅ Updated Prisma schema to use Google OAuth (removed password, added googleId and picture)
2. ✅ Installed required dependencies (passport, passport-google-oauth20, @nestjs/passport)
3. ✅ Created Google OAuth strategy (apps/api/src/auth/google.strategy.ts)
4. ✅ Updated auth module, controller, and service for Google OAuth
5. ✅ Updated frontend login page with "Sign in with Google" button
6. ✅ Updated seed file to work with Google OAuth
7. ✅ Created database migration file

## 🔧 Setup Steps Required

### Step 1: Get Google OAuth Credentials

1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to APIs & Services > Credentials
5. Click Create Credentials > OAuth client ID
6. Choose Web application
7. Configure:
   - Authorized JavaScript origins: http://localhost:3000, http://localhost:8080
   - Authorized redirect URIs: http://localhost:8080/api/auth/google/callback
8. Copy the Client ID and Client Secret

### Step 2: Update Environment Variables

Update apps/api/.env with your Google credentials:

GOOGLE_CLIENT_ID="your-actual-client-id-here"
GOOGLE_CLIENT_SECRET="your-actual-client-secret-here"

### Step 3: Run Database Migration

Once your Supabase database is accessible, run:

cd apps/api
bunx prisma migrate deploy --schema prisma/schema.prisma

### Step 4: Regenerate Prisma Client

cd apps/api
bunx prisma generate --schema prisma/schema.prisma

### Step 5: Start the Applications

1. Start the API:
   cd apps/api && bun run dev

2. Start the Web App:
   cd apps/web && bun run dev

### Step 6: Test the Login Flow

1. Open http://localhost:3000/login
2. Click "Sign in with Google"
3. Authorize the app
4. You'll be redirected to /home with your Google account logged in

## 🎨 Theme Consistency

All styling matches your existing theme with the same colors and design.

## 🔐 How It Works

User clicks "Sign in with Google" → Google OAuth consent → Backend creates/updates user → JWT token set in cookie → User logged in with name displayed

Setup completed! 🎉
