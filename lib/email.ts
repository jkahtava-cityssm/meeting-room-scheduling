'use server';

import { ClientSecretCredential } from '@azure/identity';
import { Client, GraphError } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { TStatusKey } from './types';

import { Message } from '@microsoft/microsoft-graph-types';
import { getMeetingResponseEmailTemplate, IEmailTemplate } from './emails/html-templates/meeting-response';
import { privateServerGET } from './fetch-server';
import { IStatus } from './schemas';

const SHARED_MAILBOX = process.env.SHARED_MAILBOX;

export async function sendEmail(requestingUser: string, notifyUsers: string[], content: IEmailTemplate) {
  if (!SHARED_MAILBOX) {
    console.log('SHARED_MAILBOX Environment Variable Not Configured');
    return;
  }

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
      subject: `Booking ${'APPROVED'}`,
      body: {
        contentType: 'html',
        content: getMeetingResponseEmailTemplate(content),
      },
      toRecipients: [
        {
          emailAddress: {
            address: SHARED_MAILBOX,
          },
        },
      ],
      ccRecipients: [
        ...notifyUsers.map((email) => ({
          emailAddress: {
            address: email,
          },
        })),
      ],
      replyTo: [
        {
          emailAddress: {
            address: requestingUser,
          },
        },
      ],
    } as Message,
    saveToSentItems: 'false',
  };

  try {
    console.log(`Attempting to send email to ${SHARED_MAILBOX}...`);

    // Send email
    await graphClient.api(`/users/${SHARED_MAILBOX}/sendMail`).post(mailPayload);

    console.log('Email sent successfully!');
  } catch (error: unknown) {
    const err = error as GraphError;

    console.error('Failed to send email:', err.body?.error?.message || err.message || 'Unknown Error');
  }
}
