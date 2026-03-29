type UsageRecord = {
  pdfCount: number;
  imageCount: number;
  resetDate: string; // ISO date string (YYYY-MM-DD) in UTC
};

const LIMITS = {
  pdf: 2, // PDFs per day (each PDF counts as 1 regardless of pages)
  image: 5, // images per day
} as const;

const store = new Map<string, UsageRecord>();

// Clean up stale entries every 10 minutes
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 10 * 60 * 1000;

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  const today = getToday();
  for (const [key, record] of store) {
    if (record.resetDate !== today) {
      store.delete(key);
    }
  }
}

function getOrCreate(deviceId: string): UsageRecord {
  cleanup();

  const today = getToday();
  const existing = store.get(deviceId);

  if (existing && existing.resetDate === today) {
    return existing;
  }

  const record: UsageRecord = { pdfCount: 0, imageCount: 0, resetDate: today };
  store.set(deviceId, record);
  return record;
}

export type RateLimitResult = {
  allowed: boolean;
  remainingPdf: number;
  remainingImage: number;
  error?: string;
};

export function checkAndIncrement(
  deviceId: string,
  type: "pdf" | "image",
): RateLimitResult {
  const record = getOrCreate(deviceId);

  const remainingPdf = Math.max(0, LIMITS.pdf - record.pdfCount);
  const remainingImage = Math.max(0, LIMITS.image - record.imageCount);

  if (type === "pdf" && record.pdfCount >= LIMITS.pdf) {
    return {
      allowed: false,
      remainingPdf: 0,
      remainingImage,
      error: `Daily PDF limit reached (${LIMITS.pdf} per day). Try again tomorrow.`,
    };
  }

  if (type === "image" && record.imageCount >= LIMITS.image) {
    return {
      allowed: false,
      remainingPdf,
      remainingImage: 0,
      error: `Daily image limit reached (${LIMITS.image} per day). Try again tomorrow.`,
    };
  }

  if (type === "pdf") {
    record.pdfCount++;
  } else {
    record.imageCount++;
  }

  return {
    allowed: true,
    remainingPdf: Math.max(0, LIMITS.pdf - record.pdfCount),
    remainingImage: Math.max(0, LIMITS.image - record.imageCount),
  };
}

export function getRemaining(deviceId: string): { remainingPdf: number; remainingImage: number } {
  const record = getOrCreate(deviceId);
  return {
    remainingPdf: Math.max(0, LIMITS.pdf - record.pdfCount),
    remainingImage: Math.max(0, LIMITS.image - record.imageCount),
  };
}
