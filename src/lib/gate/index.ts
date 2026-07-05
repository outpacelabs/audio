// Vendored from @outpacelabs/gate (github.com/outpacelabs/gate, client/src).
// Local copy so this app builds on Vercel with no private dep. Change the API
// in the canonical repo first, then re-sync these files.
export { GATE_COOKIE, type GateSession, verifyToken } from "./token";
export { createGateMiddleware, type GateMiddlewareConfig } from "./middleware";
export { createGateRoute, type GateRouteConfig } from "./route";
export { GateForm, type GateFormProps } from "./GateForm";
