import { dailyInterest, parse, type Currency } from './money.js';

export type Day = 1 | 2 | 3 | 4 | 5 | 6;
type Common = { id: string; account: string; booked: Day; value: Day };
export type Event = Common & (
  | { type: 'CREDIT'; amount: string }
  | { type: 'DEBIT'; amount: string }
  | { type: 'AUTHORIZATION'; authId: string; amount: string }
  | { type: 'SETTLEMENT'; authId: string; amount: string }
  | { type: 'REVERSAL'; target: string }
  | { type: 'INSTALMENT_CREDIT'; amount: string; count: number }
);
export type Entry = { id: string; account: string; amount: bigint; value: Day; source: string; feeDay?: Day; reverses?: string };
export type Auth = { account: string; amount: bigint; state: 'APPROVED' | 'DECLINED' | 'SETTLED' };
export type DayReport = { day: Day; balances: Record<string, bigint>; fees: Entry[]; authorizations: Record<string, Auth>; errors: string[] };
export type InterestReport = { account: string; balances: bigint[]; accruals: bigint[]; total: bigint };

const FEE = 2500n; // AED 25.00 in minor units

export class Ledger {
  readonly #entries: Entry[] = [];
  readonly #auths = new Map<string, Auth[]>();
  readonly #log: string[] = [];
  readonly #reports: DayReport[] = [];
  #closed = 0;
  private readonly seen = new Set<string>();
  private readonly debits = new Set<string>();
  private readonly reinstatementLogged = new Set<string>();
  private logCursor = 0;
  private finalized = false;

  readonly accounts: Readonly<Record<string, Currency>>;

  constructor(accounts: Record<string, Currency>) { this.accounts = Object.freeze({ ...accounts }); }

  // Return detached snapshots so callers cannot mutate the append-only state.
  get entries(): readonly Readonly<Entry>[] { return this.#entries.map(entry => ({ ...entry })); }
  get auths(): ReadonlyMap<string, readonly Readonly<Auth>[]> {
    return new Map([...this.#auths].map(([id, history]) => [id, history.map(auth => ({ ...auth }))]));
  }
  get log(): readonly string[] { return [...this.#log]; }
  get reports(): readonly DayReport[] { return structuredClone(this.#reports); }
  get closed(): number { return this.#closed; }

  balance(account: string, day: Day): bigint {
    return this.#entries.filter(e => e.account === account && e.value <= day).reduce((sum, e) => sum + e.amount, 0n);
  }

  private reject(event: Event, reason: string): void {
    this.#log.push(event.type + '_REJECTED: ' + event.id + ': ' + reason);
  }

  apply(event: Event): void {
    if (this.finalized) throw new Error('Ledger has already been finalized');
    if (this.seen.has(event.id)) { this.reject(event, 'duplicate event id'); return; }
    this.seen.add(event.id);
    const currency = this.accounts[event.account];
    if (!currency) { this.reject(event, 'unknown account'); return; }
    const append = (amount: bigint, extra: Partial<Entry> = {}) => this.#entries.push({
      id: event.id, account: event.account, amount, value: event.value, source: event.id, ...extra,
    });

    if (event.type === 'REVERSAL') {
      const target = this.#entries.find(e => e.id === event.target && e.source === event.target);
      if (!target || target.account !== event.account || target.value !== event.value ||
          this.#entries.some(e => e.feeDay === undefined && e.reverses === event.target) || !this.debits.has(event.target)) {
        this.reject(event, 'target must be an unreversed debit on the same account and value day'); return;
      }
      append(-target.amount, { reverses: event.target });
      return;
    }
    const amount = parse(event.amount, currency);
    if (event.type === 'CREDIT') { append(amount); return; }
    if (event.type === 'DEBIT') { append(-amount); this.debits.add(event.id); return; }
    if (event.type === 'INSTALMENT_CREDIT') {
      if (!Number.isSafeInteger(event.count) || event.count < 1) { this.reject(event, 'invalid instalment count'); return; }
      const count = BigInt(event.count), base = amount / count, remainder = amount % count;
      for (let i = 0n; i < count; i++) append(base + (i < remainder ? 1n : 0n), { id: event.id + ':' + (i + 1n) });
      return;
    }
    const history = this.#auths.get(event.authId);
    const current = history?.at(-1);
    if (event.type === 'AUTHORIZATION') {
      if (history) { this.reject(event, 'authorization id already used'); return; }
      const holds = [...this.#auths.values()].map(h => h.at(-1)!).filter(a => a.account === event.account && a.state === 'APPROVED').reduce((sum, a) => sum + a.amount, 0n);
      const state = this.balance(event.account, event.booked) - holds - amount >= 0n ? 'APPROVED' : 'DECLINED';
      this.#auths.set(event.authId, [{ account: event.account, amount, state }]);
      return;
    }
    if (!current || current.account !== event.account || current.state !== 'APPROVED' || amount > current.amount) {
      this.reject(event, 'no matching approved hold or amount exceeds hold'); return;
    }
    append(-amount);
    history!.push({ ...current, state: 'SETTLED' });
  }

  closeDay(day: Day): DayReport {
    if (this.finalized) throw new Error('Ledger has already been finalized');
    if (day > this.#closed + 1 || day < this.#closed) throw new Error('Days must close in order');
    const start = this.#entries.length;
    for (const [account, currency] of Object.entries(this.accounts)) {
      for (let d = 1; d <= day; d++) {
        const feeId = 'FEE:' + account + ':' + d;
        const assessment = this.#entries.find(e => e.account === account && e.feeDay === d && e.source === 'FEE');
        const reversed = this.#entries.some(e => e.account === account && e.feeDay === d && e.source === 'FEE_REVERSAL' && e.reverses === feeId);
        const preFee = this.#entries.filter(e => e.account === account && e.value <= d &&
          (e.feeDay === undefined || e.feeDay < d))
          .reduce((sum, e) => sum + e.amount, 0n);
        if (preFee < 0n && !assessment) {
          if (currency !== 'AED') throw new Error('Fee currency unsupported for ' + account);
          this.#entries.push({ id: feeId, account, amount: -FEE, value: d as Day, source: 'FEE', feeDay: d as Day });
        } else if (preFee >= 0n && assessment && !reversed) {
          this.#entries.push({ id: 'FEE_REVERSAL:' + account + ':' + d, account, amount: -assessment.amount, value: d as Day, source: 'FEE_REVERSAL', feeDay: d as Day, reverses: feeId });
        } else if (preFee < 0n && assessment && reversed && !this.reinstatementLogged.has(feeId)) {
          this.#log.push('FEE_REINSTATEMENT_UNSUPPORTED: ' + account + ' day ' + d);
          this.reinstatementLogged.add(feeId);
        }
      }
    }
    this.#closed = day;
    const balances = Object.fromEntries(Object.keys(this.accounts).map(a => [a, this.balance(a, day)]));
    const authorizations = Object.fromEntries([...this.#auths].map(([id, h]) => [id, { ...h.at(-1)! }]));
    const report = { day, balances, fees: this.#entries.slice(start), authorizations, errors: this.#log.slice(this.logCursor) };
    this.logCursor = this.#log.length;
    this.#reports.push(report);
    return structuredClone(report);
  }

  finalize(): InterestReport[] {
    if (this.finalized) throw new Error('Ledger has already been finalized');
    if (this.#closed !== 6) throw new Error('Close day 6 before finalization');
    const result = Object.keys(this.accounts).map(account => {
      const balances = ([1, 2, 3, 4, 5, 6] as Day[]).map(day => this.balance(account, day));
      const accruals = balances.map(dailyInterest), total = accruals.reduce((a, b) => a + b, 0n);
      return { account, balances, accruals, total };
    });
    for (const item of result) this.#entries.push({ id: 'INTEREST:' + item.account, account: item.account, amount: item.total, value: 6, source: 'INTEREST' });
    this.finalized = true;
    return result;
  }
}
