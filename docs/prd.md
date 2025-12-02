# PRD – NovaCharts (Personal Charting & Alert Platform)

> Data Providers: **Finnhub** (prices, intraday candles) + **Financial Modeling Prep (FMP)** (fundamentals & ratios)  
> Target: **Personal use only** – no multi-tenant SaaS

---

## 1. Product Overview

### 1.1 Vision

NovaCharts is a **personal trading workstation** that combines:

- Fast, clean charts for FX / crypto / stocks.
- Built-in technical indicators.
- **Reliable email alerts** based on indicator conditions.
- A **Fundamentals view** powered by financial statements and ratios.
- A **TypeScript-first full-stack architecture** that plays nicely with Claude Code.

The focus is on **one power user** (you), not on scalability to many customers. Design choices should prioritize clarity, control, and hackability.

---

## 2. Objectives & Non-Goals

### 2.1 Objectives (V1)

1. **Charting Workspace**

   - Interactive candlestick charts with OHLCV data.
   - Multiple timeframes (e.g. 1m, 5m, 15m, 1H, 4H, 1D).
   - Saved layouts (indicators + symbol/timeframe preferences).

2. **Indicator Engine**

   - Core indicators:
     - SMA, EMA
     - RSI
     - MACD (stretch for V1.0, allowed in V1.1)
     - Bollinger Bands
   - Clear TS interfaces so indicators can be extended.

3. **Alerts with Email Delivery**

   - Create rules like:
     - “RSI(14) crosses above 70 on EURUSD 1H.”
     - “Close price crosses above EMA(100).”
   - Evaluate rules on new candles.
   - Send structured email alerts.

4. **Fundamentals View (via FMP)**

   - For selected **equities**:
     - Income statement, balance sheet, cash flow.
     - Ratios (P/E, margins, leverage).
   - Time-series charts for key metrics (revenue, net income, EPS).

5. **TypeScript Full Stack**
   - Shared domain types across:
     - `@nova/core` (indicators & alerts logic).
     - `@nova/api` (backend).
     - `@nova/web` (frontend).
   - Clean provider abstraction for Finnhub & FMP.

### 2.2 Non-Goals (for V1)

- No Telegram/Discord/SMS alerts (email only).
- No broker/order execution integration.
- No public multi-user environment or auth system beyond what’s needed for personal security.
- No full scripting language (Pine-like) in V1; alerts are built via UI condition builder.
- No native mobile apps (desktop web first; responsive later).

---

## 3. Target User & Use Cases

### 3.1 Target User

- Single **trader–developer**:
  - Trades FX and/or crypto daily; may also watch selective stocks.
  - Comfortable with indicators and backtesting ideas.
  - Uses AI tools (Claude Code, GPT) for rapid iteration.

### 3.2 Core Use Cases

1. **Intraday or Swing Analysis**

   - Select symbol (e.g. EURUSD, BTCUSD, AAPL).
   - Pick timeframe (1m–1D).
   - Apply indicators and visually inspect price action.

2. **Alert Rule Creation & Monitoring**

   - Define indicator/price conditions.
   - Receive email when signal occurs.
   - View historical triggers (alert log).

3. **Fundamental Review for Equities**

   - Open a stock’s Fundamentals tab.
   - See 3–5 years of financial statement history.
   - See valuation metrics (P/E, margins, ROE, etc.).

4. **Layout Persistence**
   - The app “remembers” preferred layout across sessions.

---

## 4. Data Providers & Constraints

### 4.1 Finnhub – Market Data

**Purpose:** OHLCV candles + quotes for FX, crypto, and stocks.

- Used for:
  - `candles` table (intraday & EOD data).
  - Chart rendering.
  - Alert evaluations.

**Key constraints (free tier, personal use):**

- Enough rate limit (≈60 calls/min) for:
  - ~10–20 symbols with multiple timeframes.
  - 1–15 minute polling intervals for alert evaluation.
- Must implement:
  - Backoff on HTTP 429 (rate-limit) and retry logic.
  - Caching in local DB (no repeated calls for same period).

### 4.2 Financial Modeling Prep (FMP) – Fundamentals

**Purpose:** Financial statements & ratios for equities.

- Used for:
  - `fundamentals` tables (income, balance sheet, cash flow, ratios).
  - Fundamentals view in UI.
- Free tier ≈250 calls/day:
  - Sufficient to cover a **watchlist** of ~20–50 equities if refreshed weekly or around earnings.
  - Requires caching & infrequent refresh (not intraday).

### 4.3 Symbol Mapping

- Maintain internal `Symbol` objects mapping:
  - `internalSymbolId` → Finnhub symbol (e.g. `OANDA:EUR_USD`, `BINANCE:BTCUSDT`, `AAPL`)
  - `internalSymbolId` → FMP symbol (e.g. `AAPL`, `MSFT` – equities only).
- FX/crypto likely only use Finnhub.
- Equities can use both.

---

## 5. Functional Requirements

### 5.1 Data & Symbols

**FR-1** – Symbol Management

- Store a list of symbols:
  - `id`, `displayName`, `assetClass` (FX, CRYPTO, STOCK).
  - `finnhubSymbol` (required).
  - `fmpSymbol` (optional; for stocks).

**FR-2** – Candle Retrieval

- Backend provides:
  - `GET /api/candles?symbol=ID&timeframe=1h&limit=500`
- Implementation:
  - Try local DB first.
  - If missing/old data:
    - Call Finnhub, normalize, store in DB, return to client.

**FR-3** – Timeframes

- Support at least:
  - `"1m"`, `"5m"`, `"15m"`, `"1h"`, `"4h"`, `"1d"`.
- Mapping strategy to Finnhub’s resolution codes in provider layer.

### 5.2 Charting UI

**FR-4** – Interactive Charts

- Zoom, pan, hover for OHLC and volume.
- Timeframe buttons & symbol selector.
- Display indicator overlays and sub-panels.

**FR-5** – Indicators

- User can:
  - Add/remove indicators (EMA, SMA, RSI; MACD & BBANDS later).
  - Set parameters (length, source).
- Chart visuals:
  - Overlays: MA, BBANDS.
  - Sub-charts: RSI, MACD.

**FR-6** – Layout Persistence

- Store layout:
  - Selected symbol(s).
  - Timeframe.
  - Indicators & settings.
- Load last layout automatically on app start.

### 5.3 Indicator Engine

**FR-7** – Backend Indicator Computation

- Indicators computed in `@nova/core` using TS functions.
- Input: `Candle[]`, `IndicatorConfig`.
- Output: `IndicatorSeries`.
- `@nova/api` either:
  - Precomputes and sends indicator series alongside candles, or
  - Provides an `/api/indicators` endpoint for UI.

**FR-8** – Extensibility

- New indicators can be added by:
  - Implementing new calculator function.
  - Extending indicator type union.
  - No changes required in alert engine core.

### 5.4 Alerts

**FR-9** – Alert Rule Model

- Each rule includes:
  - `id`, `symbolId`, `timeframe`.
  - `conditionType` (`GT`, `LT`, `CROSS_ABOVE`, `CROSS_BELOW`).
  - `leftOperand` (price/indicator).
  - `rightOperand` (indicator/number).
  - `active` flag.
  - Timestamps.

**FR-10** – Alert Evaluation Loop

- Scheduler (cron or similar) runs for each timeframe:
  - Fetch latest candles per symbol from DB/Finnhub.
  - Compute required indicators.
  - Evaluate rules using `evaluateAlertRulesForCandle`.
  - Record any `AlertEvent`s and send emails.

**FR-11** – Email Alerts

- On trigger:
  - Send email with:
    - Symbol, timeframe, condition text.
    - Trigger price & indicator values.
    - Timestamp.
- Email config (SMTP credentials) loaded from environment variables and/or a settings file (never sent to frontend).

**FR-12** – Alert Management UI

- List all active and paused alerts.
- Create/update/delete alerts.
- Optionally test an alert on last candle to validate conditions.

### 5.5 Fundamentals

**FR-13** – Fundamentals Fetch (Backend)

- For a stock symbol with `fmpSymbol`, provide:
  - `GET /api/fundamentals/:symbolId` returning:
    - Last N years of:
      - Income statements.
      - Balance sheets.
      - Cash flows.
    - Key ratios:
      - P/E, EV/EBITDA, margins, ROE, debt/equity, etc.
- Implementation:
  - Check local DB for cached fundamentals.
  - If older than configured `refreshInterval` (e.g. 7 days) or any explicit “refresh” call:
    - Call FMP endpoints.
    - Upsert into DB.

**FR-14** – Fundamentals UI

- From chart, user can switch to **Fundamentals** tab:
  - Summary block: market cap, P/E, EPS, sector, beta.
  - Time-series charts:
    - Revenue & net income.
    - Free cash flow.
  - Table view of last 4–8 reporting periods.

**FR-15** – FMP Call Budget Handling

- Respect free tier call limit (~250/day) by:
  - Only refreshing fundamentals when manually requested **or** on a slow schedule (e.g. nightly/weekly).
  - Keeping a simple log of calls used per day (optional).

---

## 6. Non-Functional Requirements

### 6.1 Performance

- Chart load:
  - ≤ 1 second for up to ~2,000 candles.
- Alert evaluation loop:
  - Must complete within the polling interval (e.g. under 10–20 seconds for all rules).

### 6.2 Reliability

- If Finnhub fails:
  - Use last known candles; show warning in UI.
- If FMP fails:
  - Show stale data with timestamp and indicate last refresh.
- If email send fails:
  - Record failure, allow user to see in log.

### 6.3 Security

- API keys for Finnhub & FMP are stored only in backend `.env`, never in frontend.
- If app is exposed over internet:
  - Consider minimal auth (single password or IP restriction).
  - Rate limit external access to prevent abuse.

### 6.4 Maintainability

- Provider abstraction:
  - `MarketDataProvider` interface for Finnhub now; later can support additional providers.
  - `FundamentalsProvider` interface for FMP.
- Clear separation:
  - `@nova/core` – domain logic (types, indicators, alerts).
  - `@nova/api` – HTTP API + schedulers + provider integration.
  - `@nova/web` – React UI.

---

## 7. Tech Stack

### 7.1 Frontend

- Framework: **React + TypeScript**
- Bundler: **Vite** (or Next.js if SSR/routing needed).
- Charting: **TradingView Lightweight Charts** or similar TS-friendly library.
- Styling: minimal CSS/Tailwind or basic inline styles for V1.

### 7.2 Backend

- Runtime: **Node.js + TypeScript**
- Framework: **Express** or **Fastify**.
- Scheduler: **node-cron** or lightweight loop for alert evaluation.
- HTTP client: `fetch`/`axios`/`undici` for API calls to Finnhub & FMP.

### 7.3 Database

- V1: **SQLite + Prisma** (simple single-user deployment).
- Possible future: Postgres (self-hosted or managed).

Tables (high-level):

- `symbols`
- `candles`
- `indicators_cache` (optional)
- `alert_rules`
- `alert_events`
- `fundamentals_income`
- `fundamentals_balance`
- `fundamentals_cashflow`
- `fundamentals_ratios`
- `layouts`
- `user_settings` (theme, default symbol, etc.)

---

## 8. API Overview (Backend)

### 8.1 Market Data

- `GET /api/symbols`
- `GET /api/candles?symbol={id}&timeframe={tf}&limit={n}`

### 8.2 Alerts

- `GET /api/alerts`
- `POST /api/alerts`
- `PUT /api/alerts/:id`
- `DELETE /api/alerts/:id`

### 8.3 Fundamentals

- `GET /api/fundamentals/:symbolId`
- `POST /api/fundamentals/:symbolId/refresh` (optional manual refresh)

### 8.4 Settings

- `GET /api/settings` (non-sensitive prefs)
- `POST /api/settings/test-email`

---

## 9. Release Plan

### 9.1 V1.0 – Core Platform

- Finnhub integration:
  - Candles for FX + at least 1–3 test stocks.
- Chart UI:
  - Candlesticks, EMA, RSI overlays.
- Alerts:
  - Price vs threshold alerts.
  - Email sending for triggers.
- FMP integration:
  - Fetch & display last few reports + ratios for a handful of stocks.

### 9.2 V1.1 – Enhanced Indicators & Fundamentals

- Add MACD, Bollinger Bands.
- Improve alert condition builder (indicator vs indicator).
- Expand fundamentals graphs and summary.
- Add layout persistence and simple theme toggle.

### 9.3 V1.2+ – Refinement

- Better cross detection (use previous bar values).
- Visual markers on chart for past alert events.
- Richer alert logs and email templates.
- Optional simple login and remote deployment.

---

## 10. Success Criteria

- You can:
  - Open NovaCharts, select a symbol & timeframe, and see candles + EMA/RSI.
  - Create alerts that reliably send email on Finnhub data.
  - View up-to-date financial statements & key ratios for selected stocks from FMP.
- Codebase:
  - Fully in TypeScript.
  - Clear separation of concerns (core/API/web/providers).
  - Easy to extend with new indicators, symbols, and data providers.

---
