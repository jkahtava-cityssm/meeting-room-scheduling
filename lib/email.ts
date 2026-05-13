'use server';

import { ClientSecretCredential } from '@azure/identity';
import { Client, GraphError } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { TStatusKey } from './types';

import { Message } from '@microsoft/microsoft-graph-types';
import { getMeetingResponseEmailTemplate } from './emails/html-templates/meeting-response';
import { privateServerGET } from './fetch-server';
import { IStatus } from './schemas';

const SHARED_MAILBOX = process.env.SHARED_MAILBOX;

export async function sendTestEmail(recipientEmail: string, senderEmail: string) {
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
        content: getMeetingResponseEmailTemplate({
          status: 'APPROVED',
          title: 'Test Event',
          employeeName: 'John Doe',
          date: new Date().toLocaleString(),
          duration: '30 Minutes',
          notifiedNames: '',
          room: 'Biggings Room',
        }),
      },
      toRecipients: [
        {
          emailAddress: {
            address: SHARED_MAILBOX,
          },
        },
      ],
      ccRecipients: [
        {
          emailAddress: {
            address: senderEmail,
          },
        },
      ],
      replyTo: [
        {
          emailAddress: {
            address: senderEmail,
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

const statusColors = {
  APPROVED: '#22c55e', // Green
  REJECTED: '#ef4444', // Red
  INFORMATION: '#f59e0b', // Amber
  PENDING: '#3b82f6', // Blue
};

function bookingHTMLTemplate(status: TStatusKey, eventTitle: string, employeeName: string, date: string) {
  const color = statusColors[status];

  return `<!doctype html>
<html lang="und" dir="auto" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
  <title></title>
  <!--[if !mso]><!-->
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--<![endif]-->
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style type="text/css">
    #outlook a {
      padding: 0;
    }

    body {
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }

    table,
    td {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }

    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }

    p {
      display: block;
      margin: 13px 0;
    }
  </style>
  <!--[if mso]>
    <noscript>
    <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
    </xml>
    </noscript>
    <![endif]-->
  <!--[if lte mso 11]>
    <style type="text/css">
      .mj-outlook-group-fix { width:100% !important; }
    </style>
    <![endif]-->
  <style type="text/css">
    @media only screen and (min-width:480px) {
      .mj-column-per-100 {
        width: 100% !important;
        max-width: 100%;
      }
    }
  </style>
  <style media="screen and (min-width:480px)">
    .moz-text-html .mj-column-per-100 {
      width: 100% !important;
      max-width: 100%;
    }
  </style>
  <style type="text/css">
    .rounded-container {
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #dddddd;
    }
  </style>
</head>

<body style="word-spacing:normal;background-color:#f4f4f4;">
  <div aria-roledescription="email" role="article" lang="und" dir="auto" style="word-spacing:normal;background-color:#f4f4f4;">
    <!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" class="rounded-container-outlook" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
    <div class="rounded-container" style="margin:0px auto;max-width:600px;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
        <tbody>
          <tr>
            <td style="direction:ltr;font-size:0px;padding:0;text-align:center;">
              <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><![endif]-->
              <!-- Header Section -->
              <!--[if mso | IE]><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" bgcolor="#22c55e" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
              <div style="background:#22c55e;background-color:#22c55e;margin:0px auto;max-width:600px;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#22c55e;background-color:#22c55e;width:100%;">
                  <tbody>
                    <tr>
                      <td style="direction:ltr;font-size:0px;padding:25px 0;text-align:center;">
                        <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr></tr></table><![endif]-->
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <!--[if mso | IE]></td></tr></table></td></tr><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" bgcolor="#fafafa" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
              <div style="background:#fafafa;background-color:#fafafa;margin:0px auto;max-width:600px;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#fafafa;background-color:#fafafa;width:100%;">
                  <tbody>
                    <tr>
                      <td style="border-bottom:1px solid #eeeeee;direction:ltr;font-size:0px;padding:20px;text-align:center;">
                        <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:560px;" ><![endif]-->
                        <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                            <tbody>
                              <tr>
                                <td align="center" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <div style="font-family:Helvetica, Arial, sans-serif;font-size:20px;font-weight:bold;line-height:24px;text-align:center;color:#333333;">APPROVED</div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <!--[if mso | IE]></td></tr></table><![endif]-->
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <!--[if mso | IE]></td></tr></table></td></tr><![endif]-->
              <!-- Detail Section -->
              <!--[if mso | IE]><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" bgcolor="#ffffff" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
              <div style="background:#ffffff;background-color:#ffffff;margin:0px auto;max-width:600px;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;background-color:#ffffff;width:100%;">
                  <tbody>
                    <tr>
                      <td style="direction:ltr;font-size:0px;padding:20px;text-align:center;">
                        <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:560px;" ><![endif]-->
                        <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                            <tbody>
                              <tr>
                                <td align="left" style="font-size:0px;padding:10px 25px;padding-bottom:15px;word-break:break-word;">
                                  <div style="font-family:Helvetica, Arial, sans-serif;font-size:22px;font-weight:bold;line-height:24px;text-align:left;color:#333333;">Quarterly Strategy Meeting</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <table cellpadding="6px" cellspacing="0" width="100%" border="0" style="color:#333333;font-family:Helvetica, Arial, sans-serif;font-size:13px;line-height:22px;table-layout:auto;width:100%;border:none;">
                                    <tr style="text-align:left;">
                                      <td style="font-weight:bold;">Room</td>
                                      <td>Biggings Room</td>
                                    </tr>
                                    <tr style="text-align:left;">
                                      <td style="font-weight:bold; width: 100px;">Date</td>
                                      <td>October 24, 2026</td>
                                    </tr>
                                    <tr style="text-align:left;">
                                      <td style="font-weight:bold;">Duration</td>
                                      <td>60 Minutes</td>
                                    </tr>
                                    <tr style="text-align:left;">
                                      <td style="padding:15px"></td>
                                      <td style="padding:15px"></td>
                                    </tr>
                                    <tr style="text-align:left; padding-top:10px">
                                      <td style="font-weight:bold;">Attendees</td>
                                      <td>Marketing Team, Executive Suite</td>
                                    </tr>
                                    <tr style="text-align:left;">
                                      <td style="font-weight:bold;">Owner</td>
                                      <td>Sarah Jenkins</td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <!--[if mso | IE]></td></tr></table><![endif]-->
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <!--[if mso | IE]></td></tr></table></td></tr><![endif]-->
              <!-- Footer Section -->
              <!--[if mso | IE]><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" bgcolor="#fafafa" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
              <div style="background:#fafafa;background-color:#fafafa;margin:0px auto;max-width:600px;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#fafafa;background-color:#fafafa;width:100%;">
                  <tbody>
                    <tr>
                      <td style="border-top:1px solid #eeeeee;direction:ltr;font-size:0px;padding:20px;text-align:center;">
                        <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:560px;" ><![endif]-->
                        <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                            <tbody>
                              <tr>
                                <td align="center" class="aa-btn" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;line-height:100%;">
                                    <tbody>
                                      <tr>
                                        <td align="center" bgcolor="#18181b" role="presentation" style="border:none;border-radius:8px;cursor:auto;mso-padding-alt:12px 24px;background:#18181b;" valign="middle">
                                          <a href="https://yourwebsite.com" style="display:inline-block;background:#18181b;color:#ffffff;font-family:Helvetica, Arial, sans-serif;font-size:14px;font-weight:500;line-height:120%;margin:0;text-decoration:none;text-transform:none;padding:12px 24px;mso-padding-alt:0px;border-radius:8px;" target="_blank"> Room Booking System </a>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <!-- Footer -->
                              <tr>
                                <td align="center" style="font-size:0px;padding:10px 0 10px 0;word-break:break-word;">
                                  <p style="border-top:solid 1px #f4f4f5;font-size:1px;margin:0px auto;width:100%;">
                                  </p>
                                  <!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" style="border-top:solid 1px #f4f4f5;font-size:1px;margin:0px auto;width:560px;" role="presentation" width="560px" ><tr><td style="height:0;line-height:0;"> &nbsp;
</td></tr></table><![endif]-->
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="aa-text" style="font-size:0px;padding:0;word-break:break-word;">
                                  <div style="font-family:Helvetica, Arial, sans-serif;font-size:12px;line-height:24px;text-align:left;color:#a1a1aa;">This is an automated message. Need help? <a href="#" style="color: #18181b;">Contact Support</a></div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <!--[if mso | IE]></td></tr></table><![endif]-->
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <!--[if mso | IE]></td></tr></table></td></tr><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" bgcolor="#22c55e" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
              <div style="background:#22c55e;background-color:#22c55e;margin:0px auto;max-width:600px;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#22c55e;background-color:#22c55e;width:100%;">
                  <tbody>
                    <tr>
                      <td style="direction:ltr;font-size:0px;padding:25px 0;text-align:center;">
                        <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr></tr></table><![endif]-->
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <!--[if mso | IE]></td></tr></table></td></tr></table><![endif]-->
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!--[if mso | IE]></td></tr></table><![endif]-->
  </div>
</body>

</html>
  `;
}
