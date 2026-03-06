"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { IConfigurationPUT, useConfigurationMutationUpsert, useConfigurationQuery } from "@/lib/services/configuration";
import { RegisterSSO } from "./single-sign-on";
import { Switch } from "@/components/ui/switch";
import { Select, SelectItem } from "@/components/ui/select";
import { RoleComboBox } from "../roles/role-combobox";
import { TConfigurationEntry } from "@/lib/data/configuration";
import { Input } from "@/components/ui/input";
import { GenericSelect } from "@/components/shared/generic-select";
import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ConfigurationPage() {
  const { data: serverConfiguration } = useConfigurationQuery();
  const [workingConfiguration, setWorkingConfiguration] = useState<TConfigurationEntry[] | undefined>(undefined);
  const [isChanged, setChanged] = useState(false);
  //const [resourceActions, setResourceActions] = useState<ResourceActions | undefined>(undefined);
  const configurationMutation = useConfigurationMutationUpsert();

  useEffect(() => {
    if (serverConfiguration) {
      setWorkingConfiguration(structuredClone(serverConfiguration));
    }
  }, [serverConfiguration]);

  const handleChange = useCallback(
    (key: string, value: string) => {
      if (key === "visibleHoursStart") {
        const end = workingConfiguration?.find((c) => c.key === "visibleHoursEnd")?.value;
        if (Number(value) >= (end as number)) {
          console.error("Start hour must be before end hour");
          return;
        }
        if (Number(value) < 1) {
          console.error("Start hour must be equal to or greater than 1");
          return;
        }
      }

      if (key === "visibleHoursEnd") {
        const start = workingConfiguration?.find((c) => c.key === "visibleHoursStart")?.value;
        if (Number(value) <= (start as number)) {
          console.error("End hour must be after start hour");
          return;
        }
        if (Number(value) > 24) {
          console.error("End hour must be equal to or less than 24");
          return;
        }
      }
      setChanged(true);
      setWorkingConfiguration((prev) =>
        prev
          ? prev.map((set) => {
              if (set.key !== key) return set;

              return { ...set, value: value } as TConfigurationEntry;
            })
          : prev,
      );
    },
    [workingConfiguration],
  );

  const onSave = () => {
    if (!serverConfiguration || !workingConfiguration) return;

    const differences = getDifferences(serverConfiguration, workingConfiguration);

    configurationMutation.mutate(differences, {
      onSuccess: () => setChanged(false),
    });
  };

  const isLoading = false;

  if (isLoading) {
    return <Skeleton className="w-full h-full" />;
  }

  return (
    <div className="flex flex-col h-full w-full  rounded-xl border min-w-92">
      <div className="flex flex-col gap-4  p-4 min-w-90 lg:flex-row lg:items-center lg:justify-between shrink-0 border-b">
        <div className="flex items-center gap-3 h-14 font-bold">System Configuration</div>

        <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:justify-between">{/* ACTION AREA */}</div>
      </div>
      {/* The Container is the Grid */}
      <ScrollArea className="w-full flex-1 min-h-0 p-4" type="always">
        <div className="grid grid-cols-[min-content_1fr] items-center gap-y-0 ">
          {workingConfiguration?.map((entry) => (
            // We use React.Fragment or just flat divs because
            // the children of the grid must be the columns themselves.
            <React.Fragment key={entry.key}>
              {/* Left Column: Label & Description */}
              <div className="min-h-[70px] border-b flex flex-col justify-center min-w-max pr-4 ">
                <label className="text-sm font-semibold uppercase tracking-wider whitespace-nowrap">{entry.name}</label>
                {entry.description && (
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">{entry.description}</p>
                )}
              </div>

              {/* Right Column: Controls */}
              <div className="min-h-[70px] border-b flex items-center ">
                <ConfigField entry={entry} onChange={(val) => handleChange(entry.key, val)} />
              </div>
            </React.Fragment>
          ))}
        </div>
      </ScrollArea>

      <footer className="flex h-14 items-center border-t px-4 shrink-0">
        <div className="flex w-full items-center justify-end gap-2">
          <Button
            disabled={!isChanged}
            variant="ghost"
            onClick={() => {
              setWorkingConfiguration(serverConfiguration);
              setChanged(false);
            }}
          >
            Cancel
          </Button>
          <Button disabled={!isChanged} onClick={onSave}>
            Save Changes
          </Button>
        </div>
      </footer>
    </div>
  );
}

function setConfigField(sets: TConfigurationEntry[], key: string, newValue: boolean): TConfigurationEntry[] {
  return sets.map((set) => {
    if (set.key !== key) return set;

    return { ...set, value: newValue } as TConfigurationEntry;
  });
}

const ConfigField = ({ entry, onChange }: { entry: TConfigurationEntry; onChange: (val: string) => void }) => {
  // 1. Check if we have a special component for this key
  const Override = CONFIG_OVERRIDES[entry.key];
  if (Override) return <Override entry={entry} onChange={onChange} />;

  // 2. Fallback to standard types
  switch (entry.type) {
    case "boolean":
      return (
        <Switch
          checked={entry.value as boolean}
          onCheckedChange={(checked) => onChange(String(checked))}
          className="min-w-[200px]"
        />
      );
    case "number":
      return (
        <Input
          type="number"
          value={entry.value as number}
          onChange={(e) => onChange(e.target.value)}
          className="w-[200px]"
        />
      );
    default:
      return (
        <Input
          type="text"
          value={entry.value as string}
          onChange={(e) => onChange(e.target.value)}
          className="w-[200px]"
        />
      );
  }
};

const CONFIG_OVERRIDES: Record<string, React.FC<{ entry: TConfigurationEntry; onChange: (val: string) => void }>> = {
  // SSO requires a custom button action instead of a simple toggle
  singleSignOnEnabled: ({ entry, onChange }) => {
    return (
      <div className="flex items-center gap-4">
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
      onChange={(value) => onChange(value)}
      getId={(item) => item.key.toString()}
      getLabel={(item) => item.label}
    />
  ),

  // defaultUserRole needs a fetch/list (Example assuming you have a roles list)
  defaultUserRole: ({ entry, onChange }) => {
    return (
      <RoleComboBox
        selectedRoleId={String(entry.value)}
        onRoleChange={(id, label) => onChange(id)}
        className={""}
        isDisabled={false}
      ></RoleComboBox>
    );
  },
};

function getDifferences(
  serverConfiguration: TConfigurationEntry[],
  updatedConfiguration: TConfigurationEntry[],
): IConfigurationPUT[] {
  const updateList = [];

  for (let serverIndex = 0; serverIndex < serverConfiguration.length; serverIndex++) {
    const serverSetting = serverConfiguration[serverIndex];

    const localSetting = updatedConfiguration.find((setting) => setting.key === serverSetting.key);

    if (!localSetting) continue;

    if (localSetting.value !== serverSetting.value) {
      updateList.push({
        key: localSetting.key,
        name: localSetting.name,
        type: localSetting.type,
        value: String(localSetting.value),
        description: localSetting.description ?? "",
      });
    }
  }

  return updateList;
}
