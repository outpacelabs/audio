import { type NextRequest, NextResponse } from "next/server";
import { GATE_COOKIE, verifyToken } from "./token";

export interface GateMiddlewareConfig {
	/** Shared HMAC secret — GATE_SECRET (same value set on the gate deployment). */
	secret: string;
	/** This app's project slug, e.g. "skills". Must match what was gated. */
	project: string;
	/** Where the password page lives. Default "/gate". */
	loginPath?: string;
	/** Cookie name. Default "og_gate". */
	cookieName?: string;
}

/**
 * Build a Next.js middleware that blocks every request without a valid gate
 * cookie, redirecting to the password page (with `?next=` preserved).
 *
 * Pair it with a static `config.matcher` in your middleware.ts — this function
 * also self-guards the login/api paths so redirect loops can't happen even if
 * the matcher is broad.
 */
export function createGateMiddleware(cfg: GateMiddlewareConfig) {
	const loginPath = cfg.loginPath ?? "/gate";
	const cookieName = cfg.cookieName ?? GATE_COOKIE;

	return async function middleware(req: NextRequest) {
		const { pathname } = req.nextUrl;
		// Never gate the password page or the verify endpoint (avoids loops).
		if (pathname === loginPath || pathname.startsWith("/api/gate")) {
			return NextResponse.next();
		}

		const token = req.cookies.get(cookieName)?.value ?? "";
		const session = await verifyToken(token, cfg.secret);
		if (session && session.project === cfg.project) {
			return NextResponse.next();
		}

		const url = req.nextUrl.clone();
		url.pathname = loginPath;
		url.search = "";
		url.searchParams.set("next", pathname + req.nextUrl.search);
		return NextResponse.redirect(url);
	};
}
