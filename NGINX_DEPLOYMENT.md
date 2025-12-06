# Nginx Configuration Deployment Guide for CRM Droplet

## Quick Setup (HTTP Only - Before SSL)

1. **Copy the configuration file to your droplet:**

```bash
# On your local machine, copy the file
scp crm/nginx.conf.no-ssl root@138.68.170.205:/etc/nginx/sites-available/crm.gurulink.app
```

2. **On the droplet, create symlink and test:**

```bash
# SSH into droplet
ssh root@138.68.170.205

# Create symlink
ln -s /etc/nginx/sites-available/crm.gurulink.app /etc/nginx/sites-enabled/

# Remove default nginx site (if exists)
rm /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# If test passes, reload nginx
systemctl reload nginx
```

## Full Setup with SSL (Recommended for Production)

### Step 1: Initial HTTP Setup

Use `nginx.conf.no-ssl` first to get the site running, then proceed with SSL.

### Step 2: Install Certbot (Let's Encrypt)

```bash
# Update package list
apt update

# Install certbot
apt install certbot python3-certbot-nginx -y
```

### Step 3: Obtain SSL Certificate

```bash
# Get certificate (certbot will automatically configure nginx)
certbot --nginx -d crm.gurulink.app

# Or if you want to do it manually:
certbot certonly --nginx -d crm.gurulink.app
```

### Step 4: Update to SSL Configuration

After obtaining certificates, replace the config with the SSL version:

```bash
# Copy SSL config
scp crm/nginx.conf root@138.68.170.205:/etc/nginx/sites-available/crm.gurulink.app

# On droplet, test and reload
nginx -t
systemctl reload nginx
```

### Step 5: Auto-renewal Setup

```bash
# Test renewal
certbot renew --dry-run

# Certbot automatically sets up renewal, but verify:
systemctl status certbot.timer
```

## Configuration Details

### Key Features:

1. **HTTP to HTTPS Redirect**: All HTTP traffic automatically redirects to HTTPS
2. **CORS Support**: Configured for API access (adjust `Access-Control-Allow-Origin` as needed)
3. **Gzip Compression**: Reduces file sizes for faster loading
4. **Security Headers**: XSS protection, frame options, content type protection
5. **Static Asset Caching**: 1-year cache for static files
6. **SPA Routing**: Handles React/Vue/Angular routing with `try_files`

### Important Notes:

- **CORS Origin**: The config uses `*` (allow all). For production, you may want to restrict this:
  ```nginx
  add_header Access-Control-Allow-Origin "https://crm.gurulink.app https://gurulink.app" always;
  ```

- **SSL Certificate Paths**: After running certbot, verify the paths in the SSL config match your certificate location:
  ```bash
  ls -la /etc/letsencrypt/live/crm.gurulink.app/
  ```

- **Build Directory**: Ensure `/var/www/crm/dist` exists and contains your built files:
  ```bash
  ls -la /var/www/crm/dist/
  ```

## Troubleshooting

### Test Nginx Configuration
```bash
nginx -t
```

### Check Nginx Status
```bash
systemctl status nginx
```

### View Error Logs
```bash
tail -f /var/log/nginx/crm.gurulink.app.error.log
```

### View Access Logs
```bash
tail -f /var/log/nginx/crm.gurulink.app.access.log
```

### Reload Nginx (after config changes)
```bash
systemctl reload nginx
```

### Restart Nginx (if reload doesn't work)
```bash
systemctl restart nginx
```

### Check if Port 80/443 is Open
```bash
# Check if nginx is listening
netstat -tlnp | grep nginx

# Or
ss -tlnp | grep nginx
```

### Firewall Configuration
```bash
# If using UFW
ufw allow 80/tcp
ufw allow 443/tcp
ufw reload

# If using firewalld
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

## Verification Checklist

- [ ] Nginx configuration file copied to `/etc/nginx/sites-available/crm.gurulink.app`
- [ ] Symlink created in `/etc/nginx/sites-enabled/`
- [ ] `nginx -t` passes without errors
- [ ] Nginx reloaded successfully
- [ ] Site accessible at `http://crm.gurulink.app` (or IP)
- [ ] SSL certificate obtained (if using HTTPS)
- [ ] HTTPS redirect working
- [ ] Static files loading correctly
- [ ] SPA routing working (try navigating to a route directly)
- [ ] CORS headers present (check in browser DevTools Network tab)

## Common Issues

### 502 Bad Gateway
- Check if your app is running
- Verify the root path `/var/www/crm/dist` exists and has files
- Check file permissions: `chown -R www-data:www-data /var/www/crm/dist`

### 403 Forbidden
- Check file permissions: `chmod -R 755 /var/www/crm/dist`
- Verify nginx user has access: `ls -la /var/www/crm/dist`

### CORS Errors
- Verify CORS headers in response (check browser DevTools)
- Ensure backend also allows the origin
- Check if preflight OPTIONS requests are handled

### SSL Certificate Issues
- Verify certificate paths in config
- Check certificate expiration: `certbot certificates`
- Renew if needed: `certbot renew`

