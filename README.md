# TradeFlow Pro

TradeFlow Pro is a trading journal and performance tracker built with React, Vite, and TypeScript. It is designed to help traders review daily execution, monitor account progress, and keep evaluation rules visible in one place.

## What it does

- Overview dashboard with a compact monthly calendar
- Daily trade review notes and image uploads
- PnL, consistency, and evaluation progress tiles
- Performance page with trade expectancy, win/loss mix, trade count, average trade time, and PnL distribution views
- Trade entry, history, import, and integration screens
- Local persistence for journal notes and evaluation settings
- Dark mode and light mode support based on system preference

## Tech Stack

- React 19
- Vite
- TypeScript
- Tailwind utility classes
- Lucide icons
- Recharts for charting

## Getting Started

### Prerequisites

- Node.js 18 or newer

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

## Configuration

The app reads `GEMINI_API_KEY` from [.env.local](.env.local) for AI-powered features. If you do not use those features, the rest of the app still runs normally.

## Notes

- Calendar and review data persist in the browser via localStorage.
- Evaluation targets are editable in the dashboard and also persist locally.
- The app is intended to run as a local trading journal, not as a multi-user backend service.
