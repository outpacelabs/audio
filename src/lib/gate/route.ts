import { type NextRequest, NextResponse } from "next/server";
import { GATE_COOKIE } from "./token";

export interface GateRouteConfig {
	/** The gate Convex deployment URL — GATE_CONVEX_URL (server-only). */
	convexUrl: string;
	/** This app's project slug. */
	project: string;
	/** Cookie name. Default "og_gate". */
	cookieName?: string;
}

/**
 * Build the POST handler for /api/gate: takes { password }, verifies it against
 * the gate deployment (via Convex's HTTP mutation API — no SDK dependency), and
 * on success sets the signed session as an httpOnly cookie. Wrong password → 401.
 */
export function createGateRoute(cfg: GateRouteConfig) {
	const cookieName = cfg.cookieName ?? GATE_COOKIE;

	async function POST(req: NextRequest) {
		if (!cfg.convexUrl) {
			// Misconfigured (GATE_CONVEX_URL unset) — fail closed, never 200.
			return NextResponse.json({ ok: false }, { status: 500 });
		}
		const endpoint = `${cfg.convexUrl.replace(/\/$/, "")}/api/mutation`;

		const body = (await req.json().catch(() => null)) as {
			password?: unknown;
		} | null;
		const password = typeof body?.password === "string" ? body.password : "";
		if (!password) {
			return NextResponse.json({ ok: false }, { status: 400 });
		}

		const r = await fetch(endpoint, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				path: "gate:verify",
				args: { project: cfg.project, password },
				format: "json",
			}),
		});
		const data = r.ok
			? ((await r.json().catch(() => null)) as {
					status?: string;
					value?: { ok?: boolean; token?: string; exp?: number };
				} | null)
			: null;
		const value = data?.status === "success" ? data.value : null;
		if (!value?.ok || !value.token || !value.exp) {
			return NextResponse.json({ ok: false }, { status: 401 });
		}

		const res = NextResponse.json({ ok: true });
		res.cookies.set(cookieName, value.token, {
			httpOnly: true,
			secure: true,
			sameSite: "lax",
			path: "/",
			expires: new Date(value.exp),
		});
		return res;
	}

	return { POST };
}
