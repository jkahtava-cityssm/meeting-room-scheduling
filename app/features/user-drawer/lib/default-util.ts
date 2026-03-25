import { CombinedSchema } from "../drawer-schema.validator";

import { IUser } from "@/lib/schemas";

export const getFormDefaults = (): CombinedSchema => {
  return {
    userId: "0",
    name: "",
    email: "",
    employeeActive: "true",
    isExternal: "false",
    receiveEmail: "true",
    department: "",
    jobTitle: "",
    employeeNumber: "",
  } as CombinedSchema;
};

export const mapUserToSchema = (user: IUser): CombinedSchema => {
  const SEventFormDefaults = {
    userId: String(user.userId),
    name: user.name,
    email: user.email,
    employeeActive: String(user.employeeActive),
    isExternal: String(user.isExternal),
    receiveEmail: String(user.receiveEmail),
    department: user.department ? user.department : "",
    jobTitle: user.jobTitle ? user.jobTitle : "",
    employeeNumber: user.employeeNumber ? user.employeeNumber : "",
  };

  return { ...SEventFormDefaults } as CombinedSchema;
};
