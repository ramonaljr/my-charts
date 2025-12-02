import { AssetClass } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { defaultSymbols } from "../providers/symbols";

export async function ensureSymbolsSeeded() {
  const existing = await prisma.symbol.findMany({
    select: { displayName: true },
  });
  const existingNames = new Set(existing.map((s) => s.displayName));
  const missing = defaultSymbols.filter((s) => !existingNames.has(s.displayName));
  if (missing.length === 0) return;

  await prisma.symbol.createMany({
    data: missing.map((s) => ({
      displayName: s.displayName,
      assetClass: s.assetClass as AssetClass,
      finnhubSymbol: s.finnhubSymbol,
      fmpSymbol: s.fmpSymbol,
    })),
  });
}

export function listSymbols() {
  return prisma.symbol.findMany({
    orderBy: { id: "asc" },
  });
}

export function getSymbolById(id: number) {
  return prisma.symbol.findUnique({ where: { id } });
}
