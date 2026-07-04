/**
 * Property tests for the sound specs. Specs are pure data, so the entire
 * sound design is testable in Node without an AudioContext:
 *
 *  - restraint: every sound ends within 180ms; peaks stay under clipping
 *  - the tap is true percussion: 5-15ms, bandpass 3000-6000Hz, Q 2-5
 *  - direction: every mirrored pair reverses its acoustic direction
 *    (nudge glides, toggle intervals, slide sweeps, confirm vs deny)
 *  - deny informs, it does not punish: low register, no square/sawtooth
 *  - determinism: the same call always produces the same spec
 */
import { duration, specs, voiceFor } from "../dist/index.js";

let failures = 0;
const check = (name, ok, detail = "") => {
	console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  ${detail}`}`);
	if (!ok) failures++;
};

const all = [
	specs.tap(),
	specs.nudge("up"),
	specs.nudge("down"),
	specs.toggle("on"),
	specs.toggle("off"),
	specs.slide("in"),
	specs.slide("out"),
	specs.confirm(),
	specs.deny(),
];

// Restraint: short and under clipping, for every sound.
for (const spec of all) {
	check(`${spec.name} · ends within 180ms`, duration(spec) <= 0.18, `${duration(spec)}s`);
	check(
		`${spec.name} · peaks in (0, 0.9]`,
		spec.layers.every((l) => l.peak > 0 && l.peak <= 0.9),
	);
	check(
		`${spec.name} · layers start at or after 0`,
		spec.layers.every((l) => l.at >= 0 && l.duration > 0),
	);
	check(
		`${spec.name} · audible frequency range`,
		spec.layers.every((l) => l.from >= 60 && l.from <= 8000 && l.to >= 60 && l.to <= 8000),
	);
}

// The tap is true percussion (click parameter ranges).
{
	const [click] = specs.tap().layers;
	check("tap · single noise burst", specs.tap().layers.length === 1 && click.kind === "noise");
	check("tap · 5-15ms", click.duration >= 0.005 && click.duration <= 0.015, `${click.duration}s`);
	check("tap · bandpass 3000-6000Hz", click.from >= 3000 && click.from <= 6000, `${click.from}Hz`);
	check("tap · Q 2-5", click.q >= 2 && click.q <= 5, `Q ${click.q}`);
}

// Direction: every pair reverses.
{
	const up = specs.nudge("up").layers[0];
	const down = specs.nudge("down").layers[0];
	check("nudge · up glides up", up.to > up.from);
	check("nudge · down glides down", down.to < down.from);
	check("nudge · pair mirrors", up.from === down.to && up.to === down.from);

	const on = specs.toggle("on").layers;
	const off = specs.toggle("off").layers;
	check("toggle · on interval ascends", on[1].from > on[0].from);
	check("toggle · off interval descends", off[1].from < off[0].from);
	check(
		"toggle · pair mirrors",
		on[0].from === off[1].from && on[1].from === off[0].from,
	);

	const slideIn = specs.slide("in").layers[0];
	const slideOut = specs.slide("out").layers[0];
	check("slide · in sweeps up", slideIn.to > slideIn.from);
	check("slide · out sweeps down", slideOut.to < slideOut.from);
	check(
		"slide · pair mirrors",
		slideIn.from === slideOut.to && slideIn.to === slideOut.from,
	);

	const confirmTones = specs.confirm().layers.filter((l) => l.kind === "tone");
	check("confirm · notes ascend", confirmTones[1].from > confirmTones[0].from);
	const [denyTone] = specs.deny().layers;
	check("deny · bends down", denyTone.to < denyTone.from);
	check(
		"confirm/deny · registers oppose",
		denyTone.from < Math.min(...confirmTones.map((l) => l.from)),
	);
}

// Deny informs, it does not punish.
{
	const [denyTone] = specs.deny().layers;
	check("deny · low register (under 300Hz)", denyTone.from <= 300);
	check("deny · soft waveform", denyTone.wave === "sine" || denyTone.wave === "triangle");
	check("deny · not loud", denyTone.peak <= 0.6);
}

// Determinism.
for (const [name, make] of [
	["tap", () => specs.tap()],
	["nudge up", () => specs.nudge("up")],
	["toggle off", () => specs.toggle("off")],
	["confirm", () => specs.confirm()],
]) {
	check(`${name} · deterministic`, JSON.stringify(make()) === JSON.stringify(make()));
}

// Voices: a deterministic identity from a seed. The invariants above must
// hold for EVERY voice, so sample many seeds and re-assert the load-bearing
// ones on the voiced sound set.
{
	const seeds = Array.from({ length: 100 }, (_, i) => `seed-${i * 7919}`);
	let allHold = true;
	const distinct = new Set();
	for (const seed of seeds) {
		const v = voiceFor(seed);
		distinct.add(JSON.stringify(v));

		// Derivation is deterministic and in range.
		if (JSON.stringify(v) !== JSON.stringify(voiceFor(seed))) allHold = false;
		if (!(Number.isInteger(v.register) && v.register >= -4 && v.register <= 4)) allHold = false;
		if (!(v.brightness >= 0.85 && v.brightness <= 1.25)) allHold = false;
		if (!(v.pace >= 0.85 && v.pace <= 1.05)) allHold = false;

		const voicedAll = [
			specs.tap(v),
			specs.nudge("up", v),
			specs.nudge("down", v),
			specs.toggle("on", v),
			specs.toggle("off", v),
			specs.slide("in", v),
			specs.slide("out", v),
			specs.confirm(v),
			specs.deny(v),
		];
		for (const spec of voicedAll) {
			if (duration(spec) > 0.18) allHold = false;
			if (!spec.layers.every((l) => l.peak > 0 && l.peak <= 0.9)) allHold = false;
			if (!spec.layers.every((l) => l.from >= 60 && l.from <= 8000 && l.to >= 60 && l.to <= 8000)) allHold = false;
		}

		// The tap stays true percussion in every voice.
		const [click] = specs.tap(v).layers;
		if (!(click.from >= 3000 && click.from <= 6000 && click.q >= 2 && click.q <= 5)) allHold = false;

		// Direction still mirrors in every voice.
		const up = specs.nudge("up", v).layers[0];
		const down = specs.nudge("down", v).layers[0];
		if (!(up.to > up.from && down.to < down.from)) allHold = false;
		const on = specs.toggle("on", v).layers;
		const off = specs.toggle("off", v).layers;
		if (!(on[1].from > on[0].from && off[1].from < off[0].from)) allHold = false;

		// deny stays low and soft in every voice.
		const [denyTone] = specs.deny(v).layers;
		if (!(denyTone.from <= 330 && denyTone.wave === "sine" && denyTone.peak <= 0.6)) allHold = false;
	}
	check("voices · every invariant holds across 100 seeded voices", allHold);
	check("voices · seeds actually differentiate (>60 distinct of 100)", distinct.size > 60, `${distinct.size}`);
	check(
		"voices · no voice reproduces another seed's spec byte-for-byte by accident",
		JSON.stringify(specs.confirm(voiceFor("acme"))) !== JSON.stringify(specs.confirm(voiceFor("globex"))),
	);
	check(
		"voices · unvoiced specs unchanged (base set is stable)",
		JSON.stringify(specs.tap()) === JSON.stringify({ name: "tap", layers: [{ kind: "noise", from: 4200, to: 4200, q: 3, at: 0, duration: 0.01, peak: 0.8 }] }),
	);
}

console.log(failures === 0 ? "\nALL PROPERTY CHECKS PASS" : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
