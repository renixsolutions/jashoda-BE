#!/bin/bash

# ==========================================
# Jashoda Jewellers Backend EC2 Setup Script
# Run this on your Ubuntu EC2 Instance
# Usage: sudo bash deploy-ec2.sh
# ==========================================

# Exit immediately if a command exits with a non-zero status
set -e

echo "=========================================="
echo "Starting Backend Setup on EC2..."
echo "=========================================="

echo "1. Updating System Packages..."
apt-get update -y
apt-get upgrade -y

echo "2. Installing Node.js (v18)..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs
apt-get install -y git build-essential nginx

echo "3. Installing PM2 globally..."
npm install -g pm2

echo "4. Setting up Application Directory..."
# Assuming we will place our app in /var/www/jashoda-backend
mkdir -p /var/www/jashoda-backend
chown -R ubuntu:ubuntu /var/www/jashoda-backend

echo "5. Configuring Nginx Reverse Proxy..."
# Overwriting default nginx configuration directly
cat > /etc/nginx/sites-available/default << 'EOF'
server {
    listen 80;
    server_name _; # You can replace _ with your domain name later

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 50M; # allow up to 50MB file uploads
    }
}
EOF

# Test Nginx and restart
nginx -t
systemctl restart nginx

echo "=========================================="
echo "Server Environment Setup Complete!"
echo "Next steps for you (run as 'ubuntu' user, not root):"
echo "1. Clone your git repository to /var/www/jashoda-backend"
echo "2. cd /var/www/jashoda-backend"
echo "3. npm install"
echo "4. Copy your .env details (nano .env)"
echo "5. pm2 start src/index.js --name jashoda-api"
echo "6. pm2 save"
echo "=========================================="
