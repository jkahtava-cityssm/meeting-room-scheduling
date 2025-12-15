import { PermissionGrid } from "@/app/features/permissions/PermissionGrid";
import * as React from "react";

export default function PermissionsPage() {
  return (
    <div className="container mx-auto p-6">
      <PermissionGrid yesLabel="YES" noLabel="NO" tooltipForDenied="Ask an admin to grant access" />
    </div>
  );
}
