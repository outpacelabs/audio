import { codeToHtml } from "shiki";
import { AudioContent } from "./content";

// Server-highlighted snippets: no Shiki ships to the client, the article
// receives ready-made HTML (same pattern as the glass article).
const SNIPPETS = {
	usage: {
		lang: "tsx",
		code: `import { confirm, copy, deny, nudge, turn } from "@outpacelabs/audio";

<Switch onChange={(on) => toggle(on ? "on" : "off")} />
<Stepper onStep={(direction) => nudge(direction)} />

navigator.clipboard.writeText(text).then(copy);
router.push(next).then(() => turn("forward"));
form.submit().then(confirm).catch(deny);`,
	},
	spec: {
		lang: "ts",
		code: `import { specs, duration } from "@outpacelabs/audio";

specs.nudge("up");
// {
//   name: "nudge-up",
//   layers: [{ kind: "fm", from: 500, to: 570, ratio: 2.76,
//              index: 2.5, at: 0, duration: 0.045, peak: 0.5 }],
// }

duration(specs.confirm()); // 0.089, nothing exceeds 0.18s`,
	},
	envelope: {
		lang: "ts",
		code: `gain.gain.setValueAtTime(0.001, start);
gain.gain.linearRampToValueAtTime(peak, start + 0.004);
gain.gain.exponentialRampToValueAtTime(0.001, end); // never to zero`,
	},
} as const;

const CODE_THEME = "github-light";

export default async function Page() {
	const entries = await Promise.all(
		Object.entries(SNIPPETS).map(
			async ([key, s]) =>
				[key, await codeToHtml(s.code, { lang: s.lang, theme: CODE_THEME })] as const,
		),
	);
	const highlighted = Object.fromEntries(entries) as Record<string, string>;

	return <AudioContent highlighted={highlighted} />;
}
