import { defineConfig } from "tsup";

export default defineConfig({
	entry: { index: "src/index.ts", react: "src/react.ts" },
	format: ["esm", "cjs"],
	dts: true,
	clean: true,
	sourcemap: true,
	treeshake: true,
	// The core is dependency-free; only the ./react entry touches React.
	external: ["react", "react-dom"],
});
