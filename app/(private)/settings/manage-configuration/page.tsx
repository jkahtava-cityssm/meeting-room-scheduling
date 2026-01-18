export const dynamic = "force-dynamic";

import { RegisterSSO } from "@/app/features/system-configuration/single-sign-on";
import { findManyConfiguration } from "@/lib/data/configuration";

export default async function ManageConfiguration() {
	const configEntries = await findManyConfiguration(["singleSignOnEnabled"]);
	const useSSO = configEntries.singleSignOnEnabled === "true";

	return (
		<div className="overflow-hidden rounded-xl border min-w-92">
			<div className="flex flex-col items-center gap-2 m-4">
				<RegisterSSO isDisabled={useSSO} />
			</div>
		</div>
	);
}
