import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { z } from "zod/v4";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import { Session } from "@/lib/auth-client";

import { FormStatus } from "./types";
import { step1Schema } from "./room-drawer-schema.validator";

import { StatusSelect } from "../status/status-select";

import { RoomCategorySelect } from "../rooms/room-category-select";

import { COLOR_OPTIONS, TColors } from "@/lib/types";

import { RoomIconComboBox } from "./room-icon-combobox";
import { RoleMultiSelect } from "../roles/role-multiselect";
import { RoomPropertyMultiSelect } from "../rooms/room-property-multiselect";
import { RoomColorSelect } from "./room-color-select";
import { BadgeColored } from "@/components/ui/badge-colored";
import { method } from "lodash";
import { cn } from "@/lib/utils";
import { EventCard } from "../calendar/components/calendar-scroll-private-event-block";
import { addHours, format } from "date-fns";

export const Step01Room = ({ formStatus, session }: { formStatus: FormStatus; session: Session | null }) => {
  const { control, getValues, setValue, watch, trigger } = useFormContext<z.infer<typeof step1Schema>>();

  const isReadOnly = formStatus === "Read" || formStatus === "Loading";

  const currentColor = watch("color");

  return (
    <ScrollArea type="always">
      <div className="max-h-[calc(80dvh)] w-full">
        <div className="grid grid-cols-4 gap-4">
          <FormField
            control={control}
            name="name"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-2 row-1">
                {fieldState.invalid ? (
                  <FormMessage className="leading-none font-medium" />
                ) : (
                  <FormLabel>Room Name</FormLabel>
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
            name="roomCategoryId"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-1 row-2">
                {fieldState.invalid ? (
                  <FormMessage className="leading-none font-medium overflow-ellipsis text-nowrap" />
                ) : (
                  <FormLabel htmlFor={undefined}>Categories</FormLabel>
                )}
                <RoomCategorySelect
                  selectedUserId={field.value}
                  onCategoryChange={(value: string) => field.onChange(value)}
                  dataInvalid={fieldState.invalid}
                  isDisabled={isReadOnly}
                  className="min-w-0 w-full"
                ></RoomCategorySelect>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="publicFacing"
            render={({ field, fieldState }) => (
              <FormItem className="row-2 col-span-1 xs:justify-items-center">
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
                      <TabsTrigger value="true" disabled={isReadOnly}>
                        Show
                      </TabsTrigger>
                      <TabsTrigger value="false" disabled={isReadOnly}>
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
            name="icon"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-1 row-3">
                {fieldState.invalid ? (
                  <FormMessage className="leading-none font-medium overflow-ellipsis text-nowrap" />
                ) : (
                  <FormLabel htmlFor={undefined}>Icon</FormLabel>
                )}
                <RoomIconComboBox
                  selectedValue={field.value}
                  onSelect={(id: string, label: string) => field.onChange(id)}
                  dataInvalid={fieldState.invalid}
                  isDisabled={isReadOnly}
                  className="min-w-0 w-full"
                ></RoomIconComboBox>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="color"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-1 row-3">
                {fieldState.invalid ? (
                  <FormMessage className="leading-none font-medium overflow-ellipsis text-nowrap" />
                ) : (
                  <FormLabel>Color</FormLabel>
                )}

                <RoomColorSelect
                  selectedColorId={field.value}
                  includeAllOption={false}
                  onColorChange={field.onChange}
                  isDisabled={isReadOnly}
                  dataInvalid={fieldState.invalid}
                  className="min-w-0 w-full"
                />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="roomProperty"
            render={({ field }) => (
              <FormItem className="col-span-3 row-4">
                <FormLabel>Properties</FormLabel>
                <FormControl>
                  <RoomPropertyMultiSelect
                    selectedPropertyIds={field.value}
                    onPropertyChange={field.onChange}
                    isDisabled={isReadOnly}
                    className="min-w-0 w-full"
                  ></RoomPropertyMultiSelect>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="roomRoles"
            render={({ field }) => (
              <FormItem className="col-span-3 row-5">
                <FormLabel>Room Booking Access</FormLabel>
                <FormControl>
                  <RoleMultiSelect
                    selectedRoleIds={field.value}
                    onRolesChange={field.onChange}
                    isDisabled={isReadOnly}
                    className="min-w-0 w-full"
                  ></RoleMultiSelect>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="displayOrder"
            render={({ field }) => (
              <FormItem className="col-3 row-1">
                <FormLabel>Display Order</FormLabel>
                <FormControl>
                  <Input type="number" value={field.value && String(field.value)} onChange={field.onChange}></Input>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {currentColor && (
            <div className="row-start-1 row-span-5 col-start-4 mt-5.5 " aria-hidden="true" tabIndex={-1}>
              <EventBlockPreview color={currentColor as TColors} />
            </div>
          )}
        </div>

        <div className="grid col-span-2 gap-2 grid-rows-3"></div>
      </div>
      <ScrollBar orientation="vertical" forceMount></ScrollBar>
    </ScrollArea>
  );
};

function EventBlockPreview({ color }: { color: TColors }) {
  const EventCardClasses = EventCard({ color });
  const startDate = new Date();
  const endDate = addHours(startDate, 1);
  return (
    <div tabIndex={-1} className={cn("w-full h-full", EventCardClasses)} aria-label={"Example Room Event"}>
      <div className="flex items-center gap-1.5 ">
        <p className="truncate font-semibold">{"Example Room Event"}</p>
      </div>
      <div className="flex items-center gap-1.5 truncate">
        <p className="truncate">
          {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
        </p>
      </div>
    </div>
  );
}
