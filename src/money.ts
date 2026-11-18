export type Currency = 'AED' | 'BHD';
const decimals: Record<Currency, number> = { AED: 2, BHD: 3 };

/** Parse a non-negative decimal amount exactly, without floating point. */
export function parse(input: string, currency: Currency): bigint {
  const match = /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.(\d+))?$/.exec(input);
  if (!match || (match[1]?.length ?? 0) > decimals[currency]) {
    throw new Error(`Invalid ${currency} amount: ${input}`);
  }
  const [whole, fraction = ''] = input.replaceAll(',', '').split('.');
  return BigInt(whole) * 10n ** BigInt(decimals[currency]) + BigInt(fraction.padEnd(decimals[currency], '0'));
}

export function format(amount: bigint, currency: Currency): string {
  const sign = amount < 0n ? '-' : '';
  const magnitude = amount < 0n ? -amount : amount;
  const scale = 10n ** BigInt(decimals[currency]);
  return `${sign}${magnitude / scale}.${String(magnitude % scale).padStart(decimals[currency], '0')}`;
}

/** Daily interest at 1/2500, rounded half up in minor units. */
export function dailyInterest(balance: bigint): bigint {
  return balance <= 0n ? 0n : (balance + 1250n) / 2500n;
}
