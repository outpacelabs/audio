import { GeistMono } from "geist/font/mono";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter (variable) — continuous weights so 450/550 render exactly, same
// face the outpacelabs sites use.
const inter = Inter({
	subsets: ["latin"],
	display: "swap",
	variable: "--font-display",
});

const TITLE = "Audio | Interface sounds with a sense of direction";
const DESCRIPTION =
	"Tiny procedural UI sounds, synthesized at runtime from pure data specs. Mirrored pairs whose pitch direction agrees with the semantic one: up and down, on and off, in and out, confirm and deny. Free and open source by Outpace Studios.";

export const metadata: Metadata = {
	title: TITLE,
	description: DESCRIPTION,
	applicationName: "@outpacelabs/audio",
	authors: [{ name: "Outpace Studios", url: "https://outpacestudios.com" }],
	creator: "Outpace Studios",
	publisher: "Outpace Studios",
	keywords: [
		"ui sounds",
		"interface sounds",
		"sound design",
		"web audio",
		"procedural audio",
		"audio feedback",
		"sound effects",
	],
	formatDetection: { email: false, address: false, telephone: false },
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	themeColor: "#ffffff",
};

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" className={`${inter.variable} ${GeistMono.variable}`}>
			<body>{children}</body>
		</html>
	);
}
