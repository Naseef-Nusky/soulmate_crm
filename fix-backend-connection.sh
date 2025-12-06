#!/bin/bash

# Quick fix script for "Cannot connect to backend" error
# Run this on your DigitalOcean droplet

set -e

echo "🔧 Fixing CRM Backend Connection Issue..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

CRM_DIR="/var/www/crm"

# Check if CRM directory exists
if [ ! -d "$CRM_DIR" ]; then
    echo -e "${RED}❌ CRM directory not found at $CRM_DIR${NC}"
    echo "Please make sure the CRM is deployed first."
    exit 1
fi

cd $CRM_DIR

# Get backend URL from user
echo -e "${YELLOW}Enter your backend API URL:${NC}"
echo "Examples:"
echo "  - https://api.gurulink.app"
echo "  - http://your-backend-ip:4000"
echo "  - https://your-backend-domain.com"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Also update backend CORS to allow your CRM domain!${NC}"
echo "   Add your CRM URL to ALLOWED_ORIGINS in backend .env file"
echo ""
read -p "Backend URL: " BACKEND_URL

# Remove trailing slash if present
BACKEND_URL=$(echo "$BACKEND_URL" | sed 's:/*$::')

# Validate URL
if [ -z "$BACKEND_URL" ]; then
    echo -e "${RED}❌ Backend URL cannot be empty${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📝 Setting VITE_API_BASE_URL=$BACKEND_URL${NC}"
echo "VITE_API_BASE_URL=$BACKEND_URL" > .env

echo ""
echo -e "${YELLOW}🔨 Rebuilding application (this may take a minute)...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed! Check the error messages above.${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🔄 Restarting nginx...${NC}"
systemctl restart nginx

echo ""
echo -e "${GREEN}✅ Done!${NC}"
echo ""
echo "Next steps:"
echo "1. Open your CRM in browser"
echo "2. Try logging in again"
echo "3. If still not working, check:"
echo "   - Backend is running: curl $BACKEND_URL/api/admin/auth/me"
echo "   - Backend CORS allows your CRM domain"
echo "   - Firewall allows connections to backend"
echo ""
echo "For more help, see: crm/TROUBLESHOOTING_BACKEND.md"

