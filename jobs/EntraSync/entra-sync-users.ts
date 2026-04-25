import { prisma } from '@/prisma';
import { ClientSecretCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';

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

  try {
    // Collect External Users
    // Filter and create lookups to determinw which users need to be created, updated, or deactivated.
    const activeUuids = active_users.map((u) => u.uuid).filter((id): id is string => !!id);
    const activeEmails = active_users.map((u) => u.email).filter((e): e is string => !!e);

    // Deactate users that have UUID's but nolonger exist in the active user list.

    await prisma.user.updateMany({
      where: {
        uuid: { notIn: activeUuids, not: null },
        isActive: true,
      },
      data: { isActive: false, updatedBy: 0 },
    });

    // Collect Internal Users
    // Fetch everyone with matches
    const existingUsers = await prisma.user.findMany({
      where: {
        OR: [{ uuid: { in: activeUuids } }, { email: { in: activeEmails } }],
      },
    });

    // Filter and create lookups
    const userByUuid = new Map(existingUsers.filter((u) => u.uuid).map((u) => [u.uuid, u]));
    const userByEmail = new Map(existingUsers.map((u) => [u.email, u]));

    for (const graphUser of active_users) {
      const userRecord = userByUuid.get(graphUser.uuid) || userByEmail.get(graphUser.email);

      const userData = {
        name: graphUser.name,
        email: graphUser.email,
        uuid: graphUser.uuid,
        isActive: true,
        isManaged: true,
        emailEnabled: true,
      };

      if (userRecord) {
        await prisma.user.update({
          where: { id: userRecord.id },
          data: { ...userData, updatedBy: 0 },
        });
      } else {
        await prisma.user.create({
          data: {
            ...userData,
            image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
            createdBy: 0,
            updatedBy: 0,
          },
        });
      }
    }

    console.log(`Successfully synced ${active_users.length} active users.`);
    return { count: active_users.length };
  } catch (error) {
    console.error('Database sync failed:', error);
    throw error;
  }
}
