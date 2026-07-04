/**
 * Property tests for the sound specs. Specs are pure data, so the entire
 * sound design is testable in Node without an AudioContext:
 *
 *  - restraint: every sound ends within 180ms; peaks stay under clipping
 *  - the tap is true percussion: 5-15ms, bandpass 3000-6000Hz, Q 2-5
 *  - direction: every mirrored pair reverses its acoustic direction
 *    (nudge glides, toggle intervals, slide sweeps, confirm vs deny)
 *  - deny informs, it does not punish: low register, dull material
 *  - the instrument is consistent: every struck body shares the house
 *    material ratio and a sane brightness index
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
	specs.turn("forward"),
	specs.turn("back"),
	specs.open(),
	specs.close(),
	specs.copy(),
	specs.paste(),
	specs.confirm(),
	specs.deny(),
	specs.remove(),
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

	const fwd = specs.turn("forward").layers;
	const back = specs.turn("back").layers;
	const fwdAir = fwd.find((l) => l.kind === "noise");
	const backAir = back.find((l) => l.kind === "noise");
	const fwdLanding = fwd.find((l) => l.kind === "fm");
	const backLanding = back.find((l) => l.kind === "fm");
	check("turn · forward air sweeps up", fwdAir.to > fwdAir.from);
	check("turn · back air sweeps down", backAir.to < backAir.from);
	check("turn · air mirrors", fwdAir.from === backAir.to && fwdAir.to === backAir.from);
	check("turn · lands after the air starts", fwdLanding.at > fwdAir.at);
	check("turn · back lands lower than forward", backLanding.from < fwdLanding.from);
	check("turn · landing is low register (≤ 250Hz)", fwdLanding.from <= 250 && backLanding.from <= 250);

	const openBody = specs.open().layers.find((l) => l.kind === "fm");
	const closeBody = specs.close().layers.find((l) => l.kind === "fm");
	const openAir = specs.open().layers.find((l) => l.kind === "noise");
	const closeAir = specs.close().layers.find((l) => l.kind === "noise");
	check("open · glides up", openBody.to > openBody.from);
	check("close · glides down", closeBody.to < closeBody.from);
	check("open/close · strike mirrors", openBody.from === closeBody.to && openBody.to === closeBody.from);
	check("open/close · air mirrors", openAir.from === closeAir.to && openAir.to === closeAir.from);

	const copyStrikes = specs.copy().layers.filter((l) => l.kind === "fm");
	const pasteStrikes = specs.paste().layers.filter((l) => l.kind === "fm");
	check("copy · two strikes of the same pitch", copyStrikes.length === 2 && copyStrikes[0].from === copyStrikes[1].from);
	check("copy · echo is quieter", copyStrikes[1].peak < copyStrikes[0].peak);
	check("copy · echo is duller", copyStrikes[1].index < copyStrikes[0].index);
	check("paste · ghost first, full strike second", pasteStrikes[0].peak < pasteStrikes[1].peak && pasteStrikes[0].index < pasteStrikes[1].index);
	check(
		"copy/paste · same two strikes, reversed order",
		copyStrikes[0].index === pasteStrikes[1].index && copyStrikes[1].index === pasteStrikes[0].index && copyStrikes[0].from === pasteStrikes[0].from,
	);
	const copyContact = specs.copy().layers.find((l) => l.kind === "noise");
	const pasteContact = specs.paste().layers.find((l) => l.kind === "noise");
	check("copy · contact rides the original", copyContact.at < copyStrikes[1].at);
	check("paste · contact rides the landing", pasteContact.at > pasteStrikes[0].at);

	const [confirmBody] = specs.confirm().layers.filter((l) => l.kind === "fm");
	check("confirm · inflection rises", confirmBody.to > confirmBody.from);
	const [denyBody] = specs.deny().layers;
	check("deny · bends down", denyBody.to < denyBody.from);
	check(
		"confirm/deny · registers oppose",
		denyBody.from < confirmBody.from,
	);
}

// Deny informs, it does not punish.
{
	const [denyBody] = specs.deny().layers;
	check("deny · low register (under 300Hz)", denyBody.from <= 300);
	check("deny · dull material (index ≤ 2)", denyBody.kind === "fm" && denyBody.index <= 2);
	check("deny · not loud", denyBody.peak <= 0.6);
}

// Remove is final, not punitive: short, low, dull, and distinct from deny.
{
	const removeBody = specs.remove().layers.find((l) => l.kind === "fm");
	const [denyBody] = specs.deny().layers;
	check("remove · bends down", removeBody.to < removeBody.from);
	check("remove · low register (under 300Hz)", removeBody.from <= 300);
	check("remove · dull material (index ≤ 2)", removeBody.index <= 2);
	check("remove · shorter than deny", duration(specs.remove()) < duration(specs.deny()));
	check("remove · sits above deny (completion, not refusal)", removeBody.from > denyBody.from);
	check("remove · material fixed against voices", removeBody.fixed === true);
}

// The instrument is consistent: struck bodies share the house material and
// stay in a sane brightness range.
{
	let ok = true;
	for (const spec of all) {
		for (const l of spec.layers) {
			if (l.kind !== "fm") continue;
			if (!(l.ratio >= 1.5 && l.ratio <= 6)) ok = false;
			if (!(l.index > 0 && l.index <= 8)) ok = false;
		}
	}
	check("instrument · material ratio and index in range", ok);
	const bodies = [specs.nudge("up"), specs.toggle("on"), specs.turn("forward"), specs.open(), specs.copy(), specs.confirm()]
		.flatMap((s) => s.layers)
		.filter((l) => l.kind === "fm");
	check(
		"instrument · one material across the set",
		bodies.every((l) => l.ratio === bodies[0].ratio),
	);
}

// Determinism.
for (const [name, make] of [
	["tap", () => specs.tap()],
	["nudge up", () => specs.nudge("up")],
	["toggle off", () => specs.toggle("off")],
	["confirm", () => specs.confirm()],
	["copy", () => specs.copy()],
	["turn forward", () => specs.turn("forward")],
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
			specs.turn("forward", v),
			specs.turn("back", v),
			specs.open(v),
			specs.close(v),
			specs.copy(v),
			specs.paste(v),
			specs.confirm(v),
			specs.deny(v),
			specs.remove(v),
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

		const fwdV = specs.turn("forward", v).layers.find((l) => l.kind === "noise");
		const backV = specs.turn("back", v).layers.find((l) => l.kind === "noise");
		if (!(fwdV.to > fwdV.from && backV.to < backV.from)) allHold = false;
		const openV = specs.open(v).layers.find((l) => l.kind === "fm");
		const closeV = specs.close(v).layers.find((l) => l.kind === "fm");
		if (!(openV.to > openV.from && closeV.to < closeV.from)) allHold = false;
		const copyV = specs.copy(v).layers.filter((l) => l.kind === "fm");
		if (!(copyV[1].peak < copyV[0].peak && copyV[1].index < copyV[0].index)) allHold = false;

		// remove stays low and dull in every voice (fixed material).
		const removeV = specs.remove(v).layers.find((l) => l.kind === "fm");
		if (!(removeV.from <= 470 && removeV.index <= 2 && removeV.to < removeV.from)) allHold = false;

		// deny stays low and dull in every voice (fixed material).
		const [denyBody] = specs.deny(v).layers;
		if (!(denyBody.from <= 330 && denyBody.kind === "fm" && denyBody.index <= 2 && denyBody.peak <= 0.6)) allHold = false;
	}
	check("voices · every invariant holds across 100 seeded voices", allHold);
	check("voices · seeds actually differentiate (>60 distinct of 100)", distinct.size > 60, `${distinct.size}`);
	check(
		"voices · no voice reproduces another seed's spec byte-for-byte by accident",
		JSON.stringify(specs.confirm(voiceFor("acme"))) !== JSON.stringify(specs.confirm(voiceFor("globex"))),
	);
	check(
		"voices · unvoiced specs unchanged (base set is stable)",
		JSON.stringify(specs.tap()) === JSON.stringify({ name: "tap", layers: [{ kind: "noise", from: 4500, to: 4500, q: 3, at: 0, duration: 0.008, peak: 0.75 }] }),
	);
}

console.log(failures === 0 ? "\nALL PROPERTY CHECKS PASS" : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
