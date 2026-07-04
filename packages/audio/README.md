<h1 align="center">@outpacelabs/audio</h1>

<p align="center">
  Interface sounds with a sense of direction.
</p>

---

Fifteen tiny sounds, all under 180ms, synthesized at runtime from pure
data specs. No audio files, no network. Every sound is a strike of the
same instrument: a noise contact plus a struck FM body at a slightly
inharmonic ratio, so the set sounds like one object being touched
different ways. The grammar is direction: mirrored pairs whose pitch and
brightness agree with the semantics. Rising opens, affirms, increases;
falling closes, dismisses, declines. Where a state asks for more than a
direction, the gesture carries the meaning: copy is a strike plus its own
echo, paste the same pair reversed, a page turn is air plus a landing.

## Install

```bash
pnpm add @outpacelabs/audio   # or: npm i / yarn add / bun add
```

Zero dependencies. `react >= 18` is an optional peer, only needed for the
`/react` entry.

## Usage

```tsx
import {
  tap, nudge, toggle, slide, turn, open, close, copy, paste, confirm, deny, remove,
} from "@outpacelabs/audio";

tap();                 // neutral percussive click
nudge("up");           // one step of an adjustment; "down" mirrors it
toggle("on");          // binary state change; "off" reverses the interval
slide("in");           // something entering the stage; "out" leaves it
turn("forward");       // a page switch: air, then a soft landing; "back" mirrors it
open();                // an overlay arriving on the z-axis; close() is its mirror
copy();                // a strike and its echo: the duplicate
paste();               // copy reversed: the ghost lands as the real thing
confirm();             // an outcome worth marking: a strike that lifts
deny();                // something didn't happen: a dead strike, no buzzer
remove();              // something destroyed on purpose: short, dry, final
```

Call them from event handlers. The shared AudioContext is created lazily on
the first play (inside the user gesture, so autoplay policy is satisfied)
and reused for the app's lifetime.

## Settings

```ts
import { setEnabled, setVolume, setRespectReducedMotion } from "@outpacelabs/audio";

setEnabled(false);              // global kill switch (persists in localStorage)
setVolume(0.5);                 // master level, default 0.3
setRespectReducedMotion(false); // sounds default to silent under
                                // prefers-reduced-motion; opt out explicitly
```

React settings UI via the `/react` entry:

```tsx
import { useAudioSettings } from "@outpacelabs/audio/react";

const { enabled, volume, setEnabled, setVolume } = useAudioSettings();
```

## A voice from a seed

Any string or number deterministically derives a voice (a register shift,
a timbre, a brightness, a pace) and the whole sound set re-renders in it.
A product can own its sound the way it owns a color; two products built on
this library will not sound like each other.

```ts
import { setVoice, voiceFor } from "@outpacelabs/audio";

setVoice("acme.com");   // every sound now speaks in acme's voice
setVoice(null);         // back to the base set

voiceFor("acme.com");   // the pure derivation, for inspection/testing
// { register: 1, wave: "sine", brightness: 0.98, pace: 0.86 }
```

A voice changes how the sounds speak, never what they say: the property
tests sample a hundred seeded voices and assert every invariant on each
one (pairs mirror, the tap stays percussion, deny stays low and soft,
nothing exceeds 180ms).

## Sounds as data

Every sound is a spec: a few numbers describing tones and noise bursts.
Pure functions produce them, a small interpreter schedules them onto Web
Audio nodes, and property tests (`test/properties.mjs`) assert the whole
design in Node without an AudioContext: everything ends within 180ms,
every pair reverses its direction, the tap stays true percussion, and
deny sits low and soft.

```ts
import { specs, duration, play } from "@outpacelabs/audio";

specs.nudge("up");
// { name: "nudge-up", layers: [{ kind: "fm", from: 500, to: 570,
//   ratio: 2.76, index: 2.5, at: 0, duration: 0.045, peak: 0.5 }] }

play(specs.confirm());       // specs are playable directly
duration(specs.confirm());   // 0.089
```

## When to play sound at all

Confirmations and errors: moments the user must not miss. Never on hover,
never on keystrokes, never on anything that fires ten times a second.

## License

[MIT](./LICENSE), free to use. By [Outpace Studios](https://outpacestudios.com).
