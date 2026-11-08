import { weekStart } from './ranked.js';

export const CLOSE_MS = 1800000;
export const UPLOAD_MS = 300000;
export const IDLE_MS = 30000;
export function clockPolicy(week, now = Date.now()) {
  const deadline = weekStart(week + 1), closesAt = deadline - CLOSE_MS;
  return { deadline, closesAt, admissionOpen: now < closesAt, remainingMs: Math.max(0, deadline - now) };
}
