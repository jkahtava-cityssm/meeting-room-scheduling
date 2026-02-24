import { PermissionGrid } from "@/app/features/permissions/permission-layout";
import * as React from "react";

export default function PermissionsPage() {
  return <PermissionGrid yesLabel="YES" noLabel="NO" tooltipForDenied="Ask an admin to grant access" />;
}
