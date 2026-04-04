import { CombinedSchema } from '../drawer-schema.validator';

import { IUser } from '@/lib/schemas';

export const getFormDefaults = (): CombinedSchema => {
  return {
    userId: '0',
    name: '',
    email: '',
    isActive: 'true',
    isManaged: 'false',
    emailEnabled: 'true',
    department: '',
    jobTitle: '',
    externalId: '',
  } as CombinedSchema;
};

export const mapUserToSchema = (user: IUser): CombinedSchema => {
  const SEventFormDefaults = {
    userId: String(user.userId),
    name: user.name,
    email: user.email,
    isActive: String(user.isActive),
    isManaged: String(user.isManaged),
    emailEnabled: String(user.emailEnabled),
    department: user.department ? user.department : '',
    jobTitle: user.jobTitle ? user.jobTitle : '',
    externalId: user.externalId ? user.externalId : '',
  };

  return { ...SEventFormDefaults } as CombinedSchema;
};
