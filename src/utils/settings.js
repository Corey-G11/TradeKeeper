// User preferences (discipline guardrails + pre-trade checklist), in localStorage.

const KEY = 'tradekeeper:settings:v1';

export const defaultSettings = {
  maxDailyLoss: 300, // $ — lockout warning once today's loss reaches this
  backupUrl: '', // your Docker backup server, e.g. http://localhost:8080
  backupToken: '', // optional shared secret (BACKUP_TOKEN on the server)
  autoBackup: true, // push to the server after each trade when a URL is set
  checklist: [
    'Setup matches my trading plan',
    'Risk is within my max per trade',
    'Stop-loss is placed',
    'Not revenge trading / on tilt',
    'Checked news & events',
  ],
};

export const loadSettings = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    return { ...defaultSettings, ...(saved || {}) };
  } catch {
    return { ...defaultSettings };
  }
};

export const saveSettings = (s) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* non-fatal */
  }
};

// Common setup tags offered as quick-add chips in the trade form.
export const COMMON_TAGS = [
  'Breakout',
  'Reversal',
  'Trend',
  'Pullback',
  'Range',
  'News',
  'Scalp',
  'A+ Setup',
];
