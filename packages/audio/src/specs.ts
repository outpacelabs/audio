/**
 * Sound specs: every interface sound as pure data.
 *
 * A sound is a handful of layers — pitched tones and filtered noise bursts —
 * each with a start offset, a duration, and a peak level. Specs are produced
 * by pure functions, so the whole sound design is inspectable, versionable,
 * and testable in Node without an AudioContext; the engine is just a small
 * interpreter that schedules them onto Web Audio nodes.
 *
 * The design system is DIRECTION. Sounds come in mirrored pairs, and the
 * acoustic direction always agrees with the semantic one: pitch rises for
 * up/on/in/confirm, falls for down/off/out/deny. One family, six moves.
 *
 * Restraint rules baked into every spec: nothing longer than 180ms, peaks
 * capped well under clipping, errors inform in a low register instead of
 * punishing with a buzzer.
 */

export interface ToneLayer {
	kind: "tone";
	wave: "sine" | "triangle" | "square" | "sawtooth";
	/** Start and end frequency in Hz; unequal values glide exponentially. */
	from: number;
	to: number;
	/** Start offset within the sound, seconds. */
	at: number;
	/** Layer duration, seconds. */
	duration: number;
	/** Peak level 0..1, pre-master. */
	peak: number;
}

export interface NoiseLayer {
	kind: "noise";
	/** Bandpass center frequency in Hz; unequal values sweep exponentially. */
	from: number;
	to: number;
	/** Bandpass resonance. */
	q: number;
	at: number;
	duration: number;
	peak: number;
}

export type Layer = ToneLayer | NoiseLayer;

export interface SoundSpec {
	name: string;
	layers: Layer[];
}

export type VerticalDirection = "up" | "down";
export type ToggleState = "on" | "off";
export type SpatialDirection = "in" | "out";

/** Total length of a spec in seconds. */
export function duration(spec: SoundSpec): number {
	return spec.layers.reduce((max, l) => Math.max(max, l.at + l.duration), 0);
}

/* A soft pentatonic-ish register keeps intervals consonant across sounds. */
const G4 = 392;
const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;

/**
 * tap — the neutral one, no direction. A 10ms bandpass-filtered noise burst:
 * pure percussion, felt more than heard.
 */
export function tap(): SoundSpec {
	return {
		name: "tap",
		layers: [
			{ kind: "noise", from: 4200, to: 4200, q: 3, at: 0, duration: 0.01, peak: 0.8 },
		],
	};
}

/**
 * nudge — one small step of an adjustment (stepper, slider detent, keyboard
 * increment). A short glide whose pitch direction is the step direction.
 */
export function nudge(direction: VerticalDirection): SoundSpec {
	const [from, to] = direction === "up" ? [C5, E5] : [E5, C5];
	return {
		name: `nudge-${direction}`,
		layers: [
			{ kind: "tone", wave: "sine", from, to, at: 0, duration: 0.05, peak: 0.5 },
		],
	};
}

/**
 * toggle — a binary state change. Two quick notes; the interval ascends for
 * on and descends for off, so the pair reads as one gesture reversed.
 */
export function toggle(state: ToggleState): SoundSpec {
	const [first, second] = state === "on" ? [G4, C5 * 1.122] : [C5 * 1.122, G4];
	return {
		name: `toggle-${state}`,
		layers: [
			{ kind: "tone", wave: "triangle", from: first, to: first, at: 0, duration: 0.045, peak: 0.42 },
			{ kind: "tone", wave: "triangle", from: second, to: second, at: 0.055, duration: 0.055, peak: 0.46 },
		],
	};
}

/**
 * slide — something entering or leaving the stage (drawer, sheet, panel).
 * A noise sweep through a rising or falling bandpass: air, not notes.
 */
export function slide(direction: SpatialDirection): SoundSpec {
	const [from, to] = direction === "in" ? [900, 2600] : [2600, 900];
	return {
		name: `slide-${direction}`,
		layers: [
			{ kind: "noise", from, to, q: 2.5, at: 0, duration: 0.09, peak: 0.35 },
		],
	};
}

/**
 * confirm — an outcome worth marking (submitted, saved, copied at the end of
 * a flow). A rising major third with a soft percussive onset.
 */
export function confirm(): SoundSpec {
	return {
		name: "confirm",
		layers: [
			{ kind: "noise", from: 3800, to: 3800, q: 3, at: 0, duration: 0.008, peak: 0.35 },
			{ kind: "tone", wave: "triangle", from: C5, to: C5, at: 0, duration: 0.07, peak: 0.5 },
			{ kind: "tone", wave: "triangle", from: E5, to: E5, at: 0.07, duration: 0.1, peak: 0.5 },
		],
	};
}

/**
 * deny — something didn't happen. One low tone with a slight downward bend:
 * unmistakable, but it informs rather than punishes. No buzzer.
 */
export function deny(): SoundSpec {
	return {
		name: "deny",
		layers: [
			{ kind: "tone", wave: "sine", from: 220, to: 196, at: 0, duration: 0.12, peak: 0.5 },
		],
	};
}

/** Every spec generator, for enumeration (docs, tests, the playground). */
export const specs = { tap, nudge, toggle, slide, confirm, deny };

/* Referenced by the toggle interval; exported for the article. */
export const REGISTER = { G4, C5, E5, G5 };
