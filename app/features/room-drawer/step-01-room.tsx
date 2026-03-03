import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { z } from "zod/v4";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker, DateTimePickerRef } from "@/components/ui/datetimepicker";
import { useRef } from "react";
import { Session } from "@/lib/auth-client";
import { getDurationText } from "@/lib/helpers";
import { FormStatus } from "./types";
import { step1Schema } from "./room-drawer-schema.validator";
import { useMultiStepForm } from "./room-multi-step-form-shell";
import { RoomSelect } from "../rooms/room-select";
import { StatusSelect } from "../status/status-select";
import { UserComboBox } from "../users/user-combobox";
import { RoomCategorySelect } from "../rooms/room-category-select";
import { MultiSelect } from "@/components/ui/multi-select";
import { colorOptions } from "@/lib/types";
import DynamicIcon, { IconName } from "@/components/ui/icon-dynamic";
import { RoomIconComboBox } from "./room-icon-combobox";
import { RoleMultiSelect } from "../roles/role-multiselect";

export const Step01Room = ({ formStatus, session }: { formStatus: FormStatus; session: Session | null }) => {
  const { control, getValues, setValue, watch, trigger } = useFormContext<z.infer<typeof step1Schema>>();

  const isReadOnly = formStatus === "Read" || formStatus === "Loading";

  const colorList = colorOptions.map((color) => {
    return { value: color, label: color };
  });
  //const iconList = //IconName.map((color) => {return {value: color, label: color}})

  return (
    <ScrollArea type="always">
      <div className="max-h-[calc(80dvh)] w-full">
        <div className="grid grid-cols-4 gap-4">
          <FormField
            control={control}
            name="roomCategoryId"
            render={({ field, fieldState }) => (
              <FormItem className="flex flex-col">
                {fieldState.invalid ? (
                  <FormMessage className="leading-none font-medium overflow-ellipsis text-nowrap" />
                ) : (
                  <FormLabel htmlFor={undefined}>Requesting User</FormLabel>
                )}
                <RoomCategorySelect
                  selectedUserId={field.value}
                  onCategoryChange={(value: string) => field.onChange(value)}
                  dataInvalid={fieldState.invalid}
                  isDisabled={isReadOnly}
                ></RoomCategorySelect>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="publicFacing"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-1 xs:justify-items-center">
                {fieldState.invalid ? (
                  <FormMessage className="leading-none font-medium overflow-ellipsis text-nowrap" />
                ) : (
                  <FormLabel>Public Page Visibility</FormLabel>
                )}
                <FormControl>
                  <Tabs
                    defaultValue={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                    }}
                  >
                    <TabsList
                      className="gap-2"
                      aria-disabled={isReadOnly}
                      data-invalid={fieldState.invalid}
                      aria-invalid={fieldState.invalid}
                    >
                      <TabsTrigger value="false" disabled={isReadOnly}>
                        Show
                      </TabsTrigger>
                      <TabsTrigger value="true" disabled={isReadOnly}>
                        Hide
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="roomRoles"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Frameworks</FormLabel>
                <FormControl>
                  <RoleMultiSelect
                    selectedRoleIds={field.value}
                    onRolesChange={field.onChange}
                    isDisabled={isReadOnly}
                  ></RoleMultiSelect>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="roomProperty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Frameworks</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={frameworksList}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Choose frameworks..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="icon"
            render={({ field, fieldState }) => (
              <FormItem className="flex flex-col">
                {fieldState.invalid ? (
                  <FormMessage className="leading-none font-medium overflow-ellipsis text-nowrap" />
                ) : (
                  <FormLabel htmlFor={undefined}>Requesting User</FormLabel>
                )}
                <RoomIconComboBox
                  selectedValue={field.value}
                  onSelect={(id: string, label: string) => field.onChange(id)}
                  dataInvalid={fieldState.invalid}
                  isDisabled={isReadOnly}
                  className="min-w-60"
                ></RoomIconComboBox>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="name"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-2 row-2">
                {fieldState.invalid ? (
                  <FormMessage className="leading-none font-medium" />
                ) : (
                  <FormLabel>Title</FormLabel>
                )}
                <FormControl>
                  <Input
                    id="title"
                    disabled={isReadOnly}
                    placeholder="Enter a title"
                    data-invalid={fieldState.invalid}
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="color"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-1 row-2">
                {fieldState.invalid ? (
                  <FormMessage className="leading-none font-medium overflow-ellipsis text-nowrap" />
                ) : (
                  <FormLabel>Status</FormLabel>
                )}

                <StatusSelect
                  selectedStatusId={field.value}
                  includeAllOption={false}
                  onStatusChange={field.onChange}
                  isDisabled={isReadOnly}
                  dataInvalid={fieldState.invalid}
                />
              </FormItem>
            )}
          />
          x
        </div>
        <div className="grid col-span-2 gap-2 grid-rows-3"></div>
      </div>
      <ScrollBar orientation="vertical" forceMount></ScrollBar>
    </ScrollArea>
  );
};
