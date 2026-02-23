"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useConfigurationQuery } from "@/lib/services/configuration";
import { RegisterSSO } from "./single-sign-on";
import { Switch } from "@/components/ui/switch";
import { Select, SelectItem } from "@/components/ui/select";
import { RoleComboBox } from "../roles/role-combobox";
import { TConfigurationEntry } from "@/lib/data/configuration";
import { Input } from "@/components/ui/input";
import { GenericSelect } from "@/components/shared/GenericSelect";
import React from "react";

export function ConfigurationPage() {
  const { data } = useConfigurationQuery();

  const isLoading = false;

  if (isLoading) {
    return <Skeleton className="w-full h-full" />;
  }

  const handleSave = (key: string, newValue: any) => {
    // Cross-field validation logic
    if (key === "visibleHoursStart") {
      const end = data?.find((c) => c.key === "visibleHoursEnd")?.value;
      if (newValue >= (end as number)) {
        return console.error("Start hour must be before end hour");
      }
    }

    //updateMutation.mutate({ key, value: newValue });
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 overflow-auto bg-background p-4">
        {/* The Container is the Grid */}
        <div className="grid grid-cols-[min-content_1fr] items-center gap-y-0 ">
          {data?.map((entry) => (
            // We use React.Fragment or just flat divs because
            // the children of the grid must be the columns themselves.
            <React.Fragment key={entry.key}>
              {/* Left Column: Label & Description */}
              <div className="min-h-[70px] border-b flex flex-col justify-center min-w-max pr-4 ">
                <label className="text-sm font-semibold uppercase tracking-wider whitespace-nowrap">
                  {entry.key.replace(/([A-Z])/g, " $1")}
                </label>
                {entry.description && (
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">{entry.description}</p>
                )}
              </div>

              {/* Right Column: Controls */}
              <div className="min-h-[70px] border-b flex items-center ">
                <ConfigField entry={entry} onChange={(val) => handleSave(entry.key, val)} />
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

const ConfigField = ({ entry, onChange }: { entry: TConfigurationEntry; onChange: (val: any) => void }) => {
  // 1. Check if we have a special component for this key
  const Override = CONFIG_OVERRIDES[entry.key];
  if (Override) return <Override entry={entry} onChange={onChange} />;

  // 2. Fallback to standard types
  switch (entry.type) {
    case "boolean":
      return <Switch checked={entry.value as boolean} onCheckedChange={onChange} />;
    case "number":
      return <Input type="number" value={entry.value as number} onChange={(e) => onChange(Number(e.target.value))} />;
    default:
      return <Input type="text" value={entry.value as string} onChange={(e) => onChange(e.target.value)} />;
  }
};

const CONFIG_OVERRIDES: Record<string, React.FC<{ entry: TConfigurationEntry; onChange: (val: any) => void }>> = {
  // SSO requires a custom button action instead of a simple toggle
  singleSignOnEnabled: ({ entry, onChange }) => {
    return (
      <div className="flex items-center gap-4">
        <Switch checked={entry.value as boolean} disabled />
        <RegisterSSO isDisabled={entry.value as boolean} />
      </div>
    );
  },

  // interval requires a specific set of numbers
  timeSlotIntervalMinutes: ({ entry, onChange }) => (
    <GenericSelect
      list={[
        { key: 5, label: "5 minutes" },
        { key: 10, label: "10 minutes" },
        { key: 15, label: "15 minutes" },
        { key: 20, label: "20 minutes" },
        { key: 30, label: "30 minutes" },
        { key: 60, label: "60 minutes" },
      ]}
      selectedValue={entry.value.toString()}
      isLoading={false}
      onChange={function (value: string): void {
        throw new Error("Function not implemented.");
      }}
      getId={(item) => item.key.toString()}
      getLabel={(item) => item.label}
    />
  ),

  // defaultUserRole needs a fetch/list (Example assuming you have a roles list)
  defaultUserRole: ({ entry, onChange }) => {
    return (
      <RoleComboBox
        selectedRoleId={String(entry.value)}
        onRoleChange={function (id: string, label: string): void {
          throw new Error("Function not implemented.");
        }}
        className={""}
      ></RoleComboBox>
    );
  },
};
