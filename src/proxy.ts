import { createGateMiddleware } from "@/lib/gate";

export const proxy = createGateMiddleware({
	secret: process.env.GATE_SECRET as string,
	project: "audio",
});

export const config = {
	matcher: [
		"/((?!gate|api/gate|_next|favicon.ico|icon.png|apple-icon.png|robots.txt|sitemap.xml).*)",
	],
};
