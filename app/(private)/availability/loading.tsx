import { Skeleton } from "@/components/ui/skeleton";
import { LoaderCircle } from "lucide-react";

export default function Loading() {
	// You can add any UI inside Loading, including a Skeleton.
	return (
		<>
			<div className="flex flex-col lg:flex-row gap-4 h-full min-h-0 overflow-auto ">
				{/* LEFT CONTAINER */}
				<div className="w-full flex flex-col gap-2 p-4 sm:p-0 lg:w-72 ">
					<div className="flex flex-wrap items-center justify-between py-2">
						<Skeleton className="p-4 h-full w-full flex justify-center  items-center">
							<LoaderCircle className="animate-spin" />
						</Skeleton>
					</div>
					<Skeleton className="p-4 h-full flex justify-center  items-center">
						<LoaderCircle className="animate-spin" />
					</Skeleton>
				</div>

				{/* RIGHT CONTAINER */}
				<div className="flex-1 flex flex-col min-w-0 gap-2 min-h-0 ">
					<div className="flex flex-wrap items-center justify-between py-2">
						<Skeleton className="p-4 h-full w-full flex justify-center  items-center">
							<LoaderCircle className="animate-spin" />
						</Skeleton>
					</div>
					<Skeleton className="p-4 h-full flex justify-center  items-center">
						<LoaderCircle className="animate-spin" />
					</Skeleton>
				</div>
			</div>
		</>
	);
}
