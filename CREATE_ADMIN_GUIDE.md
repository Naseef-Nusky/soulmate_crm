# How to Create Admin User - Step by Step Guide

## Method 1: Using Command Line (Recommended)

### Step 1: Open Terminal/Command Prompt
- **Windows**: Press `Win + R`, type `cmd` or `powershell`, press Enter
- **Mac/Linux**: Open Terminal app

### Step 2: Navigate to Backend Directory
```bash
cd F:\latest_projects\GuruLinkApp\soulmate_backend
```

### Step 3: Run the Admin Creation Script
```bash
node scripts/createAdmin.js admin admin123 admin
```

### Step 4: Verify Success
You should see:
```
✅ Admin user "admin" created successfully with role "admin"
You can now log in to the CRM using these credentials.
```

## Method 2: If Database Connection Fails

If you see "Database not available" error, you need to:

### 1. Check Database Configuration
Make sure you have a `.env` file in `soulmate_backend` folder with:
```
DATABASE_URL=your_database_connection_string
```

### 2. Ensure Backend Can Connect
The script needs the same database connection as your backend server.

### 3. Alternative: Create Admin via Backend API (if backend is running)

If your backend is already running, you can create the admin user directly in the database:

**Option A: Using PostgreSQL Client**
```sql
-- Connect to your database and run:
INSERT INTO admin_users (username, password_hash, role, is_active, created_at, updated_at)
VALUES (
  'admin',
  '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', -- SHA256 hash of 'admin123'
  'admin',
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (username) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    updated_at = NOW();
```

**Option B: Wait for Backend to Start**
1. Start your backend server: `npm start` or `npm run dev`
2. Once backend is running, the database connection should work
3. Then run the createAdmin script again

## Troubleshooting

### Error: "Database not available"
- Check your `DATABASE_URL` in `.env` file
- Make sure database server is running
- Verify network connectivity to database

### Error: "Cannot find module"
- Make sure you're in the `soulmate_backend` directory
- Run `npm install` if you haven't already

### Error: "Admin user already exists"
- That's okay! The script will update the existing user
- You can now log in with those credentials

## After Creating Admin User

1. Go to your CRM login page
2. Enter:
   - **Username**: `admin`
   - **Password**: `admin123`
3. Click "Sign In"

## Change Password Later

To change the admin password, run:
```bash
node scripts/createAdmin.js admin newpassword123 admin
```

This will update the existing admin user with the new password.


