# NovaCharts – Implementation Plan

File: `plan.md`  
Purpose: Concrete implementation steps for NovaCharts, aligned with `prd.md`.

---

## 0. Goals

- Stand up a TypeScript monorepo with `@nova/core`, `@nova/api`, and `@nova/web`.
- Integrate Finnhub for candles and FMP for fundamentals.
- Deliver a V1 where:
  - Charts render OHLC with indicators.
  - Alerts trigger emails.
  - Fundamentals are viewable for selected stocks.

---

## 1. Monorepo Setup

1. Create the `nova-charts` repository and initialize git.
2. Add root files:
   - `package.json` (with workspaces)
   - `tsconfig.base.json`
   - `.gitignore`
   - `docs/prd.md`
   - `docs/plan.md`
3. Create directory structure:
   - `packages/core`
   - `apps/api`
   - `apps/web`
4. Configure scripts in root `package.json`:
   - `dev:api`
   - `dev:web`
   - `dev`
   - `build`

---

## 2. Core Library (`@nova/core`)

1. Create `packages/core/package.json` and `tsconfig.json`.
2. Implement domain types in `src/types.ts`:
   - `Timeframe`
   - `Candle`
   - `IndicatorType`, `IndicatorConfig`, `IndicatorSeries`
   - `AlertOperand`, `AlertRule`, `AlertTriggerEvent`
3. Implement indicators in `src/indicators/`:
   - `ema.ts`
   - `sma.ts`
   - `rsi.ts`
   - Optionally `macd.ts` and `bbands.ts`
4. Implement alert engine in `src/engine/alertEngine.ts`:
   - `evaluateAlertRule`
   - `evaluateAlertRulesForCandle`
5. Add simple unit tests (if using a test runner) for EMA, RSI, and basic alert conditions.

---

## 3. Backend Skeleton (`@nova/api`)

1. Create `apps/api/package.json` and `tsconfig.json`.
2. Implement `src/index.ts`:
   - Setup Express or Fastify app.
   - Add middleware for CORS and JSON.
   - Add `/health` endpoint.
3. Create `src/providers/finnhub.ts`:
   - Load API key from `.env`.
   - Implement a function to request candles for symbol + timeframe.
4. Create `src/providers/fmp.ts`:
   - Load API key from `.env`.
   - Implement functions to request income statement, balance sheet, cash flow, and ratios.
5. Create a simple `Symbol` list in code for initial testing.
6. Implement `GET /api/symbols` using that list.

---

## 4. Database and Prisma

1. Add Prisma and SQLite to `apps/api`.
2. Create `prisma/schema.prisma` with models:
   - `Symbol`
   - `Candle`
   - `AlertRule`
   - `AlertEvent`
   - `FundamentalsIncome`
   - `FundamentalsBalance`
   - `FundamentalsCashflow`
   - `FundamentalsRatios`
   - `Layout`
   - `UserSettings`
3. Run `prisma migrate dev` to create the database.
4. Implement symbol seeding (insert the initial symbol list into `Symbol` table).

---

## 5. Market Data Service

1. Implement `marketDataService` in `apps/api`:
   - Function `getCandles(symbolId, timeframe, limit)`:
     - Look up `Symbol` by ID.
     - Check `Candle` table for recent data.
     - If missing or stale, call Finnhub via `finnhubProvider` and upsert candles.
     - Return candles from DB.
2. Implement `GET /api/candles` route:
   - Validate `symbol`, `timeframe`, and `limit` query parameters.
   - Call `marketDataService`.
   - Return normalized candle data.

---

## 6. Fundamentals Service

1. Implement `fundamentalsService` in `apps/api`:
   - `getFundamentals(symbolId)`:
     - Look up `Symbol` and confirm `fmpSymbol`.
     - Check fundamentals tables for the latest snapshot.
     - If stale or missing, call FMP functions and write to DB.
     - Return a consolidated DTO.
2. Implement:
   - `GET /api/fundamentals/{symbolId}`
   - Optional `POST /api/fundamentals/{symbolId}/refresh`

---

## 7. Alerts and Email Pipeline

1. Implement Alerts CRUD:
   - `GET /api/alerts`
   - `POST /api/alerts`
   - `PUT /api/alerts/{id}`
   - `DELETE /api/alerts/{id}`
   - Use Prisma for DB operations and Zod for input validation.
2. Implement scheduler (for example with `node-cron`):
   - For each timeframe used by rules:
     - Load active rules for that timeframe.
     - Use `marketDataService` to get the latest candle(s).
     - Compute indicators required by rules using `@nova/core`.
     - Evaluate rules with `evaluateAlertRulesForCandle`.
     - Insert `AlertEvent` rows for triggers.
3. Implement `emailService`:
   - Load SMTP configuration from `.env`.
   - Provide a function to send an email from an `AlertEvent` and its rule.
4. Implement `POST /api/settings/test-email`:
   - Send a simple test email to verify configuration.
5. Implement `GET /api/alert-events` for recent events:
   - Support filtering by symbol and optional limit.

---

## 8. Frontend (`@nova/web`)

1. Create `apps/web/package.json`, `tsconfig.json`, and Vite config.
2. Implement `src/main.tsx` and `src/App.tsx` with a basic layout:
   - Left: chart area.
   - Right: sidebar with tabs for Alerts and Fundamentals.
3. Implement `ChartView` component:
   - Fetch symbols from `/api/symbols`.
   - Allow user to choose symbol and timeframe.
   - Fetch candles from `/api/candles`.
   - Render a candlestick chart using a chart library.
4. Implement Alerts UI:
   - Form to create an alert (symbol, timeframe, condition type, threshold).
   - List of alerts pulled from `/api/alerts`.
   - Buttons to delete or later toggle status.
5. Implement Fundamentals UI:
   - When a stock symbol is selected, fetch `/api/fundamentals/{symbolId}`.
   - Render a summary, a table of recent quarters, and simple charts.

---

## 9. Settings, Layouts, and UX Polish

1. Implement layout persistence:
   - Store last-used symbol, timeframe, and indicator configuration in `Layout`.
   - On app start, retrieve and re-apply the layout.
2. Implement `UserSettings` support:
   - Theme (dark/light).
   - Default symbol/timeframe.
   - API endpoints `GET /api/settings` and `PUT /api/settings` for non-sensitive settings.
3. UX and error handling:
   - Show messages when network requests fail.
   - Show when data is stale or when FMP/Finnhub calls failed.
   - Show result of test email attempts.

---

## 10. Testing and Hardening

1. Add unit tests in `@nova/core`:
   - Verify EMA, SMA, and RSI against known values.
   - Verify alert conditions (GT, LT, CROSS_ABOVE, CROSS_BELOW).
2. Add integration tests in `@nova/api`:
   - Use mocked providers for Finnhub and FMP.
   - Test `GET /api/candles`, `GET /api/fundamentals`, and alerts CRUD.
   - Test the scheduler path from new candle to `AlertEvent` and email send call.
3. Run performance checks:
   - Chart rendering with several thousand candles.
   - Alert evaluation over dozens of rules.

---

## 11. Next Steps

- Implement the monorepo structure and core library first.
- Then bring up the API with Finnhub and FMP wiring.
- Add persistence and alerts.
- Then build the frontend and fundamentals view.
- Finally, polish settings, layouts, and testing.
