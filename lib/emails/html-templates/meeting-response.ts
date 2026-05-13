import { APP_FULL_URL } from '@/lib/api-helpers';
import { TStatusKey } from '@/lib/types';

export function getMeetingResponseEmailTemplate(content: {
  status: TStatusKey;
  title: string;
  room: string;
  date: string;
  duration: string;
  employeeName: string;
  notifiedNames: string;
}) {
  const statusColors = {
    APPROVED: '#05df72', // Green-400
    REJECTED: '#ff6467', // Red-400
    INFORMATION: '#51a2ff', // Blue-400
    PENDING: '#90a1b9', // Slate-400
  };

  const color = statusColors[content.status];

  return meetingTemplate
    .replaceAll('{{HEADER_FOOTER_COLOR}}', color)
    .replaceAll('{{EVENT_STATUS}}', content.status)
    .replaceAll('{{EVENT_TITLE}}', content.title)
    .replaceAll('{{EVENT_ROOM}}', content.room)
    .replaceAll('{{EVENT_DATE}}', content.date)
    .replaceAll('{{EVENT_DURATION}}', content.duration)
    .replaceAll('{{EVENT_TO}}', content.employeeName)
    .replaceAll('{{EVENT_CC}}', content.notifiedNames)
    .replaceAll('{{SYSTEM_URL}}', APP_FULL_URL)
    .replaceAll('{{SUPPORT_URL}}', APP_FULL_URL);
}

//THIS TEMPLATE IS GENERATED BASED ON THE mjml FILE.
//I USED https://mjml.io/try-it-live/bgLjUzXBx TO CONVERT IT.
//OTHERWISE WE COULD USE THE mjml PACKAGE AT BUILD TIME BUT IT DOESNT CHANGE MUCH.
const meetingTemplate = `<!doctype html>
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

    /* Standard CSS for the HTML table and links */
    .meeting-table td {
      padding: 6px;
    }

    .label-cell {
      font-weight: bold;
      width: 100px;
      text-align: left;
    }

    .value-cell {
      text-align: left;
    }

    .spacer-cell {
      padding: 15px !important;
    }

    .support-link {
      color: #18181b;
      text-decoration: underline;
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
              <!--[if mso | IE]><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" bgcolor="{{HEADER_FOOTER_COLOR}}" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
              <div style="background:{{HEADER_FOOTER_COLOR}};background-color:{{HEADER_FOOTER_COLOR}};margin:0px auto;max-width:600px;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:{{HEADER_FOOTER_COLOR}};background-color:{{HEADER_FOOTER_COLOR}};width:100%;">
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
                                  <div style="font-family:Helvetica, Arial, sans-serif;font-size:20px;font-weight:bold;line-height:24px;text-align:center;color:#333333;">{{EVENT_STATUS}}</div>
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
                                  <div style="font-family:Helvetica, Arial, sans-serif;font-size:22px;font-weight:bold;line-height:24px;text-align:left;color:#333333;">{{EVENT_TITLE}}</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="meeting-table" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <table cellpadding="0" cellspacing="0" width="100%" border="0" style="color:#333333;font-family:Helvetica, Arial, sans-serif;font-size:13px;line-height:22px;table-layout:auto;width:100%;border:none;">
                                    <tr>
                                      <td class="label-cell">Room</td>
                                      <td class="value-cell">{{EVENT_ROOM}}</td>
                                    </tr>
                                    <tr>
                                      <td class="label-cell">Date</td>
                                      <td class="value-cell">{{EVENT_DATE}}</td>
                                    </tr>
                                    <tr>
                                      <td class="label-cell">Duration</td>
                                      <td class="value-cell">{{EVENT_DURATION}}</td>
                                    </tr>
                                    <tr>
                                      <td class="spacer-cell"></td>
                                      <td class="spacer-cell"></td>
                                    </tr>
                                    <tr>
                                      <td class="label-cell">Attendees</td>
                                      <td class="value-cell">{{EVENT_CC}}</td>
                                    </tr>
                                    <tr>
                                      <td class="label-cell">Owner</td>
                                      <td class="value-cell">{{EVENT_TO}}</td>
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
                                <td align="center" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;line-height:100%;">
                                    <tbody>
                                      <tr>
                                        <td align="center" bgcolor="#18181b" role="presentation" style="border:none;border-radius:8px;cursor:auto;mso-padding-alt:12px 24px;background:#18181b;" valign="middle">
                                          <a href="{{SYSTEM_URL}}" style="display:inline-block;background:#18181b;color:#ffffff;font-family:Helvetica, Arial, sans-serif;font-size:14px;font-weight:500;line-height:120%;margin:0;text-decoration:none;text-transform:none;padding:12px 24px;mso-padding-alt:0px;border-radius:8px;" target="_blank"> Room Booking System </a>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="center" style="font-size:0px;padding:10px 0 10px 0;word-break:break-word;">
                                  <p style="border-top:solid 1px #f4f4f5;font-size:1px;margin:0px auto;width:100%;">
                                  </p>
                                  <!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" style="border-top:solid 1px #f4f4f5;font-size:1px;margin:0px auto;width:560px;" role="presentation" width="560px" ><tr><td style="height:0;line-height:0;"> &nbsp;
</td></tr></table><![endif]-->
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding:0;word-break:break-word;">
                                  <div style="font-family:Helvetica, Arial, sans-serif;font-size:12px;line-height:24px;text-align:left;color:#a1a1aa;">This is an automated message.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding:0;word-break:break-word;">
                                  <div style="font-family:Helvetica, Arial, sans-serif;font-size:12px;line-height:24px;text-align:left;color:#a1a1aa;">Need help? <a href="{{SUPPORT_URL}}" class="support-link">Contact Support</a></div>
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
              <!--[if mso | IE]></td></tr></table></td></tr><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" bgcolor="{{HEADER_FOOTER_COLOR}}" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
              <div style="background:{{HEADER_FOOTER_COLOR}};background-color:{{HEADER_FOOTER_COLOR}};margin:0px auto;max-width:600px;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:{{HEADER_FOOTER_COLOR}};background-color:{{HEADER_FOOTER_COLOR}};width:100%;">
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

</html>`;
