"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
	getSettings,
	hydrate,
	setEnabled,
	setRespectReducedMotion,
	setVolume,
	subscribe,
} from "./engine";

const serverSnapshot = {
	enabled: true,
	volume: 0.3,
	respectReducedMotion: true,
};

/**
 * Reactive audio settings (enabled / volume / reduced-motion respect),
 * persisted in localStorage. The sound functions themselves are plain
 * imports — call `tap()`, `toggle("on")`, etc. from any handler; this hook
 * only exists for settings UI.
 *
 * Persisted values load in an effect after mount, so the first client
 * render always matches the server render (no hydration mismatch).
 *
 * ```tsx
 * const { enabled, volume, setEnabled, setVolume } = useAudioSettings();
 * ```
 */
export function useAudioSettings() {
	const settings = useSyncExternalStore(
		subscribe,
		getSettings,
		() => serverSnapshot,
	);
	useEffect(() => {
		hydrate();
	}, []);
	return { ...settings, setEnabled, setVolume, setRespectReducedMotion };
}
