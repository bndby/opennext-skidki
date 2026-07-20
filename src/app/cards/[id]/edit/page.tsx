import { EditCardPage } from "@/components/cards/edit-card-page";

export const dynamic = "force-static";
export const dynamicParams = true;

export function generateStaticParams() {
	return [];
}

export default function Page() {
	return <EditCardPage />;
}
