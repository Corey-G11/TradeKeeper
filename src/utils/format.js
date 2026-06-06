// Small formatting helpers shared across the app.

export const fmtMoney = (n) => {
  const v = Number(n) || 0;
  const sign = v < 0 ? '-' : '';
  return `${sign}$${Math.abs(v).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const fmtNum = (n, dp = 2) => {
  const v = Number(n);
  if (Number.isNaN(v)) return '—';
  return v.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: dp,
  });
};

export const fmtDate = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Local YYYY-MM-DD key (used for streak day grouping).
export const dayKey = (iso) => {
  const d = new Date(iso);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
};

// Risk:reward from entry / stop / target. Direction-aware.
export const computeRR = ({ entry, stopLoss, profitTarget }) => {
  const e = Number(entry);
  const s = Number(stopLoss);
  const t = Number(profitTarget);
  if (![e, s, t].every((x) => Number.isFinite(x))) return null;
  const risk = Math.abs(e - s);
  const reward = Math.abs(t - e);
  if (risk === 0) return null;
  return reward / risk;
};
