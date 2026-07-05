// Framework-agnostic session-token verification. Runs anywhere Web Crypto is
// available: Next middleware (edge or node), route handlers, or the browser.
// The token is minted by the gate Convex deployment (gate:verify) and signed
// with GATE_SECRET; here we verify it locally so no per-request DB call is needed.

export const GATE_COOKIE = "og_gate";

export interface GateSession {
	project: string;
	exp: number;
}

const enc = new TextEncoder();

function b64urlToBytes(s: string): Uint8Array {
	const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
	const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
	const bin = atob(b64);
	const bytes = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
	return bytes;
}

function bytesToB64url(bytes: Uint8Array): string {
	let s = "";
	for (const b of bytes) s += String.fromCharCode(b);
	return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(secret: string, message: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		"raw",
		enc.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
	return bytesToB64url(new Uint8Array(sig));
}

function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let r = 0;
	for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return r === 0;
}

/** Verify a gate token's signature and expiry. Returns the session or null. */
export async function verifyToken(
	token: string,
	secret: string,
): Promise<GateSession | null> {
	if (!token || !secret) return null;
	const dot = token.lastIndexOf(".");
	if (dot < 1) return null;
	const payload = token.slice(0, dot);
	const sig = token.slice(dot + 1);

	const expected = await hmac(secret, payload);
	if (!timingSafeEqual(sig, expected)) return null;

	let data: unknown;
	try {
		data = JSON.parse(new TextDecoder().decode(b64urlToBytes(payload)));
	} catch {
		return null;
	}
	if (
		typeof data !== "object" ||
		data === null ||
		typeof (data as { p?: unknown }).p !== "string" ||
		typeof (data as { exp?: unknown }).exp !== "number"
	) {
		return null;
	}
	const { p, exp } = data as { p: string; exp: number };
	if (exp < Date.now()) return null;
	return { project: p, exp };
}
