import { PermissionGrid } from "@/app/features/permissions/permission-grid";
import * as React from "react";

export default function PermissionsPage() {
  return (
    <div className="overflow-hidden rounded-xl border min-w-92">
      <PermissionGrid yesLabel="YES" noLabel="NO" tooltipForDenied="Ask an admin to grant access" />
    </div>
  );
}
