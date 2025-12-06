# Fix "Cannot connect to backend" on Deployed CRM

If you're getting "Cannot connect to backend" error on your deployed CRM, follow these steps:

## Step 1: Check Backend CORS Configuration

The backend must allow requests from your CRM domain. Update your backend `.env` file:

### On Your Backend Server:

```bash
cd /path/to/soulmate_backend
nano .env
```

Add or update the `ALLOWED_ORIGINS` variable:

```env
ALLOWED_ORIGINS=http://YOUR_CRM_IP,https://YOUR_CRM_DOMAIN,https://api.gurulink.app
```

**Examples:**
- If CRM is at `http://123.45.67.89`: `ALLOWED_ORIGINS=http://123.45.67.89`
- If CRM is at `https://crm.gurulink.app`: `ALLOWED_ORIGINS=https://crm.gurulink.app`
- Multiple origins: `ALLOWED_ORIGINS=http://123.45.67.89,https://crm.gurulink.app,https://api.gurulink.app`

**Important:**
- Include both HTTP and HTTPS if you use both
- Include the exact domain/IP (no trailing slash)
- Separate multiple origins with commas

Save and restart your backend:

```bash
# If using PM2
pm2 restart all

# If running directly
# Stop and restart your backend server
```

## Step 2: Verify CRM API URL

On your CRM droplet:

```bash
cd /var/www/crm
cat .env
```

Make sure it contains:

```env
VITE_API_BASE_URL=https://api.gurulink.app
```

**Replace with your actual backend URL:**
- If backend is on same server: `http://localhost:4000` or `http://YOUR_SERVER_IP:4000`
- If backend has domain: `https://api.gurulink.app`
- If backend is on different server: `https://your-backend-domain.com`

## Step 3: Rebuild CRM After Changing .env

**CRITICAL:** After changing `.env`, you MUST rebuild:

```bash
cd /var/www/crm
npm run build
systemctl restart nginx
```

## Step 4: Test Backend Connection

Test if backend is accessible from CRM droplet:

```bash
# Test backend endpoint
curl https://api.gurulink.app/api/admin/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

If you get a CORS error, the backend CORS is not configured correctly.

## Step 5: Check Backend is Running

Verify backend is running:

```bash
# On backend server
ps aux | grep node
# or
pm2 list
# or
systemctl status your-backend-service
```

## Step 6: Check Firewall

Make sure backend port is open:

```bash
# On backend server
ufw status
ufw allow 4000/tcp  # If backend runs on port 4000
```

## Step 7: Test from Browser Console

1. Open your CRM in browser
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Try to login
5. Check for errors:
   - **CORS error**: Backend CORS not configured
   - **Network error**: Backend not reachable
   - **404 error**: Wrong API URL

## Quick Fix Script

Run this on your **backend server** to quickly add CRM to allowed origins:

```bash
#!/bin/bash
# Run on BACKEND server

cd /path/to/soulmate_backend

# Get CRM URL from user
read -p "Enter your CRM URL (e.g., http://123.45.67.89 or https://crm.gurulink.app): " CRM_URL

# Read current .env
if [ -f .env ]; then
    # Remove old ALLOWED_ORIGINS line if exists
    sed -i '/^ALLOWED_ORIGINS=/d' .env
    
    # Get existing origins if any
    EXISTING=$(grep "^ALLOWED_ORIGINS=" .env 2>/dev/null | cut -d'=' -f2 || echo "")
    
    if [ -z "$EXISTING" ]; then
        # Add new line
        echo "ALLOWED_ORIGINS=$CRM_URL" >> .env
    else
        # Append to existing
        echo "ALLOWED_ORIGINS=$EXISTING,$CRM_URL" >> .env
    fi
else
    echo "ALLOWED_ORIGINS=$CRM_URL" >> .env
fi

echo "✅ Added $CRM_URL to ALLOWED_ORIGINS"
echo "🔄 Restarting backend..."

# Restart backend (adjust based on how you run it)
pm2 restart all
# or
# systemctl restart your-backend-service

echo "✅ Done! Try accessing CRM now."
```

## Common Issues & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| CORS error in browser console | Backend doesn't allow CRM origin | Add CRM URL to `ALLOWED_ORIGINS` in backend `.env` |
| Network error / Connection refused | Backend not running or wrong URL | Check backend is running, verify API URL in CRM `.env` |
| 404 Not Found | Wrong API endpoint | Check `VITE_API_BASE_URL` in CRM `.env` |
| Still not working after rebuild | Forgot to rebuild | Run `npm run build` in CRM directory |

## Verification Checklist

- [ ] Backend `.env` has `ALLOWED_ORIGINS` with CRM domain/IP
- [ ] Backend server restarted after changing `.env`
- [ ] CRM `.env` has correct `VITE_API_BASE_URL`
- [ ] CRM rebuilt after changing `.env` (`npm run build`)
- [ ] Nginx restarted after rebuild
- [ ] Backend is running and accessible
- [ ] Firewall allows backend port
- [ ] Tested with `curl` from CRM droplet

## Still Not Working?

1. **Check backend logs:**
   ```bash
   pm2 logs
   # or check your backend console
   ```

2. **Check browser console (F12)** for specific error messages

3. **Test API directly:**
   ```bash
   curl -v https://api.gurulink.app/api/admin/auth/login \
     -X POST \
     -H "Content-Type: application/json" \
     -H "Origin: http://YOUR_CRM_URL" \
     -d '{"username":"test","password":"test"}'
   ```

4. **Verify DNS:**
   ```bash
   nslookup api.gurulink.app
   ping api.gurulink.app
   ```


