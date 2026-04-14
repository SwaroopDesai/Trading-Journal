import { createClient } from "@/lib/supabase";
import { STORAGE_BUCKET, SESSION_WINDOWS, DAILY_PAIR_NOTES_MARKER } from "@/lib/constants";

// ─── Formatters ────────────────────────────────────────────────────────────
export const fmtDate = d => new Date(d).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"2-digit"});
export const fmtRR   = rr => rr >= 0 ? `+${Number(rr).toFixed(2)}R` : `${Number(rr).toFixed(2)}R`;

// ─── Image helpers ─────────────────────────────────────────────────────────
export const isDataUrl              = value => typeof value === "string" && value.startsWith("data:image/");
export const getStoragePublicMarker = (bucket = STORAGE_BUCKET) => `/storage/v1/object/public/${bucket}/`;
export const isStorageUrl           = (value, bucket = STORAGE_BUCKET) => {
  if(typeof value !== "string") return false;
  return value.includes(getStoragePublicMarker(bucket)) || value.includes("/storage/v1/object/public/");
};

export const getImageExtension = (dataUrl) => {
  const mime = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/i)?.[1]?.toLowerCase() || "image/png";
  if(mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if(mime.includes("webp")) return "webp";
  if(mime.includes("gif")) return "gif";
  return "png";
};

export const dataUrlToBlob = async (dataUrl) => {
  const res = await fetch(dataUrl);
  return res.blob();
};

export const normalizeImageList = (value) => {
  if(Array.isArray(value)) return value.filter(Boolean);
  if(typeof value === "string") {
    const trimmed = value.trim();
    if(!trimmed) return [];
    if(trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      } catch { return [trimmed]; }
    }
    return [trimmed];
  }
  return [];
};

export const serializeImageList = (value) => {
  const images = normalizeImageList(value);
  if(images.length === 0) return "";
  if(images.length === 1) return images[0];
  return JSON.stringify(images);
};

// ─── Storage path helpers ──────────────────────────────────────────────────
export const buildStoragePath = (userId, folder, ext) =>
  `${userId}/${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

export const extractStoragePath = (value, bucket = STORAGE_BUCKET) => {
  if(!isStorageUrl(value, bucket)) return null;
  try {
    const url = new URL(value);
    const parts = url.pathname.split("/storage/v1/object/public/")[1]?.split("/") || [];
    if(parts.length >= 2) {
      const [, ...pathParts] = parts;
      return decodeURIComponent(pathParts.join("/"));
    }
  } catch {}
  const marker = getStoragePublicMarker(bucket);
  const [, path = ""] = value.split(marker);
  return decodeURIComponent((path.split("?")[0] || "").replace(/^\/+/, ""));
};

// ─── Supabase image upload ─────────────────────────────────────────────────
export const uploadImageValue = async (supabase, userId, folder, value) => {
  if(!value || typeof value !== "string") return "";
  if(!isDataUrl(value)) return value;
  const ext  = getImageExtension(value);
  const path = buildStoragePath(userId, folder, ext);
  const blob = await dataUrlToBlob(value);
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, blob, {
    cacheControl: "3600",
    contentType: blob.type || `image/${ext}`,
    upsert: false,
  });
  if(error) throw error;
  return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
};

export const uploadImageList = async (supabase, userId, folder, values) => {
  const images = normalizeImageList(values);
  return Promise.all(images.map((value, index) => uploadImageValue(supabase, userId, `${folder}/${index + 1}`, value)));
};

export const deleteStoredImages = async (supabase, values) => {
  const paths = normalizeImageList(values).map(value => extractStoragePath(value)).filter(Boolean);
  if(paths.length === 0) return;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove(paths);
  if(error) throw error;
};

// ─── Draft (localStorage) helpers ─────────────────────────────────────────
export const getDraftKey = (userId, type) => userId ? `fxedge:draft:${type}:${userId}` : null;

export const readDraft = (userId, type) => {
  if(typeof window === "undefined") return null;
  const key = getDraftKey(userId, type);
  if(!key) return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

export const writeDraft = (userId, type, value) => {
  if(typeof window === "undefined") return;
  const key = getDraftKey(userId, type);
  if(!key) return;
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch {}
};

export const clearDraft = (userId, type) => {
  if(typeof window === "undefined") return;
  const key = getDraftKey(userId, type);
  if(!key) return;
  try { window.localStorage.removeItem(key); } catch {}
};

// ─── Plan data helpers ─────────────────────────────────────────────────────
export const getDailyPlanImages  = (plan) => normalizeImageList(plan?.chartImage);
export const getWeeklyPlanImages = (plan) => normalizeImageList(plan?.premiumDiscount?.__screenshots);
export const getWeeklyPairNotes  = (plan) => plan?.premiumDiscount?.__pairNotes || {};
export const getDailyPairNotes   = (plan) => {
  const value = plan?.watchlist;
  if(typeof value !== "string" || !value.startsWith(DAILY_PAIR_NOTES_MARKER)) return {};
  try { return JSON.parse(value.slice(DAILY_PAIR_NOTES_MARKER.length)) || {}; } catch { return {}; }
};
export const serializeDailyPairNotes = (pairNotes) => {
  const cleaned = Object.fromEntries(
    Object.entries(pairNotes || {}).filter(([, value]) => String(value || "").trim())
  );
  return Object.keys(cleaned).length ? `${DAILY_PAIR_NOTES_MARKER}${JSON.stringify(cleaned)}` : "";
};

// ─── Session clock helpers ─────────────────────────────────────────────────
export const getZoneMinutes = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone, hour:"2-digit", minute:"2-digit", hour12:false,
  }).formatToParts(date);
  const hour   = Number(parts.find(p => p.type === "hour")?.value   || 0);
  const minute = Number(parts.find(p => p.type === "minute")?.value || 0);
  return hour * 60 + minute;
};

export const getZoneTimeLabel = (date, timeZone) =>
  new Intl.DateTimeFormat("en-GB", { timeZone, hour:"2-digit", minute:"2-digit", hour12:false }).format(date);

export const formatMinutesAway = (minutes) => {
  if(minutes <= 0) return "now";
  const hours = Math.floor(minutes / 60);
  const mins  = minutes % 60;
  if(hours && mins) return `${hours}h ${mins}m`;
  if(hours) return `${hours}h`;
  return `${mins}m`;
};

export const getCurrentSessionInfo = (date = new Date()) => {
  const states = SESSION_WINDOWS.map(session => {
    const localMinutes = getZoneMinutes(date, session.timeZone);
    const active = localMinutes >= session.start && localMinutes < session.end;
    const minutesUntilStart = localMinutes <= session.start
      ? session.start - localMinutes
      : (24 * 60 - localMinutes) + session.start;
    return { ...session, active, minutesUntilStart };
  });

  const london  = states.find(s => s.key === "london");
  const newYork = states.find(s => s.key === "newyork");
  const asian   = states.find(s => s.key === "asian");

  const markets = states.map(session => ({
    key:    session.key,
    label:  session.label,
    time:   getZoneTimeLabel(date, session.timeZone),
    hours:  `${String(Math.floor(session.start/60)).padStart(2,"0")}:00 - ${String(Math.floor(session.end/60)).padStart(2,"0")}:00`,
    active: session.active,
    opensIn: formatMinutesAway(session.minutesUntilStart),
  }));

  if(london?.active && newYork?.active)
    return { label:"London / NY", tone:"overlap", detail:"Most liquid window", nextLabel:"Asian",    nextIn:formatMinutesAway(asian.minutesUntilStart),   markets };
  if(london?.active)
    return { label:"London",      tone:"london",  detail:"Europe open",        nextLabel:"New York", nextIn:formatMinutesAway(newYork.minutesUntilStart),  markets };
  if(newYork?.active)
    return { label:"New York",    tone:"newyork", detail:"US session live",    nextLabel:"Asian",    nextIn:formatMinutesAway(asian.minutesUntilStart),    markets };
  if(asian?.active)
    return { label:"Asian",       tone:"asian",   detail:"Asia session live",  nextLabel:"London",   nextIn:formatMinutesAway(london.minutesUntilStart),   markets };

  const nextSession = [...states].sort((a, b) => a.minutesUntilStart - b.minutesUntilStart)[0];
  return { label:"Between Sessions", tone:"closed", detail:"Reset and prep window", nextLabel:nextSession.label, nextIn:formatMinutesAway(nextSession.minutesUntilStart), markets };
};

// ─── Quick Log session auto-detect ────────────────────────────────────────
export const getAutoSession = () => {
  const hour = new Date().getHours();
  if(hour >= 3  && hour < 9)  return "London";
  if(hour >= 9  && hour < 13) return "London/NY Overlap";
  if(hour >= 13 && hour < 18) return "New York";
  return "Asian";
};
