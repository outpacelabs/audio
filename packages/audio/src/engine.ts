/**
 * The engine: a small interpreter that schedules a SoundSpec onto Web Audio
 * nodes. One shared AudioContext for the whole app, created lazily on the
 * first play (inside a user gesture, so autoplay policy is satisfied) and
 * resumed if the browser suspended it.
 *
 * Envelopes are exponential ramps to 0.001, never to zero — zero is
 * unreachable for an exponential and clicks audibly. Nodes disconnect
 * themselves when done. Master volume defaults to a subtle 0.3; sound can
 * be disabled globally, persists in localStorage, and stays silent for
 * prefers-reduced-motion users unless explicitly overridden.
 */

import { duration, type Layer, type SoundSpec } from "./specs";

interface Settings {
	enabled: boolean;
	volume: number;
	/** Silence sounds when the user prefers reduced motion. Default true. */
	respectReducedMotion: boolean;
}

const STORAGE_KEY = "outpacelabs-audio";
const isBrowser = typeof window !== "undefined";

let settings: Settings = { enabled: true, volume: 0.3, respectReducedMotion: true };
let loaded = false;
let snapshot: Settings = settings;
const listeners = new Set<() => void>();

function load() {
	if (loaded || !isBrowser) return;
	loaded = true;
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (raw) settings = { ...settings, ...JSON.parse(raw) };
	} catch {
		/* private mode etc. — keep defaults */
	}
	snapshot = { ...settings };
}

function save() {
	snapshot = { ...settings };
	for (const fn of listeners) fn();
	if (!isBrowser) return;
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
	} catch {
		/* ignore */
	}
}

export function setEnabled(enabled: boolean) {
	load();
	settings.enabled = enabled;
	save();
}

export function setVolume(volume: number) {
	load();
	settings.volume = Math.min(Math.max(volume, 0), 1);
	if (master) master.gain.value = settings.volume;
	save();
}

export function setRespectReducedMotion(respect: boolean) {
	load();
	settings.respectReducedMotion = respect;
	save();
}

/**
 * Current settings snapshot. Deliberately does NOT read localStorage: the
 * first client render must match the server-rendered defaults or React
 * reports a hydration mismatch. Persisted values arrive via hydrate()
 * (called post-mount by the React hook) or lazily on the first play/set,
 * which always happens inside a user gesture, after hydration.
 */
export function getSettings(): Settings {
	return snapshot;
}

/** Load persisted settings after hydration and notify subscribers. */
export function hydrate() {
	const before = snapshot;
	load();
	if (
		snapshot.enabled !== before.enabled ||
		snapshot.volume !== before.volume ||
		snapshot.respectReducedMotion !== before.respectReducedMotion
	) {
		for (const fn of listeners) fn();
	}
}

/** Subscribe to settings changes (used by the React hook). */
export function subscribe(fn: () => void): () => void {
	listeners.add(fn);
	return () => listeners.delete(fn);
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;

function ensure(): { ctx: AudioContext; master: GainNode } | null {
	if (!isBrowser || typeof AudioContext === "undefined") return null;
	if (!ctx) {
		ctx = new AudioContext();
		master = ctx.createGain();
		master.gain.value = getSettings().volume;
		master.connect(ctx.destination);
	}
	if (ctx.state === "suspended") void ctx.resume();
	// biome-ignore lint/style/noNonNullAssertion: created alongside ctx
	return { ctx, master: master! };
}

function whiteNoise(ctx: AudioContext): AudioBuffer {
	if (noiseBuffer) return noiseBuffer;
	const length = Math.ceil(ctx.sampleRate * 0.25);
	noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
	const data = noiseBuffer.getChannelData(0);
	for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
	return noiseBuffer;
}

const ATTACK = 0.004;
const FLOOR = 0.001;

function scheduleLayer(
	ctx: AudioContext,
	master: GainNode,
	layer: Layer,
	t0: number,
) {
	const start = t0 + layer.at;
	const end = start + layer.duration;

	const gain = ctx.createGain();
	gain.gain.setValueAtTime(FLOOR, start);
	gain.gain.linearRampToValueAtTime(layer.peak, start + ATTACK);
	gain.gain.exponentialRampToValueAtTime(FLOOR, end);
	gain.connect(master);

	let source: AudioScheduledSourceNode;
	if (layer.kind === "tone") {
		const osc = ctx.createOscillator();
		osc.type = layer.wave;
		osc.frequency.setValueAtTime(layer.from, start);
		if (layer.to !== layer.from) {
			osc.frequency.exponentialRampToValueAtTime(layer.to, end);
		}
		osc.connect(gain);
		source = osc;
	} else {
		const noise = ctx.createBufferSource();
		noise.buffer = whiteNoise(ctx);
		noise.loop = true;
		const filter = ctx.createBiquadFilter();
		filter.type = "bandpass";
		filter.Q.value = layer.q;
		filter.frequency.setValueAtTime(layer.from, start);
		if (layer.to !== layer.from) {
			filter.frequency.exponentialRampToValueAtTime(layer.to, end);
		}
		noise.connect(filter);
		filter.connect(gain);
		source = noise;
	}

	source.start(start);
	source.stop(end + 0.01);
	source.onended = () => {
		source.disconnect();
		gain.disconnect();
	};
}

/** Play a spec. Safe anywhere: no-ops on the server, when disabled, or when
 * the user prefers reduced motion (unless that respect is turned off). */
export function play(spec: SoundSpec): void {
	load();
	const s = getSettings();
	if (!s.enabled || s.volume <= 0) return;
	if (
		s.respectReducedMotion &&
		isBrowser &&
		window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
	) {
		return;
	}
	const audio = ensure();
	if (!audio) return;
	const t0 = audio.ctx.currentTime + 0.001;
	for (const layer of spec.layers) {
		scheduleLayer(audio.ctx, audio.master, layer, t0);
	}
}

export { duration };
