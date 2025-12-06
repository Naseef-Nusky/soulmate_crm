# CRM Deployment Guide - DigitalOcean Droplet

This guide will help you deploy the CRM application to a DigitalOcean Droplet.

## Prerequisites
- A DigitalOcean account
- Your backend API URL (e.g., `https://your-backend-domain.com`)
- Domain name (optional, but recommended)

## Step 1: Create a DigitalOcean Droplet

1. Log in to [DigitalOcean Console](https://cloud.digitalocean.com)
2. Click **"Create"** → **"Droplets"**
3. Choose configuration:
   - **Image**: Ubuntu 22.04 (LTS) x64
   - **Plan**: Basic plan, Regular Intel with SSD
   - **CPU**: 1 GB RAM / 1 vCPU ($6/month) or higher
   - **Datacenter region**: Choose closest to your users
   - **Authentication**: SSH keys (recommended) or root password
4. Click **"Create Droplet"**
5. Wait for droplet to be created (1-2 minutes)
6. Note your droplet's **IP address**

## Step 2: Connect to Your Droplet

### On Windows (PowerShell):
```powershell
ssh root@YOUR_DROPLET_IP
```

### On Mac/Linux:
```bash
ssh root@YOUR_DROPLET_IP
```

Replace `YOUR_DROPLET_IP` with your actual droplet IP address.

## Step 3: Update System and Install Dependencies

```bash
# Update system packages
apt update && apt upgrade -y

# Install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify installation
node --version
npm --version

# Install nginx (web server)
apt install -y nginx

# Install Git (if not already installed)
apt install -y git
```

## Step 4: Clone Your CRM Repository

```bash
# Create a directory for your applications
mkdir -p /var/www
cd /var/www

# Clone your CRM repository
git clone https://github.com/Naseef-Nusky/soulmate_crm.git crm

# Navigate to CRM directory
cd crm
```

**Note**: If your repository is private, you'll need to:
1. Set up SSH keys on the droplet, or
2. Use a personal access token for HTTPS

## Step 5: Configure Environment Variables

```bash
# Create .env file
nano .env
```

Add the following content (replace with your actual backend URL):
```
VITE_API_BASE_URL=https://your-backend-domain.com
```

**Important**: 
- Replace `https://your-backend-domain.com` with your actual backend API URL
- Use `VITE_API_BASE_URL` (not `VITE_API_URL`)
- Do NOT include a trailing slash at the end
- Example: `VITE_API_BASE_URL=https://api.gurulink.app`

Save and exit (Ctrl+X, then Y, then Enter)

## Step 6: Install Dependencies and Build

```bash
# Install npm dependencies
npm install

# Build the production version
npm run build
```

This will create a `dist` folder with the production-ready files.

## Step 7: Configure Nginx

```bash
# Create nginx configuration file
nano /etc/nginx/sites-available/crm
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;
    
    root /var/www/crm/dist;
    index index.html;

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Replace `YOUR_DOMAIN_OR_IP` with:
- Your domain name (if you have one), or
- Your droplet IP address

Save and exit (Ctrl+X, then Y, then Enter)

```bash
# Enable the site
ln -s /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/

# Remove default nginx site (optional)
rm /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t

# Restart nginx
systemctl restart nginx
```

## Step 8: Configure Firewall

```bash
# Allow HTTP traffic
ufw allow 'Nginx Full'
ufw allow OpenSSH
ufw enable
```

## Step 9: Test Your Deployment

1. Open your browser and go to: `http://YOUR_DROPLET_IP`
2. You should see the CRM login page
3. Try logging in with your admin credentials

## Step 10: Set Up SSL with Let's Encrypt (Recommended)

If you have a domain name pointing to your droplet:

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
certbot --nginx -d your-domain.com

# Certbot will automatically configure nginx and set up auto-renewal
```

After SSL setup, your CRM will be accessible at `https://your-domain.com`

## Step 11: Set Up Auto-Deployment (Optional)

Create a simple deployment script:

```bash
# Create deployment script
nano /var/www/crm/deploy.sh
```

Add:
```bash
#!/bin/bash
cd /var/www/crm
git pull origin master
npm install
npm run build
systemctl reload nginx
echo "Deployment complete!"
```

Make it executable:
```bash
chmod +x /var/www/crm/deploy.sh
```

## Step 12: Update API Configuration

If you need to change the backend API URL:

1. Update the `.env` file with `VITE_API_BASE_URL`:
   ```bash
   nano /var/www/crm/.env
   ```
   Set: `VITE_API_BASE_URL=https://your-backend-url.com`

2. **IMPORTANT**: Rebuild the application (environment variables are only included at build time):
   ```bash
   cd /var/www/crm
   npm run build
   ```

3. Restart nginx:
   ```bash
   systemctl restart nginx
   ```

**Note**: You MUST rebuild after changing `.env` - just restarting nginx is not enough!

## Troubleshooting

### Check nginx logs:
```bash
tail -f /var/log/nginx/error.log
```

### Check if nginx is running:
```bash
systemctl status nginx
```

### Restart nginx:
```bash
systemctl restart nginx
```

### Check if port 80 is open:
```bash
netstat -tulpn | grep :80
```

### View build errors:
```bash
cd /var/www/crm
npm run build
```

## Updating the CRM

When you push new code to GitHub:

```bash
cd /var/www/crm
git pull origin master
npm install
npm run build
systemctl reload nginx
```

## Security Recommendations

1. **Change SSH port** (optional but recommended):
   ```bash
   nano /etc/ssh/sshd_config
   # Change Port 22 to a different port
   systemctl restart sshd
   ```

2. **Set up fail2ban** (protects against brute force):
   ```bash
   apt install -y fail2ban
   systemctl enable fail2ban
   systemctl start fail2ban
   ```

3. **Keep system updated**:
   ```bash
   apt update && apt upgrade -y
   ```

## Access Your CRM

- **Without domain**: `http://YOUR_DROPLET_IP`
- **With domain**: `https://your-domain.com`
- **With SSL**: `https://your-domain.com`

## Notes

- The CRM connects to your backend API, so make sure your backend is accessible
- If your backend has CORS restrictions, you may need to add your CRM domain to allowed origins
- Keep your `.env` file secure and never commit it to Git
- Regularly update dependencies: `npm update`

