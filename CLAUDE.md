# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package Manager

**Use pnpm only.** Do not use npm or yarn.

## Project Overview

**NovaCharts** – A personal trading workstation for charting FX/crypto/stocks with technical indicators, email alerts, and fundamentals analysis. Single-user, not multi-tenant.

## Development Commands

- `pnpm dev` - Start development server at localhost:3000
- `pnpm build` - Create production build
- `pnpm start` - Run production server
- `pnpm lint` - Run ESLint

## Architecture

### Monorepo Structure (Target)

The codebase will be organized into three packages with shared TypeScript types:

- **`@nova/core`** - Domain logic: types, indicator calculations, alert evaluation
- **`@nova/api`** - Backend: Express/Fastify, schedulers, provider integrations
- **`@nova/web`** - Frontend: React + TradingView Lightweight Charts

### Data Providers

- **Finnhub** - OHLCV candles and quotes for FX, crypto, stocks. Rate limit ~60 calls/min. Implement backoff on 429 and cache in DB.
- **Financial Modeling Prep (FMP)** - Fundamentals and ratios for equities only. Free tier ~250 calls/day. Cache aggressively, refresh weekly or on-demand.

### Database

SQLite + Prisma for V1. Key tables: `symbols`, `candles`, `alert_rules`, `alert_events`, `fundamentals_*`, `layouts`, `user_settings`.

### Key Patterns

- **Provider abstraction**: `MarketDataProvider` interface for Finnhub, `FundamentalsProvider` for FMP
- **Indicator engine**: Pure TS functions in `@nova/core` taking `Candle[]` + config, returning `IndicatorSeries`
- **Alert evaluation**: Scheduler fetches candles, computes indicators, evaluates rules, sends emails on trigger

## API Endpoints (Backend)

- `GET /api/symbols` - List symbols
- `GET /api/candles?symbol={id}&timeframe={tf}&limit={n}` - Fetch candles (DB first, then Finnhub)
- `GET|POST|PUT|DELETE /api/alerts` - Alert CRUD
- `GET /api/fundamentals/:symbolId` - Cached fundamentals from FMP
- `POST /api/fundamentals/:symbolId/refresh` - Manual refresh

## Frontend

Currently Next.js 16 with App Router, React 19, TypeScript 5, Tailwind CSS 4.

**Path alias:** `@/*` maps to project root.

## V1 Scope

- Candlestick charts with zoom/pan
- Indicators: SMA, EMA, RSI (MACD and Bollinger Bands in V1.1)
- Timeframes: 1m, 5m, 15m, 1h, 4h, 1d
- Alert rules with email delivery
- Fundamentals view for equities (income statement, balance sheet, ratios)
- Layout persistence

## Non-Goals (V1)

- No Telegram/Discord/SMS alerts
- No broker integration
- No multi-user auth
- No Pine-like scripting language
- No mobile apps