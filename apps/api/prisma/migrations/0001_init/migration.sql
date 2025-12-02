-- CreateTable
CREATE TABLE "Symbol" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "displayName" TEXT NOT NULL,
    "assetClass" TEXT NOT NULL,
    "finnhubSymbol" TEXT NOT NULL,
    "fmpSymbol" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Candle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "symbolId" INTEGER NOT NULL,
    "timeframe" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "open" REAL NOT NULL,
    "high" REAL NOT NULL,
    "low" REAL NOT NULL,
    "close" REAL NOT NULL,
    "volume" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Candle_symbolId_fkey" FOREIGN KEY ("symbolId") REFERENCES "Symbol" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AlertRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbolId" INTEGER NOT NULL,
    "timeframe" TEXT NOT NULL,
    "conditionType" TEXT NOT NULL,
    "leftOperand" TEXT NOT NULL,
    "rightOperand" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AlertRule_symbolId_fkey" FOREIGN KEY ("symbolId") REFERENCES "Symbol" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AlertEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ruleId" TEXT NOT NULL,
    "symbolId" INTEGER NOT NULL,
    "timeframe" TEXT NOT NULL,
    "triggeredAt" DATETIME NOT NULL,
    "conditionType" TEXT NOT NULL,
    "leftValue" REAL NOT NULL,
    "rightValue" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AlertEvent_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AlertRule" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AlertEvent_symbolId_fkey" FOREIGN KEY ("symbolId") REFERENCES "Symbol" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FundamentalsIncome" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "symbolId" INTEGER NOT NULL,
    "fiscalDate" DATETIME NOT NULL,
    "period" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FundamentalsIncome_symbolId_fkey" FOREIGN KEY ("symbolId") REFERENCES "Symbol" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FundamentalsBalance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "symbolId" INTEGER NOT NULL,
    "fiscalDate" DATETIME NOT NULL,
    "period" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FundamentalsBalance_symbolId_fkey" FOREIGN KEY ("symbolId") REFERENCES "Symbol" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FundamentalsCashflow" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "symbolId" INTEGER NOT NULL,
    "fiscalDate" DATETIME NOT NULL,
    "period" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FundamentalsCashflow_symbolId_fkey" FOREIGN KEY ("symbolId") REFERENCES "Symbol" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FundamentalsRatios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "symbolId" INTEGER NOT NULL,
    "fiscalDate" DATETIME NOT NULL,
    "period" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FundamentalsRatios_symbolId_fkey" FOREIGN KEY ("symbolId") REFERENCES "Symbol" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Layout" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "data" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "defaultSymbolId" INTEGER,
    "defaultTimeframe" TEXT,
    "theme" TEXT,
    "emailDestination" TEXT,
    "preferences" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Candle_symbolId_timeframe_timestamp_idx" ON "Candle"("symbolId", "timeframe", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Candle_symbolId_timeframe_timestamp_key" ON "Candle"("symbolId", "timeframe", "timestamp");

-- CreateIndex
CREATE INDEX "AlertRule_symbolId_timeframe_idx" ON "AlertRule"("symbolId", "timeframe");

-- CreateIndex
CREATE INDEX "AlertEvent_symbolId_timeframe_triggeredAt_idx" ON "AlertEvent"("symbolId", "timeframe", "triggeredAt");

-- CreateIndex
CREATE INDEX "FundamentalsIncome_symbolId_fiscalDate_idx" ON "FundamentalsIncome"("symbolId", "fiscalDate");

-- CreateIndex
CREATE UNIQUE INDEX "FundamentalsIncome_symbolId_fiscalDate_period_key" ON "FundamentalsIncome"("symbolId", "fiscalDate", "period");

-- CreateIndex
CREATE INDEX "FundamentalsBalance_symbolId_fiscalDate_idx" ON "FundamentalsBalance"("symbolId", "fiscalDate");

-- CreateIndex
CREATE UNIQUE INDEX "FundamentalsBalance_symbolId_fiscalDate_period_key" ON "FundamentalsBalance"("symbolId", "fiscalDate", "period");

-- CreateIndex
CREATE INDEX "FundamentalsCashflow_symbolId_fiscalDate_idx" ON "FundamentalsCashflow"("symbolId", "fiscalDate");

-- CreateIndex
CREATE UNIQUE INDEX "FundamentalsCashflow_symbolId_fiscalDate_period_key" ON "FundamentalsCashflow"("symbolId", "fiscalDate", "period");

-- CreateIndex
CREATE INDEX "FundamentalsRatios_symbolId_fiscalDate_idx" ON "FundamentalsRatios"("symbolId", "fiscalDate");

-- CreateIndex
CREATE UNIQUE INDEX "FundamentalsRatios_symbolId_fiscalDate_period_key" ON "FundamentalsRatios"("symbolId", "fiscalDate", "period");
