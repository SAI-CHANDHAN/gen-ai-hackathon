# KraftAI - AI-Powered Cultural Heritage Marketplace Assistant

## Overview
KraftAI bridges traditional craftsmanship with modern digital marketing through AI-powered content generation and cultural heritage intelligence.

## Features
- Image-based craft analysis with cultural context
- AI-generated product descriptions with SEO optimization
- Traditional artisan story generation
- Visual analysis-based pricing recommendations
- Social media content for multiple platforms
- Market intelligence with trend analysis

## Setup Instructions

### Prerequisites
- Node.js 18.0.0 or higher
- Google Cloud Project with enabled APIs:
  - Vision API
  - Vertex AI API
  - Gemini API

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see .env.example)
4. Deploy to Google Cloud: `npm run deploy`

### Local Development
1. `npm run dev` - Start development server
2. Open `http://localhost:8080`
3. Upload craft image and generate content

## API Endpoints
- `POST /api/generate-description` - Product descriptions
- `POST /api/generate-story` - Artisan stories
- `POST /api/generate-pricing-from-image` - Image-based pricing
- `POST /api/generate-social-content` - Social media content
- `POST /api/analyze-image` - Image analysis
- `GET /api/cultural-context/:category` - Cultural heritage data
- `GET /api/market-trends/:category` - Market trend analysis

## Architecture
Frontend (HTML/CSS/JS) ↔ Backend (Node.js/Express) ↔ Google Cloud APIs ↔ Cultural Heritage Database

## Impact
- Empowers 10,000+ traditional artisans with digital marketing capabilities
- Preserves and promotes Indian cultural heritage
- Increases artisan income through better product positioning