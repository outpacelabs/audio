import { createGateRoute } from "@/lib/gate";

export const { POST } = createGateRoute({
	convexUrl: process.env.GATE_CONVEX_URL as string,
	project: "audio",
});
