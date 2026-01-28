# InkWall Backend

Node.js API server for the InkWall wallpaper app.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file and add your API keys
cp .env.example .env

# Initialize database
npm run db:init

# Seed with initial wallpapers (requires API keys)
npm run db:seed

# Start development server
npm run dev
```

## API Keys (Free)

1. **Unsplash** (Required): https://unsplash.com/developers
2. **Pexels** (Optional fallback): https://www.pexels.com/api/

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/wallpapers` | List wallpapers (paginated) |
| GET | `/api/wallpapers/:id` | Get single wallpaper |
| GET | `/api/wallpapers/category/:slug` | Wallpapers by category |
| POST | `/api/wallpapers/:id/download` | Track download |
| GET | `/api/categories` | List all categories |
| GET | `/api/categories/:slug` | Get single category |

## Query Parameters

### GET /api/wallpapers

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page (max 50) |
| category | string | null | Filter by category slug |
| sort | string | popular | Sort: popular, newest, random |

## Cron Jobs

Wallpapers are automatically fetched every 6 hours at 00:00, 06:00, 12:00, and 18:00 UTC.
