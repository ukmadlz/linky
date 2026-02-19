import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
	return (
		<div className="flex min-h-64 items-center justify-center">
			<Loader2 className="h-6 w-6 animate-spin text-slate-400" />
		</div>
	);
}
