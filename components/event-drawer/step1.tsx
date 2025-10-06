import { useFormContext } from "react-hook-form";
import { Input } from "../ui/input";
import { z } from "zod/v4";
import { useMultiStepForm } from "./multi-step-form";
import { step1Schema } from "./event-drawer.validator";

import { TColors } from "@/lib/types";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { BookKey } from "lucide-react";

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "../ui/form";
import { IconColored } from "../ui/icon-colored";
import { ScrollBar } from "../ui/scroll-area";
import { SingleDayPicker } from "../ui/single-day-picker";
import { Textarea } from "../ui/textarea";
import { useRoomsQuery } from "@/services/rooms";
import { TimePicker } from "../ui/time-picker";
import { Select } from "../ui/select";

import { combineDateTime } from "@/lib/helpers";
import { formatDuration, intervalToDuration } from "date-fns";
import { ComboBox, ComboBoxTrigger } from "../ui/combobox";
import { FormStatus } from "./types";
import { useUsersQuery } from "@/services/users";

export const Step1 = ({ status }: { status: FormStatus }) => {
  const {
    control,
    getValues,
    setValue,
    trigger,
    setError,
    formState: { errors },
    watch,
    reset,
  } = useFormContext<z.infer<typeof step1Schema>>();

  /*useEffect(() => {
    reset({
      ...defaultValues,
    });
  }, []);*/

  /*const members = [
    { key: "1", label: "Option 1", value: "1" },
    { key: "2", label: "Option 2", value: "2" },
    { key: "3", label: "Option 2", value: "3" },
    { key: "4", label: "Option 2", value: "4" },
    { key: "5", label: "Option 2", value: "5" },
    { key: "6", label: "Option 2", value: "6" },
    { key: "7", label: "Option 2", value: "7" },
    { key: "8", label: "Option 2", value: "8" },
    { key: "9", label: "Option 2", value: "9" },
    { key: "10", label: "Option 2", value: "10" },
    { key: "11", label: "Option 2", value: "11" },
    { key: "12", label: "Option 2", value: "12" },
    { key: "13", label: "Option 2", value: "13" },
    { key: "14", label: "Option 2", value: "14" },
    { key: "15", label: "Option 2", value: "15" },
  ];*/

  const { setIgnoreLastStep, userId } = useMultiStepForm();

  const { data: rooms } = useRoomsQuery(false);
  const { data: users } = useUsersQuery();

  const userList = users
    ? users.map((user) => {
        return { key: String(user.userId), label: user.name, value: String(user.userId) };
      })
    : [];

  const isReadOnly = status === "Read" || status === "Loading";
  const isRecurring = watch("isRecurring");

  return (
    <ScrollArea type="always">
      <div className="max-h-[calc(80dvh)] w-full">
        <div className="grid grid-cols-4 gap-4">
          <FormField
            control={control}
            name="roomId"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-1">
                {fieldState.invalid ? (
                  <FormMessage className="leading-none font-medium overflow-ellipsis text-nowrap" />
                ) : (
                  <FormLabel htmlFor="roomId">Room</FormLabel>
                )}
                <Select
                  disabled={isReadOnly}
                  //readonly={isReadOnly}
                  //{...field}
                  name={field.name}
                  value={field.value}
                  //defaultValue={field.value}
                  key={field.value}
                  onValueChange={(value: string) => {
                    if (value === "") {
                      //There is a Bug with the Select Field when used with React Hook Form:
                      //https://github.com/radix-ui/primitives/issues/2944
                      //https://github.com/radix-ui/primitives/issues/3135
                      //We can also prevent this behaviour by forcing a re-render if we add the property key={field.value}
                      //return;
                    }
                    field.onChange(value);
                  }}
                >
                  <FormControl>
                    <SelectTrigger id={field.name} data-invalid={fieldState.invalid} className="min-w-52">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="min-w-52">
                    {rooms?.map((room) => {
                      return (
                        <SelectItem key={room.roomId} value={room.roomId?.toString()} className="flex-1">
                          <div className="flex items-center gap-2">
                            <IconColored color={room.color as TColors} showBorder={false} hideBackground={true}>
                              <BookKey />
                            </IconColored>

                            <p className="truncate">{room.name}</p>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="isRecurring"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-1 xs:justify-items-center">
                {fieldState.invalid ? (
                  <FormMessage className="leading-none font-medium overflow-ellipsis text-nowrap" />
                ) : (
                  <FormLabel htmlFor="isRecurring">Event Type</FormLabel>
                )}
                <FormControl>
                  <Tabs
                    defaultValue={field.value}
                    onValueChange={(value) => {
                      const startDate = getValues("startDateText");
                      const endDate = getValues("endDateText");

                      if (value === "true" && startDate !== endDate) {
                        setValue("endDateText", getValues("startDateText"));
                        setValue(
                          "duration",
                          getDurationText(
                            ...getValues(["startDateText", "startTimeText", "endDateText", "endTimeText"])
                          )
                        );
                      }
                      field.onChange(value);

                      setIgnoreLastStep(value === "false" ? true : false);
                    }}
                  >
                    <TabsList
                      className="gap-2"
                      aria-disabled={isReadOnly}
                      data-invalid={fieldState.invalid}
                      aria-invalid={fieldState.invalid}
                    >
                      <TabsTrigger value="false" disabled={isReadOnly}>
                        Single
                      </TabsTrigger>
                      <TabsTrigger value="true" disabled={isReadOnly}>
                        Recurring
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="userId"
            render={({ field, fieldState }) => (
              <FormItem className="flex flex-col">
                {fieldState.invalid ? (
                  <FormMessage className="leading-none font-medium overflow-ellipsis text-nowrap" />
                ) : (
                  <FormLabel htmlFor="userId">Requesting User</FormLabel>
                )}

                <ComboBox
                  value={field.value}
                  list={userList}
                  noResultText={"No User Found"}
                  searchText={"Search User"}
                  onSelect={(value: string, key: string) => field.onChange(value)}
                >
                  <FormControl>
                    <ComboBoxTrigger
                      disabled={isReadOnly || userId ? true : false}
                      value={field.value}
                      list={userList}
                      placeholderText={"Select Member"}
                    ></ComboBoxTrigger>
                  </FormControl>
                </ComboBox>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="title"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-2 row-2">
                {fieldState.invalid ? (
                  <FormMessage className="leading-none font-medium" />
                ) : (
                  <FormLabel htmlFor="title">Title</FormLabel>
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
            name="startDateText"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-1 row-3">
                <div className="flex gap-2  justify-items-center">
                  {fieldState.invalid ? (
                    <FormMessage className="leading-none font-medium" />
                  ) : (
                    <FormLabel htmlFor="startDateText">Start Date</FormLabel>
                  )}
                </div>

                <FormControl>
                  <SingleDayPicker
                    id="startDateText"
                    disabled={isReadOnly}
                    value={field.value ? new Date(field.value) : new Date()}
                    onSelect={(date) => {
                      if (isRecurring === "true") {
                        setValue("endDateText", date ? date.toISOString() : "");
                      }

                      field.onChange(date ? date.toISOString() : "");

                      trigger(["endDateText", "endTimeText", "startTimeText"]);
                      setValue(
                        "duration",
                        getDurationText(...getValues(["startDateText", "startTimeText", "endDateText", "endTimeText"]))
                      );
                      setValue(
                        "startDate",
                        combineDateTime(date ? date : new Date(), new Date(getValues("startTimeText")))
                      );
                    }}
                    placeholder="Select a date"
                    data-invalid={fieldState.invalid}
                    className="min-w-52"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="startTimeText"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-1 row-3">
                <FormControl>
                  <TimePicker
                    id="startTimeText"
                    disabled={isReadOnly}
                    date={field.value ? new Date(field.value) : new Date()}
                    setDate={(date) => {
                      field.onChange(date ? date.toISOString() : "");
                      trigger(["startDateText", "endDateText", "endTimeText"]);
                      setValue(
                        "duration",
                        getDurationText(...getValues(["startDateText", "startTimeText", "endDateText", "endTimeText"]))
                      );
                      setValue(
                        "startDate",
                        combineDateTime(new Date(getValues("startDateText")), date ? date : new Date())
                      );
                    }}
                    data-invalid={fieldState.invalid}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          {isRecurring === "false" && (
            <FormField
              control={control}
              name="endDateText"
              render={({ field, fieldState }) => (
                <FormItem className="col-span-1 row-4">
                  <div className="flex gap-2">
                    {fieldState.invalid ? (
                      <FormMessage className="leading-none font-medium" />
                    ) : (
                      <FormLabel htmlFor="endDateText">End Date</FormLabel>
                    )}
                  </div>

                  <FormControl>
                    <SingleDayPicker
                      id="endDateText"
                      disabled={isReadOnly}
                      value={field.value ? new Date(field.value) : new Date()}
                      onSelect={(date) => {
                        if (isRecurring !== "false") {
                          setValue("startDateText", date ? date.toISOString() : "");
                        }
                        field.onChange(date ? date.toISOString() : "");

                        trigger(["startDateText", "endTimeText", "startTimeText"]);
                        setValue(
                          "duration",
                          getDurationText(
                            ...getValues(["startDateText", "startTimeText", "endDateText", "endTimeText"])
                          )
                        );
                        setValue(
                          "endDate",
                          combineDateTime(date ? date : new Date(), new Date(getValues("endTimeText")))
                        );
                      }}
                      placeholder="Select a date"
                      data-invalid={fieldState.invalid}
                      className="min-w-52"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          )}
          <FormField
            control={control}
            name="endTimeText"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-1 col-start-2 row-4">
                <FormControl>
                  <TimePicker
                    id="endTimeText"
                    disabled={isReadOnly}
                    date={field.value ? new Date(field.value) : new Date()}
                    setDate={(date) => {
                      field.onChange(date ? date.toISOString() : "");

                      trigger(["startDateText", "endDateText", "startTimeText"]);
                      setValue(
                        "duration",
                        getDurationText(...getValues(["startDateText", "startTimeText", "endDateText", "endTimeText"]))
                      );
                      setValue(
                        "endDate",
                        combineDateTime(new Date(getValues("endDateText")), date ? date : new Date())
                      );
                    }}
                    data-invalid={fieldState.invalid}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="duration"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-2  row-5">
                {fieldState.invalid ? (
                  <FormMessage className="leading-none font-medium" />
                ) : (
                  <FormLabel htmlFor="duration">Duration:</FormLabel>
                )}
                <FormControl>
                  <Input
                    id="duration"
                    disabled={isReadOnly}
                    className="text-sm h-9 px-3 py-1 content-center"
                    //defaultValue={field.value}
                    value={field.value}
                    data-invalid={fieldState.invalid}
                    readOnly
                  ></Input>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="description"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-4 row-span-3 ">
                <div className="flex gap-2">
                  {fieldState.invalid ? (
                    <FormMessage className="leading-none font-medium" />
                  ) : (
                    <FormLabel>Description</FormLabel>
                  )}
                </div>

                <FormControl>
                  <Textarea
                    className="max-h-70 min-h-70 resize-none"
                    id="description"
                    disabled={isReadOnly}
                    {...field}
                    value={field.value}
                    data-invalid={fieldState.invalid}
                  ></Textarea>
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <div className="grid col-span-2 gap-2 grid-rows-3"></div>
      </div>
      <ScrollBar orientation="vertical" forceMount></ScrollBar>
    </ScrollArea>
  );
};

export const getDurationText = (startDate: string, startTime: string, endDate: string, endTime: string): string => {
  const startDateTime = combineDateTime(new Date(startDate), new Date(startTime));
  const endDateTime = combineDateTime(new Date(endDate), new Date(endTime));

  const duration = formatDuration(intervalToDuration({ start: startDateTime, end: endDateTime }), {
    format: ["years", "months", "days", "hours", "minutes"],
    delimiter: ", ",
  });

  return duration.length === 0 ? "0 Minutes" : duration;
};

/*<div className="flex flex-col gap-3">
      
        /*<div>
        <Input {...register("email")} placeholder="Email" />
        <Input {...register("firstName")} placeholder="First Name" />
        <Input {...register("lastName")} placeholder="Last Name" />
      </div>
      <NextButton onClick={handleStepSubmit} />
    </div>*/
