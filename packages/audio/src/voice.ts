/**
 * Voices: a deterministic sound identity derived from a seed.
 *
 * The same idea our avatars engine applies to color, applied to sound: any
 * string or number (a product name, a domain, a user id) always derives the
 * same voice, and the whole sound set re-renders in it. A voice never
 * changes WHAT a sound says — direction pairs still mirror, the tap stays
 * percussion, deny stays low and soft — only HOW it says it:
 *
 *   - register: every pitched layer shifts by −4..+4 semitones
 *   - timbre:   melodic layers speak in sine or triangle
 *   - brightness: percussive noise moves darker or brighter (×0.85..1.25)
 *   - pace:     the whole set breathes a little slower or faster (×0.85..1.05)
 *
 * The ranges are chosen so every invariant in the property tests holds for
 * EVERY voice, and the tests enforce exactly that across seeded samples.
 */

export interface Voice {
	/** Semitone shift applied to all pitched layers, integer −4..4. */
	register: number;
	/** Waveform for melodic layers (deny always stays sine). */
	wave: "sine" | "triangle";
	/** Multiplier on percussive filter centers, 0.85..1.25. */
	brightness: number;
	/** Multiplier on every duration and offset, 0.85..1.05. */
	pace: number;
}

/* 32-bit FNV-1a over the seed string, then xorshift32 draws — both are
 * small published algorithms (public domain), used here as plain math. */
function hash32(input: string): number {
	let h = 0x811c9dc5;
	for (let i = 0; i < input.length; i++) {
		h ^= input.charCodeAt(i);
		h = Math.imul(h, 0x01000193);
	}
	return h >>> 0;
}

function xorshift(state: number): number {
	let x = state || 0x9e3779b9;
	x ^= x << 13;
	x ^= x >>> 17;
	x ^= x << 5;
	return x >>> 0;
}

/** Derive the deterministic voice behind a seed. Pure. */
export function voiceFor(seed: string | number): Voice {
	let s = hash32(String(seed));
	const draw = () => {
		s = xorshift(s);
		return s / 0xffffffff;
	};
	return {
		register: Math.round(draw() * 8) - 4,
		wave: draw() < 0.5 ? "sine" : "triangle",
		brightness: 0.85 + draw() * 0.4,
		pace: 0.85 + draw() * 0.2,
	};
}

/** Frequency multiplier for a voice's register shift. */
export function registerRatio(voice: Voice): number {
	return 2 ** (voice.register / 12);
}
