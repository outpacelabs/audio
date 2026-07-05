"use client";

import { type FormEvent, useState } from "react";

export interface GateFormProps {
	/** Where to POST the password. Default "/api/gate". */
	action?: string;
	/** Where to send the user after a correct password. Default "/". */
	next?: string;
	/** Optional heading text. */
	title?: string;
}

/**
 * Minimal password prompt. Inline styles only, so it renders identically in any
 * app regardless of its CSS setup. Posts to the /api/gate route, then hard-
 * navigates to `next` so middleware re-runs and sees the fresh cookie.
 */
export function GateForm({
	action = "/api/gate",
	next = "/",
	title = "This site is private",
}: GateFormProps) {
	const [password, setPassword] = useState("");
	const [error, setError] = useState(false);
	const [loading, setLoading] = useState(false);

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
		<main
			style={{
				minHeight: "100dvh",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: "24px",
				fontFamily: "system-ui, -apple-system, sans-serif",
				color: "#171717",
			}}
		>
			<form
				onSubmit={onSubmit}
				style={{
					display: "flex",
					flexDirection: "column",
					gap: 12,
					width: "100%",
					maxWidth: 320,
					textAlign: "center",
				}}
			>
				<h1 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{title}</h1>
				<input
					type="password"
					autoFocus
					required
					value={password}
					onChange={(e) => {
						setPassword(e.target.value);
						if (error) setError(false);
					}}
					placeholder="Password"
					aria-label="Password"
					aria-invalid={error}
					style={{
						height: 44,
						borderRadius: 10,
						border: `1px solid ${error ? "#b42318" : "rgba(23,23,23,0.14)"}`,
						padding: "0 14px",
						fontSize: 14,
						outline: "none",
						width: "100%",
						boxSizing: "border-box",
					}}
				/>
				<button
					type="submit"
					disabled={loading}
					style={{
						height: 44,
						borderRadius: 10,
						border: "none",
						background: "#171717",
						color: "#fff",
						fontSize: 14,
						fontWeight: 550,
						cursor: loading ? "default" : "pointer",
						opacity: loading ? 0.6 : 1,
					}}
				>
					{loading ? "…" : "Enter"}
				</button>
				{error && (
					<p style={{ color: "#b42318", fontSize: 13, margin: 0 }} aria-live="polite">
						Incorrect password.
					</p>
				)}
			</form>
		</main>
	);
}
