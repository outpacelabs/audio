/**
 * @outpacelabs/audio — interface sounds with a sense of direction.
 *
 * Every move under 180ms, all synthesized at runtime from pure data
 * specs (no audio files, no network): a neutral tap, a final remove, and
 * mirrored pairs whose acoustic direction agrees with the semantic one —
 * nudge up/down, toggle on/off, slide in/out, turn forward/back,
 * open/close, copy/paste, confirm/deny.
 */

import {
	close as closeSpec,
	confirm as confirmSpec,
	copy as copySpec,
	deny as denySpec,
	nudge as nudgeSpec,
	open as openSpec,
	type PageDirection,
	paste as pasteSpec,
	remove as removeSpec,
	type SpatialDirection,
	slide as slideSpec,
	tap as tapSpec,
	toggle as toggleSpec,
	type ToggleState,
	turn as turnSpec,
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
/** A page switch; air in the direction of travel, then a soft landing. */
export const turn = (direction: PageDirection) =>
	play(turnSpec(direction, getVoice() ?? undefined));
/** An overlay arriving on the z-axis; a strike gliding up a fourth. */
export const open = () => play(openSpec(getVoice() ?? undefined));
/** An overlay leaving; open's mirror, gliding back down. */
export const close = () => play(closeSpec(getVoice() ?? undefined));
/** Something duplicated; a strike and its quieter echo. */
export const copy = () => play(copySpec(getVoice() ?? undefined));
/** Something placed; copy reversed, the ghost landing as a full strike. */
export const paste = () => play(pasteSpec(getVoice() ?? undefined));
/** Something destroyed on purpose; a short dead strike, final not punitive. */
export const remove = () => play(removeSpec(getVoice() ?? undefined));
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
	FmLayer,
	Layer,
	NoiseLayer,
	PageDirection,
	SoundSpec,
	SpatialDirection,
	ToggleState,
	ToneLayer,
	VerticalDirection,
} from "./specs";
export { REGISTER, specs } from "./specs";
