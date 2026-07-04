/**
 * @outpacelabs/audio — interface sounds with a sense of direction.
 *
 * Six moves, all under 180ms, all synthesized at runtime from pure data
 * specs (no audio files, no network): a neutral tap, and mirrored pairs
 * whose pitch direction agrees with the semantic one — nudge up/down,
 * toggle on/off, slide in/out, confirm/deny.
 */

import {
	confirm as confirmSpec,
	deny as denySpec,
	nudge as nudgeSpec,
	type SpatialDirection,
	slide as slideSpec,
	tap as tapSpec,
	toggle as toggleSpec,
	type ToggleState,
	type VerticalDirection,
} from "./specs";
import { getVoice, play } from "./engine";

/** Neutral percussive click for small, frequent interactions. */
export const tap = () => play(tapSpec(getVoice() ?? undefined));
/** One step of an adjustment; pitch glides in the step's direction. */
export const nudge = (direction: VerticalDirection) =>
	play(nudgeSpec(direction, getVoice() ?? undefined));
/** Binary state change; the interval ascends for on, descends for off. */
export const toggle = (state: ToggleState) =>
	play(toggleSpec(state, getVoice() ?? undefined));
/** Something entering or leaving the stage; a directional noise sweep. */
export const slide = (direction: SpatialDirection) =>
	play(slideSpec(direction, getVoice() ?? undefined));
/** An outcome worth marking; a rising major third. */
export const confirm = () => play(confirmSpec(getVoice() ?? undefined));
/** Something didn't happen; one low tone, informing rather than punishing. */
export const deny = () => play(denySpec(getVoice() ?? undefined));

export {
	duration,
	getSettings,
	getVoice,
	play,
	setEnabled,
	setRespectReducedMotion,
	setVoice,
	setVolume,
	subscribe,
} from "./engine";
export { registerRatio, type Voice, voiceFor } from "./voice";
export type {
	Layer,
	NoiseLayer,
	SoundSpec,
	SpatialDirection,
	ToggleState,
	ToneLayer,
	VerticalDirection,
} from "./specs";
export { REGISTER, specs } from "./specs";
