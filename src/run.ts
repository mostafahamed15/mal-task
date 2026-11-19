import { type Day, type DayReport, type Event, Ledger } from './ledger.js';

/** Process events in input order; booked days advance the clock but never rewind it. */
export function run(ledger: Ledger, events: readonly Event[], hooks: {
  beforeClose?: (day: Day, ledger: Ledger) => void;
  afterClose?: (report: DayReport) => void;
} = {}): void {
  const close = (day: Day) => {
    hooks.beforeClose?.(day, ledger);
    const report = ledger.closeDay(day);
    hooks.afterClose?.(report);
  };
  for (const event of events) {
    while (ledger.closed < event.booked - 1) close((ledger.closed + 1) as Day);
    ledger.apply(event);
  }
  while (ledger.closed < 6) close((ledger.closed + 1) as Day);
}
