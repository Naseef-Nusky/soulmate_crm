# Fixing "Cannot connect to backend" Error

If you're getting "Cannot connect to backend" error when trying to login to the CRM, follow these steps:

## Step 1: Check Your Backend API URL

The CRM needs to know where your backend API is located. Check your backend URL:

1. **If your backend is on a different server:**
   - Your backend URL should be something like: `https://api.gurulink.app` or `https://your-backend-domain.com`
   
2. **If your backend is on the same droplet:**
   - If backend runs on port 4000: `http://localhost:4000`
   - If backend has a domain: `https://your-backend-domain.com`

## Step 2: Configure Environment Variable

SSH into your droplet and navigate to the CRM directory:

```bash
cd /var/www/crm
```

Create or edit the `.env` file:

```bash
nano .env
```

Add the following (replace with your actual backend URL):

```env
VITE_API_BASE_URL=https://api.gurulink.app
```

**Important Notes:**
- Replace `https://api.gurulink.app` with your actual backend API URL
- If your backend uses HTTP (not HTTPS), use `http://` instead
- If backend is on same server, you might need to use the server's IP or domain
- Make sure there's NO trailing slash at the end of the URL

Save and exit (Ctrl+X, then Y, then Enter)

## Step 3: Rebuild the Application

After setting the environment variable, you MUST rebuild the app:

```bash
cd /var/www/crm
npm run build
```

**Important:** Environment variables are only included at build time, so you must rebuild after changing `.env`

## Step 4: Restart Nginx

After rebuilding, restart nginx:

```bash
systemctl restart nginx
```

## Step 5: Verify Backend is Accessible

Test if your backend is reachable from the droplet:

```bash
# Test if backend is accessible
curl https://api.gurulink.app/api/admin/auth/me

# Or if using HTTP
curl http://your-backend-ip:4000/api/admin/auth/me
```

If you get a connection error, the backend might be:
- Not running
- Blocked by firewall
- Not accessible from the droplet's network

## Step 6: Check Backend CORS Settings

Make sure your backend allows requests from your CRM domain. Check your backend's CORS configuration:

1. Find your backend CORS settings (usually in `soulmate_backend/src/index.js`)
2. Add your CRM domain/IP to allowed origins:

```javascript
const allowedOrigins = [
  'http://your-crm-ip',
  'http://your-crm-domain.com',
  'https://your-crm-domain.com',
  // ... other origins
];
```

3. Restart your backend server

## Step 7: Check Backend is Running

If backend is on the same droplet, verify it's running:

```bash
# Check if Node.js process is running
ps aux | grep node

# Check if backend port is listening
netstat -tulpn | grep 4000
# or
ss -tulpn | grep 4000
```

If backend is not running, start it:

```bash
cd /path/to/soulmate_backend
npm start
# or if using PM2
pm2 start index.js
```

## Step 8: Check Firewall

Make sure your backend port is open:

```bash
# Check firewall status
ufw status

# If backend is on port 4000, allow it
ufw allow 4000/tcp

# If using HTTPS (port 443)
ufw allow 443/tcp

# If using HTTP (port 80)
ufw allow 80/tcp
```

## Step 9: Test from Browser Console

Open your CRM in browser and check the browser console (F12):

1. Go to your CRM URL
2. Open Developer Tools (F12)
3. Go to Console tab
4. Try to login
5. Check for errors in the console
6. Go to Network tab and see what requests are failing

Look for:
- CORS errors
- 404 errors (wrong API URL)
- Connection refused (backend not running)
- SSL errors (if using HTTPS)

## Step 10: Verify Environment Variable is Set

Check if the environment variable is being used:

```bash
cd /var/www/crm
cat .env
```

Make sure the file contains:
```
VITE_API_BASE_URL=https://your-actual-backend-url.com
```

**Common Mistakes:**
- ❌ `VITE_API_URL` (wrong variable name - should be `VITE_API_BASE_URL`)
- ❌ URL with trailing slash: `https://api.gurulink.app/` (remove the trailing slash)
- ❌ Forgot to rebuild after changing `.env`
- ❌ Wrong backend URL

## Quick Fix Script

Run this script to quickly fix common issues:

```bash
#!/bin/bash
cd /var/www/crm

# Set your backend URL here
BACKEND_URL="https://api.gurulink.app"

echo "Setting VITE_API_BASE_URL=$BACKEND_URL"
echo "VITE_API_BASE_URL=$BACKEND_URL" > .env

echo "Rebuilding application..."
npm run build

echo "Restarting nginx..."
systemctl restart nginx

echo "✅ Done! Try accessing your CRM now."
```

Save as `fix-backend.sh`, make it executable, and run:

```bash
chmod +x fix-backend.sh
./fix-backend.sh
```

## Still Not Working?

1. **Check backend logs:**
   ```bash
   # If using PM2
   pm2 logs
   
   # If running directly
   # Check your backend console output
   ```

2. **Check nginx logs:**
   ```bash
   tail -f /var/log/nginx/error.log
   ```

3. **Test API directly:**
   ```bash
   curl -X POST https://api.gurulink.app/api/admin/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"test","password":"test"}'
   ```

4. **Verify DNS:**
   ```bash
   nslookup api.gurulink.app
   ping api.gurulink.app
   ```

## Common Solutions Summary

| Problem | Solution |
|---------|----------|
| Wrong API URL | Update `.env` with correct `VITE_API_BASE_URL` and rebuild |
| Backend not running | Start backend server |
| CORS error | Add CRM domain to backend CORS allowed origins |
| Firewall blocking | Allow backend port in firewall |
| Not rebuilt after .env change | Run `npm run build` after changing `.env` |
| Wrong environment variable name | Use `VITE_API_BASE_URL` not `VITE_API_URL` |


