import type { Response } from "express";

export const SESSION_COOKIE = "interact_session";
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function useSecureCookie(): boolean {
  return (process.env.APP_URL || "").startsWith("https://");
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: useSecureCookie(),
    maxAge: SESSION_MAX_AGE_MS,
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    sameSite: "lax",
    secure: useSecureCookie(),
    path: "/",
  });
}
