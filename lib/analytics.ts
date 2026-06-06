import { readJson, writeJson } from "@/lib/storage";

export type AnalyticsDay = {
  date: string;
  devices: Record<"desktop" | "mobile" | "tablet" | "unknown", number>;
  paths: Record<string, number>;
  referrers: Record<string, number>;
  total: number;
  updatedAt: string;
};

export type AnalyticsSummary = {
  last7Days: AnalyticsDay[];
  topPath: { path: string; views: number };
  today: AnalyticsDay;
  total7Days: number;
};

const ANALYTICS_STORE = "techchimps-analytics";
const DAY_PREFIX = "days/";
const EMPTY_TOP_PATH = { path: "/", views: 0 };

function dayKey(date: string) {
  return `${DAY_PREFIX}${date}`;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function emptyDay(date: string): AnalyticsDay {
  return {
    date,
    devices: {
      desktop: 0,
      mobile: 0,
      tablet: 0,
      unknown: 0
    },
    paths: {},
    referrers: {},
    total: 0,
    updatedAt: new Date().toISOString()
  };
}

function normalizePath(path: string) {
  const cleanPath = path.trim().split("?")[0]?.split("#")[0] || "/";
  if (!cleanPath.startsWith("/")) return "/";
  if (cleanPath.startsWith("/api") || cleanPath.startsWith("/admin")) return "";
  return cleanPath.slice(0, 100);
}

function normalizeReferrer(referrer?: string) {
  if (!referrer) return "Direct";

  try {
    const url = new URL(referrer);
    if (url.hostname.includes("techchimps.com")) return "TechChimps";
    return url.hostname.replace(/^www\./, "").slice(0, 60);
  } catch {
    return "Direct";
  }
}

function deviceFromUserAgent(userAgent?: string): keyof AnalyticsDay["devices"] {
  const value = userAgent?.toLowerCase() || "";
  if (!value) return "unknown";
  if (/ipad|tablet/.test(value)) return "tablet";
  if (/mobile|android|iphone/.test(value)) return "mobile";
  return "desktop";
}

function increment(map: Record<string, number>, key: string) {
  return {
    ...map,
    [key]: (map[key] ?? 0) + 1
  };
}

export async function recordPageView({
  path,
  referrer,
  userAgent
}: {
  path: string;
  referrer?: string;
  userAgent?: string;
}) {
  const normalizedPath = normalizePath(path);
  if (!normalizedPath) return null;

  const date = todayKey();
  const current = (await readJson<AnalyticsDay>(ANALYTICS_STORE, dayKey(date))) ?? emptyDay(date);
  const device = deviceFromUserAgent(userAgent);
  const updated: AnalyticsDay = {
    ...current,
    devices: {
      ...current.devices,
      [device]: (current.devices[device] ?? 0) + 1
    },
    paths: increment(current.paths, normalizedPath),
    referrers: increment(current.referrers, normalizeReferrer(referrer)),
    total: current.total + 1,
    updatedAt: new Date().toISOString()
  };

  await writeJson(ANALYTICS_STORE, dayKey(date), updated);
  return updated;
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const todayDate = todayKey();
  const dayKeys = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - index);
    return date.toISOString().slice(0, 10);
  });
  const last7Days = await Promise.all(
    dayKeys.map(async (date) => (await readJson<AnalyticsDay>(ANALYTICS_STORE, dayKey(date))) ?? emptyDay(date))
  );
  const topPath =
    Object.entries(last7Days.reduce<Record<string, number>>((paths, day) => {
      for (const [path, views] of Object.entries(day.paths)) {
        paths[path] = (paths[path] ?? 0) + views;
      }
      return paths;
    }, {}))
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)[0] ?? EMPTY_TOP_PATH;

  return {
    last7Days,
    topPath,
    today: last7Days.find((day) => day.date === todayDate) ?? emptyDay(todayDate),
    total7Days: last7Days.reduce((total, day) => total + day.total, 0)
  };
}
