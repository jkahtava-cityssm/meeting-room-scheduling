import { loadEnvConfig } from '@next/env';
import { ClientSecretCredential } from '@azure/identity';
import { Client, GraphError } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';

loadEnvConfig(process.cwd());

export async function sendTestEmail(recipientEmail: string, senderEmail: string) {
  const credential = new ClientSecretCredential(
    process.env.AZURE_AD_TENANT_ID!,
    process.env.AZURE_AD_CLIENT_ID!,
    process.env.AZURE_AD_CLIENT_SECRET!,
  );

  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ['https://graph.microsoft.com/.default'],
  });

  const graphClient = Client.initWithMiddleware({ authProvider });

  const mailPayload = {
    message: {
      subject: 'Intranet Worker Test Email',
      body: {
        contentType: 'HTML',
        content: `
          <h1>Test Successful!</h1>
          <p>This email was sent by the background worker at <b>${new Date().toLocaleString()}</b>.</p>
          <p>Environment: <code>${process.env.NEXT_PUBLIC_ENVIRONMENT}</code></p>
        `,
      },
      toRecipients: [
        {
          emailAddress: {
            address: recipientEmail,
          },
        },
      ],
    },
    saveToSentItems: 'true',
  };

  try {
    console.log(`Attempting to send email to ${recipientEmail}...`);

    // Send email
    await graphClient.api(`/users/${senderEmail}/sendMail`).post(mailPayload);

    console.log('Email sent successfully!');
  } catch (error: unknown) {
    const err = error as GraphError;

    console.error('Failed to send email:', err.body?.error?.message || err.message || 'Unknown Error');
  }
}
