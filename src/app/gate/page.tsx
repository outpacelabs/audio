import { GateForm } from "@/lib/gate";

export const metadata = { robots: { index: false, follow: false } };

export default async function GatePage({
	searchParams,
}: {
	searchParams: Promise<{ next?: string }>;
}) {
	const { next } = await searchParams;
	return <GateForm next={next ?? "/"} />;
}
