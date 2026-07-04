"use client";

import {
	close as closeSound,
	confirm,
	copy as copySound,
	deny,
	duration,
	nudge,
	open as openSound,
	paste as pasteSound,
	remove as removeSound,
	type SoundSpec,
	slide,
	specs,
	tap,
	toggle,
	turn,
	type Voice,
} from "@outpacelabs/audio";
import {
	IconArrowDown,
	IconArrowUp,
	IconCheckmark1,
	IconCircleDashed,
	IconClipboard,
	IconFiles,
	IconCrossMedium,
	IconPointer,
	IconChevronDownMedium,
	IconRecord,
	IconChevronDoubleLeft,
	IconChevronDoubleRight,
	IconExpand45,
	IconArrowBoxRight,
	IconMinimize45,
	IconArrowBoxLeft,
	IconTrashRounded,
} from "@central-icons-react/round-outlined-radius-2-stroke-1.5";
import { useSmoothCorners } from "@outpacelabs/smooth/react";
import { motion, useReducedMotion } from "motion/react";
import {
	type CSSProperties,
	type ReactNode,
	useEffect,
	useRef,
	useState,
} from "react";
import { useScrollSpy } from "./use-scroll-spy";

/* ── entrance tokens (shared duration/curve; sequence via delays only) ── */
const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const REVEAL = { duration: 0.28, ease: EASE_OUT };

const INK = "var(--ink)";
const MUTED = "var(--muted)";

const OutpaceLogo = () => (
	<svg
		aria-hidden="true"
		width="33"
		height="12"
		viewBox="0 0 33 12"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M16.5 6C16.5 2.68629 13.7298 0 10.3125 0H6.1875C2.77024 0 0 2.68629 0 6C0 9.31371 2.77024 12 6.1875 12H10.3125C13.7298 12 16.5 9.31371 16.5 6Z"
			fill="#171717"
			fillOpacity="0.92"
		/>
		<path
			d="M16.5 0H29.9062C31.6149 0 33 1.34315 33 3C33 4.65685 31.6149 6 29.9062 6H22.6875C19.2702 6 16.5 3.31371 16.5 0Z"
			fill="#171717"
			fillOpacity="0.92"
		/>
		<path
			d="M24.75 12C26.4586 12 27.8437 10.6569 27.8437 9C27.8437 7.34315 26.4586 6 24.75 6H22.6875C19.2702 6 16.5 8.68629 16.5 12H24.75Z"
			fill="#171717"
			fillOpacity="0.92"
		/>
	</svg>
);

const GithubMark = () => (
	<svg
		width="15"
		height="15"
		viewBox="0 0 24 24"
		fill="currentColor"
		aria-hidden="true"
		className="block shrink-0"
	>
		<path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
	</svg>
);

/* ── labs switcher: the sibling sites, favicon and all. Each row loads the
      live /icon.png straight from the sibling, so there is nothing to copy
      around when a favicon changes. ── */
const LABS = [
	{ name: "avatars", href: "https://avatars.outpacestudios.com" },
	{ name: "smooth", href: "https://smooth.outpacestudios.com" },
	{ name: "audio", href: "https://audio.outpacestudios.com" },
];
const CURRENT_LAB = "audio";

function LabsMenu() {
	const [menuOpen, setMenuOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!menuOpen) return;
		const onDown = (e: PointerEvent) => {
			if (!rootRef.current?.contains(e.target as Node)) {
				closeSound();
				setMenuOpen(false);
			}
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				closeSound();
				setMenuOpen(false);
			}
		};
		window.addEventListener("pointerdown", onDown);
		window.addEventListener("keydown", onKey);
		return () => {
			window.removeEventListener("pointerdown", onDown);
			window.removeEventListener("keydown", onKey);
		};
	}, [menuOpen]);

	return (
		<div ref={rootRef} className="relative">
			<button
				type="button"
				aria-haspopup="menu"
				aria-expanded={menuOpen}
				aria-label="More Outpace Labs projects"
				onClick={() => {
					if (menuOpen) closeSound();
					else openSound();
					setMenuOpen(!menuOpen);
				}}
				className="inline-flex items-center gap-1.5 rounded-full bg-(--chip) py-2.5 pl-3.5 pr-3 text-sm font-[550] leading-none text-(--ink) transition hover:bg-[rgba(23,23,23,0.08)] motion-safe:active:scale-[0.97]"
			>
				More
				<IconChevronDownMedium
					aria-hidden="true"
					size={14}
					className={`transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
				/>
			</button>
			{menuOpen && (
				<motion.div
					role="menu"
					initial={{ opacity: 0, y: -4, scale: 0.98 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					transition={{ duration: 0.16, ease: EASE_OUT }}
					className="absolute right-0 top-[calc(100%+8px)] z-20 w-44 rounded-[12px] bg-(--chip) p-1.5 shadow-[0_4px_16px_rgba(23,23,23,0.10),0_16px_48px_rgba(23,23,23,0.16)]"
				>
					{LABS.map((site) => (
						<a
							key={site.name}
							role="menuitem"
							href={site.href}
							aria-current={site.name === CURRENT_LAB ? "page" : undefined}
							onClick={() => tap()}
							className="flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-sm font-[550] leading-none text-(--ink) transition-colors hover:bg-[rgba(23,23,23,0.08)]"
						>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={`${site.href}/icon.png`}
								alt=""
								width={16}
								height={16}
								className="rounded-[4px]"
							/>
							{site.name}
							{site.name === CURRENT_LAB && (
								<span className="ml-auto text-[11px] text-(--muted)">
									current
								</span>
							)}
						</a>
					))}
				</motion.div>
			)}
		</div>
	);
}

/* ── article primitives (glass reading column) ── */

function Col({ children }: { children: ReactNode }) {
	const reduced = useReducedMotion() ?? false;
	return (
		<motion.div
			style={{ maxWidth: 640, margin: "0 auto" }}
			initial={reduced ? false : { opacity: 0, y: 12 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "0px 0px -64px 0px" }}
			transition={reduced ? { duration: 0 } : REVEAL}
		>
			{children}
		</motion.div>
	);
}

function H2({ children }: { children: ReactNode }) {
	return (
		<h2 className="mt-20 text-[15px] font-[450] tracking-[-0.1px] text-(--ink) text-balance">
			{children}
		</h2>
	);
}

function P({ children }: { children: ReactNode }) {
	return (
		<p className="mt-4 text-sm leading-[1.72] tracking-[0.1px] text-(--body) text-pretty">
			{children}
		</p>
	);
}

function C({ children }: { children: ReactNode }) {
	return (
		<code className="rounded-[6px] bg-(--chip) px-[5px] py-[3px] font-mono text-[0.84em] text-(--ink)">
			{children}
		</code>
	);
}

/* Borderless code surface with server-rendered Shiki highlighting. */
function Code({ html }: { html: string }) {
	const smoothRef = useSmoothCorners<HTMLDivElement>(16);
	return (
		<div
			ref={smoothRef}
			className="article-code mt-[22px] overflow-hidden rounded-[16px] bg-(--surface)"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: server-generated Shiki HTML
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
}

/* ── spec visualization: time → x, log frequency → y, drawn from the same
      pure data the engine plays. Tones are solid strokes, noise is a soft
      wide band. Peak level sets opacity. ── */
function SpecViz({ spec }: { spec: SoundSpec }) {
	const W = 96;
	const H = 36;
	const T = 0.18;
	const fLo = Math.log2(80);
	const fHi = Math.log2(8000);
	const x = (t: number) => (t / T) * W;
	const y = (f: number) => H - ((Math.log2(f) - fLo) / (fHi - fLo)) * H;

	return (
		<svg
			aria-hidden="true"
			viewBox={`0 0 ${W} ${H}`}
			width={W}
			height={H}
			className="block"
		>
			<title>{`${spec.name} envelope`}</title>
			{spec.layers.map((l, i) => (
				<line
					key={`${spec.name}-${i}`}
					x1={x(l.at)}
					y1={y(l.from)}
					x2={x(l.at + l.duration)}
					y2={y(l.to)}
					stroke="#171717"
					strokeWidth={l.kind === "noise" ? 7 : l.kind === "fm" ? 3.5 : 2}
					strokeLinecap="round"
					opacity={l.kind === "noise" ? l.peak * 0.5 : l.peak + 0.3}
				/>
			))}
		</svg>
	);
}

type TileIcon = React.ComponentType<{
	size?: number;
	className?: string;
	"aria-hidden"?: boolean | "true" | "false";
}>;

function soundsFor(
	voice?: Voice,
): { label: string; icon: TileIcon; spec: SoundSpec; play: () => void }[] {
	return [
		{ label: "tap", icon: IconPointer, spec: specs.tap(voice), play: tap },
		{ label: "nudge up", icon: IconArrowUp, spec: specs.nudge("up", voice), play: () => nudge("up") },
		{ label: "nudge down", icon: IconArrowDown, spec: specs.nudge("down", voice), play: () => nudge("down") },
		{ label: "toggle on", icon: IconRecord, spec: specs.toggle("on", voice), play: () => toggle("on") },
		{ label: "toggle off", icon: IconCircleDashed, spec: specs.toggle("off", voice), play: () => toggle("off") },
		{ label: "slide in", icon: IconArrowBoxRight, spec: specs.slide("in", voice), play: () => slide("in") },
		{ label: "slide out", icon: IconArrowBoxLeft, spec: specs.slide("out", voice), play: () => slide("out") },
		{ label: "turn forward", icon: IconChevronDoubleRight, spec: specs.turn("forward", voice), play: () => turn("forward") },
		{ label: "turn back", icon: IconChevronDoubleLeft, spec: specs.turn("back", voice), play: () => turn("back") },
		{ label: "open", icon: IconExpand45, spec: specs.open(voice), play: openSound },
		{ label: "close", icon: IconMinimize45, spec: specs.close(voice), play: closeSound },
		{ label: "copy", icon: IconFiles, spec: specs.copy(voice), play: copySound },
		{ label: "paste", icon: IconClipboard, spec: specs.paste(voice), play: pasteSound },
		{ label: "confirm", icon: IconCheckmark1, spec: specs.confirm(voice), play: confirm },
		{ label: "deny", icon: IconCrossMedium, spec: specs.deny(voice), play: deny },
		{ label: "remove", icon: IconTrashRounded, spec: specs.remove(voice), play: removeSound },
	];
}

/* One playground tile: smoothed corners that soften while pressed, so the
   corner gives exactly when the sound plays. */
function SoundTile({
	sound,
	reduced,
}: {
	sound: {
		label: string;
		icon: TileIcon;
		spec: SoundSpec;
		play: () => void;
	};
	reduced: boolean;
}) {
	const ref = useSmoothCorners<HTMLButtonElement>(16, 60, { press: 100 });
	return (
		<motion.button
			ref={ref}
			type="button"
			onClick={sound.play}
			whileTap={reduced ? undefined : { scale: 0.97 }}
			className="flex flex-col items-start gap-4 rounded-[16px] bg-(--surface) p-5 text-left transition-colors hover:bg-[rgba(23,23,23,0.07)]"
		>
			<div className="flex w-full items-baseline justify-between">
				<span className="font-mono text-[13px] text-(--ink)">
					{sound.label}
				</span>
				<sound.icon
					aria-hidden="true"
					size={16}
					className="shrink-0 self-center text-(--muted)"
				/>
			</div>
			<SpecViz spec={sound.spec} />
			<span className="font-mono text-[11px] tabular-nums text-(--muted)">
				{Math.round(duration(sound.spec) * 1000)}ms
			</span>
		</motion.button>
	);
}

/* ── table of contents (glass, right gutter) ── */
const TOC: { id: string; label: string }[] = [
	{ id: "playground", label: "Playground" },
	{ id: "direction", label: "One gesture, reversed" },
	{ id: "data", label: "Design as data" },
	{ id: "voice", label: "A voice from a seed" },
	{ id: "synthesis", label: "The instrument" },
	{ id: "restraint", label: "Quiet by default" },
];

const TOC_ITEM_H = 28;

function TableOfContents() {
	const reduced = useReducedMotion() ?? false;
	const [wide, setWide] = useState(false);
	const { active, scrollToId } = useScrollSpy({
		ids: TOC.map((it) => it.id),
		topOffset: 96,
	});

	useEffect(() => {
		const setW = () => setWide(window.innerWidth >= 1080);
		setW();
		window.addEventListener("resize", setW);
		return () => window.removeEventListener("resize", setW);
	}, []);

	if (!wide) return null;

	return (
		<aside
			aria-label="Contents"
			style={{ position: "absolute", top: 0, right: 0, height: "100%", width: 196 }}
		>
			<motion.nav
				// Opacity-only fade-in (a transform would break the sticky nav).
				initial={reduced ? false : { opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={reduced ? { duration: 0 } : { duration: 0.4, delay: 0.15 }}
				style={{
					position: "sticky",
					top: 96,
					marginTop: 76,
					paddingLeft: 13,
					display: "flex",
					flexDirection: "column",
				}}
			>
				<style>{`.toc-link:hover{color:rgba(23,23,23,0.74) !important}`}</style>
				{TOC.map((it, i) => (
					<a
						key={it.id}
						href={`#${it.id}`}
						className="toc-link"
						aria-current={i === active ? "true" : undefined}
						onClick={(e) => {
							e.preventDefault();
							scrollToId(it.id);
						}}
						style={{
							display: "flex",
							alignItems: "center",
							height: TOC_ITEM_H,
							textDecoration: "none",
							fontSize: 14,
							letterSpacing: "0.1px",
							cursor: "pointer",
							color: i === active ? INK : MUTED,
							transition: "color 200ms ease",
						}}
					>
						{it.label}
					</a>
				))}
			</motion.nav>
		</aside>
	);
}

const SECTION: CSSProperties = { scrollMarginTop: 96 };

export function AudioContent({
	highlighted,
}: {
	highlighted: Record<string, string>;
}) {
	const reduced = useReducedMotion() ?? false;
	const [showTopFade, setShowTopFade] = useState(false);

	useEffect(() => {
		const onScroll = () => setShowTopFade(window.scrollY > 50);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);
	const [installCopied, setInstallCopied] = useState(false);
	const sounds = soundsFor();

	const reveal = (delay: number) => ({
		initial: reduced ? false : { opacity: 0, y: 12 },
		animate: { opacity: 1, y: 0 },
		transition: reduced ? { duration: 0 } : { ...REVEAL, delay },
	});

	return (
		<div className="flex min-h-screen flex-col items-center px-6 pb-24 pt-3">
			{/* Top scroll fade — content slips under white, the header stays. */}
			<div
				className={`pointer-events-none fixed inset-x-0 top-0 z-[5] h-[80px] transition-opacity duration-300 ${
					showTopFade ? "opacity-100" : "opacity-0"
				}`}
				style={{
					background: "linear-gradient(to bottom, #fff 0%, transparent 100%)",
				}}
			/>
			{/* Shiki blocks: our flat surface owns the background. */}
			<style>{`.article-code .shiki{margin:0;padding:16px 18px;overflow-x:auto;line-height:1.65;background:transparent !important;font-family:var(--font-mono);font-size:13px}
.article-code .shiki code{font-family:inherit;background:transparent;padding:0}`}</style>

			{/* Header — brand mark left, GitHub pill right (glass nav type). */}
			<header className="sticky top-4 z-10 flex w-full items-center justify-between rounded-[10px]">
				<a
					href="https://outpacestudios.com"
					target="_blank"
					rel="noopener noreferrer"
					aria-label="Outpace Studios"
					className="flex items-center transition-opacity hover:opacity-70"
				>
					<OutpaceLogo />
				</a>
				<div className="flex items-center gap-2">
					<a
						href="https://github.com/outpacelabs/audio"
						target="_blank"
						rel="noopener noreferrer"
						onClick={() => tap()}
						className="inline-flex items-center gap-1.5 rounded-full bg-(--chip) py-2.5 pl-3 pr-3.5 text-sm font-[550] leading-none text-(--ink) transition hover:bg-[rgba(23,23,23,0.08)] motion-safe:active:scale-[0.97]"
					>
						<GithubMark />
						GitHub
					</a>
					<LabsMenu />
				</div>
			</header>

			{/* Hero */}
			<motion.div
				className="flex flex-col items-center gap-3 pb-12 pt-14 text-center sm:pt-20"
				{...reveal(0)}
			>
				<h1 className="text-2xl font-[550] leading-[1.2] tracking-[-0.4px] text-(--ink) text-balance">
					Interface sounds with a sense of direction
				</h1>
				<p className="max-w-[520px] text-sm leading-[1.72] tracking-[0.1px] text-(--body) text-pretty">
					Interfaces move in directions; these sounds do too. Every move
					under 180 milliseconds, synthesized at runtime from pure data, in
					mirrored pairs: up and down, on and off, in and out, yes and no.
				</p>
				<button
					type="button"
					title="Copy install command"
					aria-live="polite"
					onClick={() => {
						void navigator.clipboard
							?.writeText("pnpm add @outpacelabs/audio")
							.then(() => {
								copySound();
								setInstallCopied(true);
								window.setTimeout(() => setInstallCopied(false), 1400);
							});
					}}
					className="mt-3 flex h-12 items-center gap-3 rounded-full bg-(--chip) px-5 transition hover:bg-[rgba(23,23,23,0.08)] motion-safe:active:scale-[0.98]"
				>
					<span className="w-3 select-none font-mono text-[13px] leading-5 text-(--muted)">
						{installCopied ? "✓" : "$"}
					</span>
					<span className="font-mono text-[13px] leading-5 text-(--ink)">
						pnpm add @outpacelabs/audio
					</span>
				</button>
			</motion.div>

			{/* Playground */}
			<motion.section
				id="playground"
				style={SECTION}
				className="w-full max-w-[1080px]"
				{...reveal(0.08)}
			>
				<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
					{sounds.map((s) => (
						<SoundTile key={s.label} sound={s} reduced={reduced} />
					))}
				</div>

			</motion.section>

			{/* ── the article: 1080 container holding the 640 column + TOC ── */}
			<div className="relative mx-auto mt-8 w-full max-w-[1080px]">
				<TableOfContents />
				<main>
					<section id="direction" style={SECTION}>
						<Col>
							<H2>One gesture, played forward or reversed</H2>
							<P>
								Interfaces already speak in directions. Panels slide in and
								out, values step up and down, switches flip on and off, flows
								end in yes or no. The sounds mirror that grammar: every pair
								is a single gesture, played forward or reversed. Rising pitch
								opens, affirms, increases. Falling pitch closes, dismisses,
								declines. Learn one sound and you have learned its opposite.
							</P>
							<P>
								Some states ask for more than a direction, and there the
								gesture itself carries the meaning. A copy is a strike
								followed by its own echo, quieter and duller: the duplicate.
								Paste is the same pair reversed, the ghost arriving first and
								landing as the real thing. A page turn is air in the
								direction of travel, then a soft low landing on the new page.
								Open and close trade the same glide up and down a fourth. And
								remove is a single dead strike, shorter and drier than deny,
								because deletion is a completion, not a refusal.
							</P>
							<P>
								Just as designed is the silence. Sound earns its place at
								confirmations and at errors, the moments a user must not miss,
								and nowhere else. Nothing on hover. Nothing on keystrokes.
								Anything that fires ten times a second belongs to the pointer,
								not the ear.
							</P>
						</Col>
					</section>

					<section id="data" style={SECTION}>
						<Col>
							<H2>The sound design is data</H2>
							<P>
								There isn&apos;t an audio file in this library. A sound is a
								spec: a handful of numbers naming tones and noise bursts,
								where they start, how they glide, how loud they peak. Pure
								functions produce the specs; a small interpreter schedules
								them onto Web Audio nodes. The drawings in the playground
								aren&apos;t illustrations of the sounds. They are renderings
								of the same data the engine plays.
							</P>
							<Code html={highlighted.spec} />
							<P>
								Data has properties, and properties can be held to. The test
								suite runs the whole sound design in Node, no AudioContext
								anywhere: every sound ends inside 180 milliseconds, every
								mirrored pair actually reverses, the tap stays true
								percussion, deny stays low and soft. The design cannot drift
								without a test going red.
							</P>
							<Code html={highlighted.usage} />
						</Col>
					</section>

					<section id="voice" style={SECTION}>
						<Col>
							<H2>A voice from a seed</H2>
							<P>
								Our avatars engine turns any seed into a gradient no other
								seed produces. The same move works on sound.{" "}
								<C>setVoice(seed)</C> hashes any string or number into a
								voice: a register a few semitones up or down, a timbre, a
								brightness for the percussion, a pace. The whole set
								re-renders in it. A product can own its sound the way it owns
								a color, and two products built on this library will not
								sound like each other.
							</P>
							<P>
								A voice changes how the sounds speak, never what they say.
								The property tests sample a hundred seeded voices and hold
								every invariant against each one: pairs still mirror, the tap
								is still percussion, deny still sits low, nothing runs long.
							</P>
						</Col>
					</section>

					<section id="synthesis" style={SECTION}>
						<Col>
							<H2>One instrument, struck fifteen ways</H2>
							<P>
								Every sound here is the same physical event: a strike. A
								strike has two parts. The contact is a few milliseconds of
								filtered noise, the touch itself. The body is a two-operator
								FM tone at a slightly inharmonic ratio, 2.76, the wood and
								marimba family; integer ratios ring like organs, this rings
								like an object. The modulation index decays across each
								strike, so the brightness dies the way a struck
								object&apos;s does. Direction lives in where and how the
								material is hit, never in a melody. A UI sound that sings
								reads as a jingle.
							</P>
							<Code html={highlighted.envelope} />
							<P>
								Envelopes ramp exponentially down to 0.001 and never to zero;
								an exponential cannot reach zero, and a ramp that tries clicks
								audibly at the end. One AudioContext serves the whole app,
								created lazily inside the first user gesture so autoplay
								policy stays satisfied, resumed when the browser suspends it.
								Every node disconnects itself when its sound ends.
							</P>
						</Col>
					</section>

					<section id="restraint" style={SECTION}>
						<Col>
							<H2>Quiet by default</H2>
							<P>
								The master volume defaults to 0.3. One call disables
								everything, the preference persists in <C>localStorage</C>,
								and anyone who asks the OS for reduced motion gets silence
								without asking twice. Failure informs rather than punishes:
								deny is a dead strike, low and dull, not a buzzer. The user
								already knows something went wrong. The sound only has to say
								it, quietly.
							</P>
							<div className="h-14" />
						</Col>
					</section>
				</main>
			</div>

			{/* Footer — the sign-off, glass exact. */}
			<div
				aria-hidden="true"
				className="mx-auto mt-16 h-px w-10 bg-[rgba(0,0,0,0.12)]"
			/>
			<footer className="px-6 pb-8 pt-16 text-center">
				<div className="inline-flex flex-col items-center gap-6">
					<div className="flex flex-col items-center gap-2">
						<p className="text-sm font-[450] leading-[1.3] tracking-[-0.1px] text-(--ink)">
							By Outpace Studios
						</p>
						<p className="text-sm leading-[1.45] tracking-[0.1px] text-(--body)">
							Brands, interfaces, and motion for
							<br />
							venture-backed companies
						</p>
					</div>
					<div className="flex gap-4 text-sm">
						<a
							href="https://outpacestudios.com"
							target="_blank"
							rel="noopener noreferrer"
							className="text-(--ink) underline underline-offset-2"
						>
							Website
						</a>
						<a
							href="https://x.com/outpacestudios"
							target="_blank"
							rel="noopener noreferrer"
							className="text-(--ink) underline underline-offset-2"
						>
							X / Twitter
						</a>
					</div>
				</div>
			</footer>
		</div>
	);
}
