import { RegisterSSO } from "@/app/features/system-configuration/single-sign-on";

export default function ManageConfiguration() {
  return (
    <div className="overflow-hidden rounded-xl border min-w-92">
      <div className="flex flex-col items-center gap-2 m-4">
        <RegisterSSO />
      </div>
    </div>
  );
}
