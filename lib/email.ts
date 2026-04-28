'use server';

import { ClientSecretCredential } from '@azure/identity';
import { Client, GraphError } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { TStatusKey } from './types';

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
      subject: `Booking ${'APPROVED'}`,
      body: {
        contentType: 'HTML',
        content: bookingHTMLTemplate('APPROVED', 'Test Event', 'John Doe', new Date().toLocaleString()),
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

const statusColors = {
  APPROVED: '#22c55e', // Green
  REJECTED: '#ef4444', // Red
  INFORMATION: '#f59e0b', // Amber
  PENDING: '#3b82f6', // Blue
};

function bookingHTMLTemplate(status: TStatusKey, eventTitle: string, employeeName: string, date: string) {
  const color = statusColors[status];

  return `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #ddd;">
          <div style="background-color: ${color}; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Booking ${status}</h1>
          </div>
          <div style="padding: 20px; color: #333; line-height: 1.6;">
            <p><strong>Event:</strong> ${eventTitle}</p>
            <p><strong>Employee:</strong> ${employeeName}</p>
            <p><strong>Date:</strong> ${date}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p>This is an automated message from the Booking System.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
