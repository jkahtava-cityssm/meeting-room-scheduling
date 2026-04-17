import { ClientSecretCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';

import * as fs from 'fs';

interface GraphLicense {
  disabledPlans: string[];
  skuId: string;
}

interface GraphUser {
  '@odata.context': string;
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
  accountEnabled: boolean;
  onPremisesSyncEnabled: boolean | null;
  onPremisesDistinguishedName: string | null;
  assignedLicenses: GraphLicense[];
}

interface MappedUser {
  uuid: string;
  name: string;
  email: string;
  enabled: boolean;
  onPremiseEnabled: boolean | null;
  departments: string[];
  other: string | null;
  totalLicenses: number;
}

export async function syncEntraUsers() {
  // Configure Credentials
  const credential = new ClientSecretCredential(
    process.env.AZURE_AD_TENANT_ID!,
    process.env.AZURE_AD_CLIENT_ID!,
    process.env.AZURE_AD_CLIENT_SECRET!,
  );

  // Initialize Client
  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ['https://graph.microsoft.com/.default'],
  });

  const graphClient = Client.initWithMiddleware({ authProvider });

  try {
    console.log('Fetching users from Microsoft Graph...');

    // Collect Users, and selected properties
    const response = await graphClient
      .api('/users')
      .select('id,displayName,mail,userPrincipalName,accountEnabled,onPremisesSyncEnabled,onPremisesDistinguishedName,assignedLicenses')
      .get();

    const graphUsers = [...response.value] as GraphUser[];
    let nextLink = response['@odata.nextLink'];

    // Find next page, only 100 users are returned at a time.
    while (nextLink) {
      const nextResponse = await graphClient.api(nextLink).get();
      graphUsers.push(...nextResponse.value);
      nextLink = nextResponse['@odata.nextLink'];
    }

    const mappedUsers = graphUsers
      .filter((user) => user.mail)
      .map((user) => {
        return {
          uuid: user.id,
          name: user.displayName,
          email: user.mail,
          enabled: user.accountEnabled,
          onPremiseEnabled: user.onPremisesSyncEnabled,
          departments:
            user.onPremisesDistinguishedName
              ?.split(',')
              .filter((part) => part.startsWith('OU='))
              .map((part) => part.split('=')[1]) || [],
          other: user.onPremisesDistinguishedName,
          totalLicenses: user.assignedLicenses.length,
        };
      });

    const active_users = mappedUsers.filter((user) => user.email && user.enabled && user.totalLicenses > 0);

    const disabled_users = mappedUsers.filter((user) => user.email && !user.enabled && user.totalLicenses === 0);

    console.log(`Successfully fetched ${graphUsers.length} users.`);
    return { count: graphUsers.length };
  } catch (error) {
    console.error('Error fetching users from Graph:', error);
    throw error;
  }
}

function exportUsersToFile(mappedUsers: MappedUser[], fileName: string) {
  const headers = ['UUID', 'Name', 'Email', 'Enabled', 'OnPremiseSync', 'Departments', 'TotalLicenses', 'DistinguishedName'];

  const rows = mappedUsers.map((user) => [
    user.uuid,
    `"${user.name}"`,
    user.email,
    user.enabled,
    user.onPremiseEnabled,
    `"${user.departments.join('; ')}"`,
    user.totalLicenses,
    `"${user.other || ''}"`,
  ]);
  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  fs.writeFileSync(fileName, csvContent);
}
