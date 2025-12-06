# CRM Login Troubleshooting

If you cannot log in to the CRM, follow these steps:

## Step 1: Check if Admin User Exists

The most common issue is that no admin user has been created yet. You need to create one first.

### Create Admin User:

1. Open a terminal/command prompt
2. Navigate to the backend directory:
   ```bash
   cd soulmate_backend
   ```

3. Run the admin creation script:
   ```bash
   node scripts/createAdmin.js admin admin123 admin
   ```

   This creates:
   - Username: `admin`
   - Password: `admin123`
   - Role: `admin`

4. You should see: `✅ Admin user "admin" created successfully with role "admin"`

## Step 2: Verify Backend is Running

Make sure your backend server is running:

```bash
cd soulmate_backend
npm start
# or
npm run dev
```

The backend should be running on `http://localhost:4000` (or your configured port).

## Step 3: Check Database Connection

The admin user creation requires a database connection. Make sure:

1. Your `.env` file has `DATABASE_URL` configured
2. The database is accessible
3. The `admin_users` table exists (it's created automatically on first run)

## Step 4: Check Browser Console

Open your browser's developer console (F12) and check for any errors:

- Network errors (CORS, connection refused)
- API errors (404, 500, etc.)

## Step 5: Verify API Endpoint

Test the login endpoint directly:

```bash
curl -X POST http://localhost:4000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

You should get a response with a token if successful.

## Common Error Messages:

### "Invalid credentials"
- The admin user doesn't exist → Create it with the script
- Wrong username/password → Check your credentials

### "Database not available"
- Database connection issue → Check DATABASE_URL in .env
- Backend not connected to database → Restart backend

### "Cannot connect to backend"
- Backend server not running → Start the backend
- Wrong API URL → Check VITE_API_BASE_URL in CRM .env

### "Failed to authenticate"
- Database query failed → Check database connection
- Admin user inactive → Check is_active flag in database

## Still Having Issues?

1. Check backend logs for errors
2. Verify the `admin_users` table exists in your database
3. Try creating the admin user again
4. Check that the backend routes are properly mounted


