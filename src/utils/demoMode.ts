export interface DemoModeState {
  active: boolean;
  startedAt: number;
  expiresAt: number;
  uploadsUsed: number;
  uploadLimit: number;
}

export interface DemoLogEntry {
  id: string;
  at: number;
  event: string;
  message: string;
}

export interface DemoUploadResult {
  allowed: boolean;
  remaining: number;
  reason?: "expired" | "limit";
}

export const DEMO_DURATION_MS = 6 * 60 * 1000;
export const DEMO_UPLOAD_LIMIT = 1;

const DEMO_STATE_KEY = "trustlens_demo_mode_state_v1";
const DEMO_LOG_KEY = "trustlens_demo_mode_logs_v1";
const MAX_LOGS = 120;

const canUseStorage = () => typeof window !== "undefined" && typeof localStorage !== "undefined";

const readJson = <T,>(key: string, fallback: T): T => {
  if (!canUseStorage()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  if (!canUseStorage()) return;
  localStorage.setItem(key, JSON.stringify(value));
};

const createLogId = () => `demo-${Math.random().toString(36).slice(2, 10)}`;

const normalizeState = (raw: Partial<DemoModeState> | null): DemoModeState | null => {
  if (!raw) return null;
  const startedAt = Number(raw.startedAt || 0);
  const expiresAt = Number(raw.expiresAt || 0);
  const uploadsUsed = Math.max(0, Number(raw.uploadsUsed || 0));
  const uploadLimit = Math.max(1, Number(raw.uploadLimit || DEMO_UPLOAD_LIMIT));
  if (!Number.isFinite(startedAt) || !Number.isFinite(expiresAt) || startedAt <= 0 || expiresAt <= 0) return null;
  return {
    active: Boolean(raw.active),
    startedAt,
    expiresAt,
    uploadsUsed,
    uploadLimit,
  };
};

export const getDemoModeState = (): DemoModeState | null => {
  const state = normalizeState(readJson<Partial<DemoModeState> | null>(DEMO_STATE_KEY, null));
  if (!state) return null;
  return state;
};

export const getDemoLogs = (limit = 8): DemoLogEntry[] => {
  const logs = readJson<DemoLogEntry[]>(DEMO_LOG_KEY, []);
  return logs.slice(0, Math.max(1, limit));
};

export const logDemoEvent = (event: string, message: string) => {
  const logs = readJson<DemoLogEntry[]>(DEMO_LOG_KEY, []);
  const next: DemoLogEntry = {
    id: createLogId(),
    at: Date.now(),
    event,
    message,
  };
  writeJson(DEMO_LOG_KEY, [next, ...logs].slice(0, MAX_LOGS));
};

export const startDemoMode = (): DemoModeState => {
  const now = Date.now();
  const state: DemoModeState = {
    active: true,
    startedAt: now,
    expiresAt: now + DEMO_DURATION_MS,
    uploadsUsed: 0,
    uploadLimit: DEMO_UPLOAD_LIMIT,
  };
  writeJson(DEMO_STATE_KEY, state);
  writeJson(DEMO_LOG_KEY, []);
  logDemoEvent("demo_started", "Demo mode started. Session time: 6 minutes. Upload limit: 1 file.");
  return state;
};

export const clearDemoMode = (reason: "manual" | "expired" = "manual") => {
  const state = getDemoModeState();
  if (state?.active) {
    logDemoEvent(
      "demo_ended",
      reason === "expired"
        ? "Demo mode expired after 6 minutes."
        : "Demo mode ended by user."
    );
  }
  if (!canUseStorage()) return;
  localStorage.removeItem(DEMO_STATE_KEY);
};

export const isDemoModeActive = () => {
  const state = getDemoModeState();
  if (!state || !state.active) return false;
  return state.expiresAt > Date.now();
};

export const expireDemoModeIfNeeded = () => {
  const state = getDemoModeState();
  if (!state || !state.active) return false;
  if (state.expiresAt > Date.now()) return true;
  clearDemoMode("expired");
  return false;
};

export const getDemoUploadsRemaining = () => {
  const state = getDemoModeState();
  if (!state || !state.active) return Number.MAX_SAFE_INTEGER;
  return Math.max(0, state.uploadLimit - state.uploadsUsed);
};

export const consumeDemoUpload = (context: string, fileName: string): DemoUploadResult => {
  const state = getDemoModeState();
  if (!state || !state.active) {
    return {
      allowed: true,
      remaining: Number.MAX_SAFE_INTEGER,
    };
  }

  if (!expireDemoModeIfNeeded()) {
    return {
      allowed: false,
      remaining: 0,
      reason: "expired",
    };
  }

  const fresh = getDemoModeState();
  if (!fresh || !fresh.active) {
    return {
      allowed: false,
      remaining: 0,
      reason: "expired",
    };
  }

  if (fresh.uploadsUsed >= fresh.uploadLimit) {
    logDemoEvent(
      "upload_blocked",
      `Upload blocked in ${context}. Demo upload limit already used.`
    );
    return {
      allowed: false,
      remaining: 0,
      reason: "limit",
    };
  }

  const next: DemoModeState = {
    ...fresh,
    uploadsUsed: fresh.uploadsUsed + 1,
  };
  writeJson(DEMO_STATE_KEY, next);
  logDemoEvent(
    "upload_used",
    `Demo upload used in ${context}: ${fileName}. Remaining uploads: ${Math.max(0, next.uploadLimit - next.uploadsUsed)}.`
  );
  return {
    allowed: true,
    remaining: Math.max(0, next.uploadLimit - next.uploadsUsed),
  };
};
