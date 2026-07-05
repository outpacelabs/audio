"use client";

import { useSmoothCorners } from "@outpacelabs/smooth/react";
import { type FormEvent, useState } from "react";

export interface GateFormProps {
	/** Where to POST the password. Default "/api/gate". */
	action?: string;
	/** Where to send the user after a correct password. Default "/". */
	next?: string;
}

// One field, no card, no shadow. Fill matches the app's block surface
// (rgba(23,23,23,0.04)); corners are Apple-squircle via @outpacelabs/smooth.
// Scoped + dependency-light so it renders the same in any app. Light + dark.
const CSS = `
.og-gate-root{min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:24px;background:#fff;color:rgba(23,23,23,0.92);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.og-gate-form{display:flex;flex-direction:column;align-items:center;gap:14px;width:100%;max-width:300px;text-align:center}
.og-gate-input{width:100%;box-sizing:border-box;border:none;border-radius:14px;background:rgba(23,23,23,0.04);color:rgba(23,23,23,0.92);padding:14px 16px;font-size:14px;line-height:1.4;text-align:center;outline:none;transition:background-color 120ms ease}
.og-gate-input::placeholder{color:rgba(23,23,23,0.32)}
.og-gate-input:focus{background:rgba(23,23,23,0.07)}
.og-gate-input:disabled{opacity:0.6}
.og-gate-input[aria-invalid="true"]{background:rgba(180,35,24,0.09);color:#b42318}
.og-gate-error{font-size:12.5px;line-height:1.4;color:#b42318;margin:0}
@media (prefers-color-scheme:dark){
.og-gate-root{background:#1B1C1E;color:rgba(255,255,255,0.92)}
.og-gate-input{background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.92)}
.og-gate-input::placeholder{color:rgba(255,255,255,0.32)}
.og-gate-input:focus{background:rgba(255,255,255,0.10)}
}
`;

/**
 * Single-field password prompt. Submits on Enter (no button). Posts to
 * /api/gate, then hard-navigates to `next` so middleware re-runs against the
 * fresh cookie.
 */
export function GateForm({ action = "/api/gate", next = "/" }: GateFormProps) {
	const [password, setPassword] = useState("");
	const [error, setError] = useState(false);
	const [loading, setLoading] = useState(false);
	const inputRef = useSmoothCorners<HTMLInputElement>(14, 60);

	async function onSubmit(e: FormEvent) {
		e.preventDefault();
		if (loading) return;
		setLoading(true);
		setError(false);
		try {
			const res = await fetch(action, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ password }),
			});
			if (res.ok) {
				window.location.assign(next);
				return;
			}
		} catch {
			// fall through to error
		}
		setError(true);
		setLoading(false);
		setPassword("");
	}

	return (
		<main className="og-gate-root">
			{/* biome-ignore lint/security/noDangerouslySetInnerHtml: static scoped stylesheet */}
			<style dangerouslySetInnerHTML={{ __html: CSS }} />
			<form className="og-gate-form" onSubmit={onSubmit}>
				<input
					ref={inputRef}
					className="og-gate-input"
					type="password"
					autoFocus
					required
					disabled={loading}
					value={password}
					onChange={(e) => {
						setPassword(e.target.value);
						if (error) setError(false);
					}}
					placeholder="Password"
					aria-label="Password"
					aria-invalid={error}
				/>
				{error && (
					<p className="og-gate-error" aria-live="polite">
						Incorrect password. Try again.
					</p>
				)}
			</form>
		</main>
	);
}
