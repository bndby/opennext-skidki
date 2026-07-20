import { UseCardPage } from "@/components/cards/use-card-page";

export const dynamic = "force-static";
export const dynamicParams = true;

export function generateStaticParams() {
	return [];
}

export default function Page() {
	return <UseCardPage />;
}
