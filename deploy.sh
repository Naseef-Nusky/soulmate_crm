#!/bin/bash

# CRM Deployment Script for DigitalOcean Droplet
# Run this script on your droplet after initial setup

set -e  # Exit on error

echo "🚀 Starting CRM Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
apt update && apt upgrade -y

# Install Node.js if not installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi

# Install nginx if not installed
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}📦 Installing nginx...${NC}"
    apt install -y nginx
fi

# Install git if not installed
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}📦 Installing git...${NC}"
    apt install -y git
fi

# Navigate to CRM directory
CRM_DIR="/var/www/crm"
if [ ! -d "$CRM_DIR" ]; then
    echo -e "${YELLOW}📁 Creating CRM directory...${NC}"
    mkdir -p /var/www
    echo -e "${RED}⚠️  CRM directory not found at $CRM_DIR${NC}"
    echo -e "${YELLOW}Please clone your repository first:${NC}"
    echo "  cd /var/www"
    echo "  git clone https://github.com/Naseef-Nusky/soulmate_crm.git crm"
    exit 1
fi

cd $CRM_DIR

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚙️  Creating .env file...${NC}"
    echo "VITE_API_URL=https://api.gurulink.app" > .env
    echo -e "${GREEN}✅ .env file created. Please edit it with your backend URL:${NC}"
    echo "  nano $CRM_DIR/.env"
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing npm dependencies...${NC}"
npm install

# Build the application
echo -e "${YELLOW}🔨 Building production version...${NC}"
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed! dist directory not found.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful!${NC}"

# Configure nginx
echo -e "${YELLOW}⚙️  Configuring nginx...${NC}"

# Get server IP or domain
SERVER_NAME=$(hostname -I | awk '{print $1}')
read -p "Enter your domain name (or press Enter to use IP: $SERVER_NAME): " DOMAIN
if [ -z "$DOMAIN" ]; then
    DOMAIN=$SERVER_NAME
fi

# Create nginx config
cat > /etc/nginx/sites-available/crm <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    root $CRM_DIR/dist;
    index index.html;

    # Serve static files
    location / {
        try_files \$uri \$uri/ /index.html;
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
EOF

# Enable site
if [ ! -L /etc/nginx/sites-enabled/crm ]; then
    ln -s /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/
fi

# Remove default site if exists
if [ -L /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
fi

# Test nginx configuration
echo -e "${YELLOW}🧪 Testing nginx configuration...${NC}"
if nginx -t; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
else
    echo -e "${RED}❌ Nginx configuration has errors${NC}"
    exit 1
fi

# Restart nginx
echo -e "${YELLOW}🔄 Restarting nginx...${NC}"
systemctl restart nginx
systemctl enable nginx

# Configure firewall
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
ufw allow 'Nginx Full'
ufw allow OpenSSH
ufw --force enable

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${GREEN}🌐 Your CRM should be accessible at:${NC}"
echo -e "   http://$DOMAIN"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Update .env file with your backend API URL:"
echo "   nano $CRM_DIR/.env"
echo ""
echo "2. Rebuild after updating .env:"
echo "   cd $CRM_DIR && npm run build && systemctl reload nginx"
echo ""
echo "3. (Optional) Set up SSL with Let's Encrypt:"
echo "   apt install -y certbot python3-certbot-nginx"
echo "   certbot --nginx -d $DOMAIN"
echo ""

