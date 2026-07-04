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

import { registerRatio, type Voice } from "./voice";

export interface ToneLayer {
	kind: "tone";
	wave: "sine" | "triangle" | "square" | "sawtooth";
	/** Voices never re-timbre this layer (deny stays sine everywhere). */
	fixed?: boolean;
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
 * Re-render a spec in a voice. Register shifts every pitched layer,
 * brightness moves percussive filters, pace stretches the timing, and
 * melodic layers take the voice's waveform (layers marked fixed keep
 * theirs). Without a voice the spec passes through untouched, so the base
 * sound set is stable byte for byte.
 */
function voiced(spec: SoundSpec, voice?: Voice): SoundSpec {
	if (!voice) return spec;
	const ratio = registerRatio(voice);
	return {
		name: spec.name,
		layers: spec.layers.map((l) => {
			const at = l.at * voice.pace;
			const dur = l.duration * voice.pace;
			if (l.kind === "tone") {
				return {
					...l,
					at,
					duration: dur,
					from: l.from * ratio,
					to: l.to * ratio,
					wave: l.fixed ? l.wave : voice.wave,
				};
			}
			return {
				...l,
				at,
				duration: dur,
				from: l.from * voice.brightness,
				to: l.to * voice.brightness,
			};
		}),
	};
}

/**
 * tap — the neutral one, no direction. A 10ms bandpass-filtered noise burst:
 * pure percussion, felt more than heard.
 */
export function tap(voice?: Voice): SoundSpec {
	return voiced(
		{
		name: "tap",
		layers: [
			{ kind: "noise", from: 4200, to: 4200, q: 3, at: 0, duration: 0.01, peak: 0.8 },
		],
		},
		voice,
	);
}

/**
 * nudge — one small step of an adjustment (stepper, slider detent, keyboard
 * increment). A short glide whose pitch direction is the step direction.
 */
export function nudge(direction: VerticalDirection, voice?: Voice): SoundSpec {
	const [from, to] = direction === "up" ? [C5, E5] : [E5, C5];
	return voiced(
		{
		name: `nudge-${direction}`,
		layers: [
			{ kind: "tone", wave: "sine", from, to, at: 0, duration: 0.05, peak: 0.5 },
		],
		},
		voice,
	);
}

/**
 * toggle — a binary state change. Two quick notes; the interval ascends for
 * on and descends for off, so the pair reads as one gesture reversed.
 */
export function toggle(state: ToggleState, voice?: Voice): SoundSpec {
	const [first, second] = state === "on" ? [G4, C5 * 1.122] : [C5 * 1.122, G4];
	return voiced(
		{
		name: `toggle-${state}`,
		layers: [
			{ kind: "tone", wave: "triangle", from: first, to: first, at: 0, duration: 0.045, peak: 0.42 },
			{ kind: "tone", wave: "triangle", from: second, to: second, at: 0.055, duration: 0.055, peak: 0.46 },
		],
		},
		voice,
	);
}

/**
 * slide — something entering or leaving the stage (drawer, sheet, panel).
 * A noise sweep through a rising or falling bandpass: air, not notes.
 */
export function slide(direction: SpatialDirection, voice?: Voice): SoundSpec {
	const [from, to] = direction === "in" ? [900, 2600] : [2600, 900];
	return voiced(
		{
		name: `slide-${direction}`,
		layers: [
			{ kind: "noise", from, to, q: 2.5, at: 0, duration: 0.09, peak: 0.35 },
		],
		},
		voice,
	);
}

/**
 * confirm — an outcome worth marking (submitted, saved, copied at the end of
 * a flow). A rising major third with a soft percussive onset.
 */
export function confirm(voice?: Voice): SoundSpec {
	return voiced(
		{
		name: "confirm",
		layers: [
			{ kind: "noise", from: 3800, to: 3800, q: 3, at: 0, duration: 0.008, peak: 0.35 },
			{ kind: "tone", wave: "triangle", from: C5, to: C5, at: 0, duration: 0.07, peak: 0.5 },
			{ kind: "tone", wave: "triangle", from: E5, to: E5, at: 0.07, duration: 0.1, peak: 0.5 },
		],
		},
		voice,
	);
}

/**
 * deny — something didn't happen. One low tone with a slight downward bend:
 * unmistakable, but it informs rather than punishes. No buzzer.
 */
export function deny(voice?: Voice): SoundSpec {
	return voiced(
		{
		name: "deny",
		layers: [
			{ kind: "tone", wave: "sine", fixed: true, from: 220, to: 196, at: 0, duration: 0.12, peak: 0.5 },
		],
		},
		voice,
	);
}

/** Every spec generator, for enumeration (docs, tests, the playground). */
export const specs = { tap, nudge, toggle, slide, confirm, deny };

/* Referenced by the toggle interval; exported for the article. */
export const REGISTER = { G4, C5, E5, G5 };
