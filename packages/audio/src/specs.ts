/**
 * Sound specs: every interface sound as pure data.
 *
 * A sound is a handful of layers, each with a start offset, a duration, and
 * a peak level. Specs are produced by pure functions, so the whole sound
 * design is inspectable, versionable, and testable in Node without an
 * AudioContext; the engine is just a small interpreter that schedules them
 * onto Web Audio nodes.
 *
 * THE INSTRUMENT. Every sound here is the same physical event: a strike.
 * A strike has two parts, a contact (a few milliseconds of filtered noise,
 * the touch itself) and a body (a two-operator FM tone at a slightly
 * inharmonic ratio, the material ringing). The FM index decays with the
 * strike, so the brightness dies the way a struck object's does. One
 * material, every gesture; that consistency is the identity.
 *
 * THE GRAMMAR is direction. Sounds come in mirrored pairs, and the
 * acoustic direction always agrees with the semantic one: pitch and
 * brightness rise for up/on/in/confirm, fall for down/off/out/deny.
 *
 * Restraint rules baked into every spec: nothing longer than 180ms, peaks
 * capped well under clipping, errors inform in a low register instead of
 * punishing with a buzzer.
 */

import { registerRatio, type Voice } from "./voice";

export interface ToneLayer {
	kind: "tone";
	wave: "sine" | "triangle" | "square" | "sawtooth";
	/** Voices never re-timbre this layer. */
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

/**
 * A struck body: two-operator FM. `from`/`to` are the carrier in Hz, the
 * modulator sits at carrier × ratio, and `index` sets how bright the strike
 * starts (it decays to nearly nothing across the layer, like a real
 * object's ring darkening).
 */
export interface FmLayer {
	kind: "fm";
	from: number;
	to: number;
	/** Modulator/carrier ratio. Non-integer = inharmonic = material. */
	ratio: number;
	/** Initial modulation index; higher strikes brighter. */
	index: number;
	/** Voices never re-material this layer (deny stays dull everywhere). */
	fixed?: boolean;
	at: number;
	duration: number;
	peak: number;
}

export type Layer = ToneLayer | NoiseLayer | FmLayer;

export interface SoundSpec {
	name: string;
	layers: Layer[];
}

export type VerticalDirection = "up" | "down";
export type ToggleState = "on" | "off";
export type SpatialDirection = "in" | "out";
export type PageDirection = "forward" | "back";

/** Total length of a spec in seconds. */
export function duration(spec: SoundSpec): number {
	return spec.layers.reduce((max, l) => Math.max(max, l.at + l.duration), 0);
}

/* The house material: slightly inharmonic, in the wood/marimba family.
 * Integer ratios ring like organs; 2.76 rings like an object. */
const MATERIAL = 2.76;
/* What a glassier voice multiplies the ratio by (timbre = material). */
const GLASS = 1.27;

/* Low anchors: UI sounds inflect, they don't sing. */
const G4 = 392;
const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;

/**
 * Re-render a spec in a voice. Register shifts every pitched layer,
 * brightness moves percussive filters and FM strike brightness, timbre
 * picks the material (wood or glass), pace stretches the timing. Layers
 * marked fixed keep their timbre/material. Without a voice the spec passes
 * through untouched, so the base sound set is stable byte for byte.
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
			if (l.kind === "fm") {
				return {
					...l,
					at,
					duration: dur,
					from: l.from * ratio,
					to: l.to * ratio,
					index: l.fixed ? l.index : l.index * voice.brightness,
					ratio:
						l.fixed || voice.wave === "sine" ? l.ratio : l.ratio * GLASS,
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
 * tap — the neutral one, no direction. Contact without body: an 8ms
 * bandpass-filtered noise burst, felt more than heard.
 */
export function tap(voice?: Voice): SoundSpec {
	return voiced(
		{
			name: "tap",
			layers: [
				{ kind: "noise", from: 4500, to: 4500, q: 3, at: 0, duration: 0.008, peak: 0.75 },
			],
		},
		voice,
	);
}

/**
 * nudge — one small step of an adjustment (stepper, slider detent,
 * keyboard increment). One tiny strike of the material with a micro-glide
 * in the step's direction.
 */
export function nudge(direction: VerticalDirection, voice?: Voice): SoundSpec {
	const [from, to] = direction === "up" ? [500, 570] : [570, 500];
	return voiced(
		{
			name: `nudge-${direction}`,
			layers: [
				{ kind: "fm", from, to, ratio: MATERIAL, index: 2.5, at: 0, duration: 0.045, peak: 0.5 },
			],
		},
		voice,
	);
}

/**
 * toggle — a binary state change. Two strikes, click-clack: the second
 * lands higher for on and lower for off, with the contact tick riding the
 * latch.
 */
export function toggle(state: ToggleState, voice?: Voice): SoundSpec {
	const [first, second] = state === "on" ? [330, 440] : [440, 330];
	return voiced(
		{
			name: `toggle-${state}`,
			layers: [
				{ kind: "fm", from: first, to: first, ratio: MATERIAL, index: 3, at: 0, duration: 0.035, peak: 0.48 },
				{ kind: "fm", from: second, to: second, ratio: MATERIAL, index: 3, at: 0.055, duration: 0.04, peak: 0.52 },
				{ kind: "noise", from: 2600, to: 2600, q: 3, at: 0.055, duration: 0.008, peak: 0.3 },
			],
		},
		voice,
	);
}

/**
 * slide — something entering or leaving the stage (drawer, sheet, panel).
 * No strike at all: a noise sweep through a rising or falling bandpass,
 * air moving in or out.
 */
export function slide(direction: SpatialDirection, voice?: Voice): SoundSpec {
	const [from, to] = direction === "in" ? [900, 2600] : [2600, 900];
	return voiced(
		{
			name: `slide-${direction}`,
			layers: [
				{ kind: "noise", from, to, q: 2.5, at: 0, duration: 0.07, peak: 0.3 },
			],
		},
		voice,
	);
}

/**
 * confirm — an outcome worth marking (submitted, saved, copied at the end
 * of a flow). One warm strike that lifts as it rings: an upward nod in the
 * material, not a jingle.
 */
export function confirm(voice?: Voice): SoundSpec {
	return voiced(
		{
			name: "confirm",
			layers: [
				{ kind: "noise", from: 3400, to: 3400, q: 3, at: 0, duration: 0.006, peak: 0.35 },
				{ kind: "fm", from: 330, to: 392, ratio: MATERIAL, index: 4, at: 0.004, duration: 0.085, peak: 0.45 },
			],
		},
		voice,
	);
}

/**
 * deny — something didn't happen. A dead strike: low carrier, almost no
 * brightness, bending down as it dies. It informs; it does not punish.
 */
export function deny(voice?: Voice): SoundSpec {
	return voiced(
		{
			name: "deny",
			layers: [
				{ kind: "fm", from: 165, to: 147, ratio: MATERIAL, index: 1.2, fixed: true, at: 0, duration: 0.1, peak: 0.45 },
				{ kind: "noise", from: 700, to: 700, q: 2, at: 0, duration: 0.01, peak: 0.18 },
			],
		},
		voice,
	);
}

/**
 * turn — a page switch, not just motion. Air first (the page in flight),
 * then a soft low strike as the new page lands. Forward sweeps up and lands
 * on a low G; back sweeps down and lands a step lower, the way returning
 * settles.
 */
export function turn(direction: PageDirection, voice?: Voice): SoundSpec {
	const [from, to] = direction === "forward" ? [1200, 2400] : [2400, 1200];
	const landing = direction === "forward" ? 196 : 175;
	return voiced(
		{
			name: `turn-${direction}`,
			layers: [
				{ kind: "noise", from, to, q: 2.5, at: 0, duration: 0.055, peak: 0.28 },
				{ kind: "fm", from: landing, to: landing, ratio: MATERIAL, index: 2, at: 0.06, duration: 0.05, peak: 0.4 },
			],
		},
		voice,
	);
}

/**
 * open — an overlay arriving on the z-axis (modal, menu, popover). One
 * strike gliding up a fourth with a bloom of air underneath it; where slide
 * is pure motion past you, open comes toward you.
 */
export function open(voice?: Voice): SoundSpec {
	return voiced(
		{
			name: "open",
			layers: [
				{ kind: "fm", from: 392, to: 523, ratio: MATERIAL, index: 3.5, at: 0, duration: 0.08, peak: 0.45 },
				{ kind: "noise", from: 1400, to: 2800, q: 2, at: 0, duration: 0.06, peak: 0.14 },
			],
		},
		voice,
	);
}

/** close — open's mirror: the same strike gliding back down, air receding. */
export function close(voice?: Voice): SoundSpec {
	return voiced(
		{
			name: "close",
			layers: [
				{ kind: "fm", from: 523, to: 392, ratio: MATERIAL, index: 3.5, at: 0, duration: 0.08, peak: 0.45 },
				{ kind: "noise", from: 2800, to: 1400, q: 2, at: 0, duration: 0.06, peak: 0.14 },
			],
		},
		voice,
	);
}

/**
 * copy — the original and its duplicate. One full strike, then the same
 * strike again as an echo: quieter and duller, a copy of the first. The
 * metaphor is the mechanism.
 */
export function copy(voice?: Voice): SoundSpec {
	return voiced(
		{
			name: "copy",
			layers: [
				{ kind: "noise", from: 4000, to: 4000, q: 3, at: 0, duration: 0.006, peak: 0.3 },
				{ kind: "fm", from: 620, to: 620, ratio: MATERIAL, index: 3, at: 0.004, duration: 0.04, peak: 0.5 },
				{ kind: "fm", from: 620, to: 620, ratio: MATERIAL, index: 1.4, at: 0.075, duration: 0.045, peak: 0.24 },
			],
		},
		voice,
	);
}

/**
 * paste — copy played in reverse. The ghost arrives first, then lands as
 * the full strike, contact and all, the moment it becomes real in the
 * document.
 */
export function paste(voice?: Voice): SoundSpec {
	return voiced(
		{
			name: "paste",
			layers: [
				{ kind: "fm", from: 620, to: 620, ratio: MATERIAL, index: 1.4, at: 0, duration: 0.04, peak: 0.24 },
				{ kind: "noise", from: 4000, to: 4000, q: 3, at: 0.07, duration: 0.006, peak: 0.3 },
				{ kind: "fm", from: 620, to: 620, ratio: MATERIAL, index: 3, at: 0.074, duration: 0.05, peak: 0.5 },
			],
		},
		voice,
	);
}

/**
 * remove — something destroyed on purpose. A short dead strike, higher and
 * drier than deny: not a refusal, a completion. Fixed so no voice brightens
 * it; deletion sounds final everywhere.
 */
export function remove(voice?: Voice): SoundSpec {
	return voiced(
		{
			name: "remove",
			layers: [
				{ kind: "fm", from: 233, to: 208, ratio: MATERIAL, index: 1.6, fixed: true, at: 0, duration: 0.06, peak: 0.45 },
				{ kind: "noise", from: 1100, to: 1100, q: 2, at: 0, duration: 0.008, peak: 0.2 },
			],
		},
		voice,
	);
}

/** Every spec generator, for enumeration (docs, tests, the playground). */
export const specs = {
	tap,
	nudge,
	toggle,
	slide,
	turn,
	open,
	close,
	copy,
	paste,
	confirm,
	deny,
	remove,
};

/* Kept for API stability; the instrument's own anchors live above. */
export const REGISTER = { G4, C5, E5, G5 };
export { GLASS, MATERIAL };
