# TelegramBotWebChat
This repository contains two integrated projects:

1. **Telegram Bot**: An AI-powered Telegram bot that conducts user surveys, engages in AI dialogue using GPT-4, and integrates with Bitrix24 CRM.
2. **Web Chat Widget**: A web-based chat interface with similar functionality for embedding on websites.

Both implementations share similar functionality:
- Contact information capture
- Dynamic user surveys
- AI dialogue using GPT-4
- Bitrix24 CRM integration
- Manager assistance capabilities

## Repository Structure

```

ai-chat-system/
├── telegram-bot/             # Telegram bot implementation
├── web-chat/                 # Web chat implementation
├── docs/                     # Additional documentation
└── docker-compose.yml        # Docker Compose configuration

```plaintext

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Bitrix24 account with REST API access
- OpenAI API key
- Telegram Bot Token (for Telegram bot)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/alexamir/TelegramBotWebChat.git
cd TelegramBotWebChat
```

2. Set up the Telegram bot:


```shellscript
cd telegram-bot
cp .env.example .env
# Edit .env with your credentials
npm install
```

3. Set up the web chat:


```shellscript
cd ../web-chat
cp .env.example .env
# Edit .env with your credentials
npm install
```

4. Start both services in development mode:


```shellscript
# In telegram-bot directory
npm run dev

# In web-chat directory
npm run dev
```

## Deployment Options

### Vercel Deployment

Both projects are optimized for deployment on Vercel. See [docs/deployment.md](docs/deployment.md) for detailed instructions.

### Docker Deployment

For containerized deployment:

```shellscript
# Start both services with Docker Compose
docker-compose up -d
```

### VPS Deployment

For manual deployment on a VPS, see [docs/deployment.md](docs/deployment.md) for step-by-step instructions.

## Documentation

- [API Documentation](docs/api.md)
- [Database Schema](docs/database.md)
- [Deployment Guide](docs/deployment.md)
- [Telegram Bot README](telegram-bot/README.md)
- [Web Chat README](web-chat/README.md)


## Environment Variables

Both projects use `.env` files for configuration. See the `.env.example` files in each project directory for required variables.

## License

MIT
EOL

```plaintext

## Create Additional Documentation Files

```bash
# Create docs/deployment.md
mkdir -p docs
cat > docs/deployment.md << 'EOL'
# Deployment Guide

This document provides detailed instructions for deploying the AI Chat System using different methods.

## Table of Contents

- [Vercel Deployment](#vercel-deployment)
- [Docker Deployment](#docker-deployment)
- [VPS Deployment](#vps-deployment)
- [Environment Variables](#environment-variables)

## Vercel Deployment

### Telegram Bot Deployment

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Log in to [Vercel](https://vercel.com) and create a new project
3. Import your Git repository
4. Configure the project:
   - Root Directory: `telegram-bot`
   - Framework Preset: Next.js
5. Add environment variables from `.env.example`
6. Deploy the project
7. After deployment, set up the database tables by visiting:
```

[https://your-vercel-domain.com/api/setup-db?secret=YOUR_SETUP_SECRET](https://your-vercel-domain.com/api/setup-db?secret=YOUR_SETUP_SECRET)

```plaintext
8. Set up the Telegram webhook by visiting:
```

[https://your-vercel-domain.com/api/telegram/webhook?secret=YOUR_WEBHOOK_SECRET](https://your-vercel-domain.com/api/telegram/webhook?secret=YOUR_WEBHOOK_SECRET)

```plaintext

### Web Chat Deployment

1. Push your code to a Git repository
2. Log in to Vercel and create a new project
3. Import your Git repository
4. Configure the project:
- Root Directory: `web-chat`
- Framework Preset: Next.js
5. Add environment variables from `.env.example`
6. Deploy the project
7. After deployment, set up the database tables by visiting:
```

[https://your-vercel-domain.com/api/setup-db?secret=YOUR_SETUP_SECRET](https://your-vercel-domain.com/api/setup-db?secret=YOUR_SETUP_SECRET)

```plaintext

## Docker Deployment

### Prerequisites

- Docker and Docker Compose installed
- PostgreSQL database (can be run in Docker or externally)

### Steps

1. Clone the repository:
```bash
git clone https://github.com/alexamir/TelegramBotWebChat.git
cd TelegramBotWebChat
```

2. Create `.env` files for both projects based on the `.env.example` files
3. Build and start the containers:

```shellscript
docker-compose up -d
```


4. Set up the database tables:

```shellscript
# For Telegram bot
curl "http://localhost:3000/api/setup-db?secret=YOUR_SETUP_SECRET"

# For web chat
curl "http://localhost:3001/api/setup-db?secret=YOUR_SETUP_SECRET"
```


5. Set up the Telegram webhook:

```shellscript
curl "http://localhost:3000/api/telegram/webhook?secret=YOUR_WEBHOOK_SECRET"
```




## VPS Deployment

### Prerequisites

- Ubuntu 20.04 or later
- Node.js 18+
- PostgreSQL
- Nginx
- PM2 (for process management)


### Steps

1. Update system packages:

```shellscript
sudo apt update && sudo apt upgrade -y
```


2. Install Node.js:

```shellscript
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```


3. Install PostgreSQL:

```shellscript
sudo apt install postgresql postgresql-contrib -y
```


4. Create a database and user:

```shellscript
sudo -u postgres psql
CREATE DATABASE ai_chat;
CREATE USER ai_chat_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ai_chat TO ai_chat_user;
\q
```


5. Install PM2:

```shellscript
sudo npm install -g pm2
```


6. Clone the repository:

```shellscript
git clone https://github.com/alexamir/TelegramBotWebChat.git
cd TelegramBotWebChat
```


7. Set up the Telegram bot:

```shellscript
cd telegram-bot
cp .env.example .env
# Edit .env with your credentials
npm install
npm run build
pm2 start npm --name "telegram-bot" -- start
```


8. Set up the web chat:

```shellscript
cd ../web-chat
cp .env.example .env
# Edit .env with your credentials
npm install
npm run build
pm2 start npm --name "web-chat" -- start
```


9. Install and configure Nginx:

```shellscript
sudo apt install nginx -y
```


10. Create Nginx configuration files:

```shellscript
sudo nano /etc/nginx/sites-available/telegram-bot
```

Add the following configuration:

```plaintext
server {
    listen 80;
    server_name your-telegram-bot-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Create another configuration for the web chat:

```shellscript
sudo nano /etc/nginx/sites-available/web-chat
```

Add the following configuration:

```plaintext
server {
    listen 80;
    server_name your-web-chat-domain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```


11. Enable the sites:

```shellscript
sudo ln -s /etc/nginx/sites-available/telegram-bot /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/web-chat /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```


12. Set up SSL with Let's Encrypt:

```shellscript
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-telegram-bot-domain.com
sudo certbot --nginx -d your-web-chat-domain.com
```


13. Set up the database tables:

```shellscript
# For Telegram bot
curl "https://your-telegram-bot-domain.com/api/setup-db?secret=YOUR_SETUP_SECRET"

# For web chat
curl "https://your-web-chat-domain.com/api/setup-db?secret=YOUR_SETUP_SECRET"
```


14. Set up the Telegram webhook:

```shellscript
curl "https://your-telegram-bot-domain.com/api/telegram/webhook?secret=YOUR_WEBHOOK_SECRET"
```




## Environment Variables

### Common Variables

- `BITRIX24_WEBHOOK_URL`: Your Bitrix24 webhook URL
- `SETUP_SECRET`: Secret key for database setup
- `VERCEL_URL`: Your Vercel deployment URL (or domain name)


### Telegram Bot Variables

- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
- `WEBHOOK_SECRET`: Secret key for webhook setup


### Web Chat Variables

- `NEXT_PUBLIC_CHAT_TITLE`: Title for the chat widget
- `NEXT_PUBLIC_COMPANY_NAME`: Your company name


See the `.env.example` files in each project directory for a complete list of required variables.
EOL

# Create .env.example files

cat > telegram-bot/.env.example << 'EOL'

# Telegram Bot Configuration

TELEGRAM_BOT_TOKEN=your_telegram_bot_token
WEBHOOK_SECRET=your_webhook_secret

# Bitrix24 Configuration

BITRIX24_WEBHOOK_URL=your_bitrix24_webhook_url

# Database Configuration

POSTGRES_URL=postgres://user:password@localhost:5432/dbname

# Security

SETUP_SECRET=your_setup_secret

# Deployment

VERCEL_URL=your_vercel_url
EOL

cat > web-chat/.env.example << 'EOL'

# Bitrix24 Configuration

BITRIX24_WEBHOOK_URL=your_bitrix24_webhook_url

# Database Configuration

POSTGRES_URL=postgres://user:password@localhost:5432/dbname

# Security

SETUP_SECRET=your_setup_secret

# Deployment

VERCEL_URL=your_vercel_url

# Chat Widget Configuration

NEXT_PUBLIC_CHAT_TITLE=AI Assistant
NEXT_PUBLIC_COMPANY_NAME=Your Company Name
EOL

# Create docker-compose.yml

cat > docker-compose.yml << 'EOL'
version: '3'

services:
telegram-bot:
build:
context: ./telegram-bot
ports:
- "3000:3000"
environment:
- TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
- BITRIX24_WEBHOOK_URL=${BITRIX24_WEBHOOK_URL}
- WEBHOOK_SECRET=${WEBHOOK_SECRET}
- SETUP_SECRET=${SETUP_SECRET}
- POSTGRES_URL=${POSTGRES_URL}
- VERCEL_URL=${VERCEL_URL}
depends_on:
- postgres
restart: unless-stopped

web-chat:
build:
context: ./web-chat
ports:
- "3001:3000"
environment:
- BITRIX24_WEBHOOK_URL=${BITRIX24_WEBHOOK_URL}
- SETUP_SECRET=${SETUP_SECRET}
- POSTGRES_URL=${POSTGRES_URL}
- VERCEL_URL=${VERCEL_URL}
- NEXT_PUBLIC_CHAT_TITLE=${NEXT_PUBLIC_CHAT_TITLE}
- NEXT_PUBLIC_COMPANY_NAME=${NEXT_PUBLIC_COMPANY_NAME}
depends_on:
- postgres
restart: unless-stopped

postgres:
image: postgres:14
ports:
- "5432:5432"
environment:
- POSTGRES_USER=${POSTGRES_USER}
- POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
- POSTGRES_DB=${POSTGRES_DB}
volumes:
- postgres-data:/var/lib/postgresql/data
restart: unless-stopped

volumes:
postgres-data:
EOL

# Create .gitignore

cat > .gitignore << 'EOL'

# dependencies

node_modules
.pnp
.pnp.js

# testing

coverage

# next.js

.next/
out/
build

# misc

.DS_Store
*.pem

# debug

npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files

.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# vercel

.vercel

# typescript

*.tsbuildinfo
next-env.d.ts
EOL

```plaintext

## Commit and Push Your Changes

Now that you've added files to your repository, commit and push them:

```bash
git add .
git commit -m "Set up repository structure and add documentation"
git push
```

## Next Steps

After successfully pushing these changes, you should be able to see your repository structure on GitHub. From there, you can:

1. **Add your code** to the appropriate directories:

1. Copy your Telegram bot code to the `telegram-bot` directory
2. Copy your web chat code to the `web-chat` directory



2. **Set up package.json files** in both project directories:

```shellscript
cd telegram-bot
npm init -y
npm install next react react-dom @vercel/postgres ai @ai-sdk/openai

cd ../web-chat
npm init -y
npm install next react react-dom @vercel/postgres ai @ai-sdk/openai
```


3. **Deploy your applications** following the instructions in the deployment guide.
