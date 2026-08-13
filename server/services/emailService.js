import "dotenv/config";
import nodemailer from "nodemailer";


export async function sendIssueAlert({
  recipients,
  issue,
}) {
  const emailUser =
    process.env.EMAIL_USER;

  const emailPassword =
    process.env.EMAIL_APP_PASSWORD;


  // =========================================================
  // CHECK EMAIL CONFIG
  // =========================================================

  if (
    !emailUser ||
    !emailPassword
  ) {
    console.error(
      "Email configuration missing.",
    );

    return {
      success: false,
      sent: false,
      skipped: false,
      message:
        "EMAIL_USER or EMAIL_APP_PASSWORD is missing from server/.env",
    };
  }


  // =========================================================
  // CHECK RECIPIENTS
  // =========================================================

  if (
    !Array.isArray(recipients) ||
    recipients.length === 0
  ) {
    console.log(
      "No email recipients found.",
    );

    return {
      success: true,
      sent: false,
      skipped: true,
      message:
        "No email recipients found for this authority.",
    };
  }


  // =========================================================
  // REMOVE EMPTY / DUPLICATE EMAILS
  // =========================================================

  const cleanRecipients = [
    ...new Set(
      recipients
        .filter(Boolean)
        .map((email) =>
          String(email)
            .trim()
            .toLowerCase(),
        ),
    ),
  ];


  if (
    cleanRecipients.length === 0
  ) {
    return {
      success: true,
      sent: false,
      skipped: true,
      message:
        "No valid email recipients found.",
    };
  }


  // =========================================================
  // CREATE TRANSPORTER
  // =========================================================

  const transporter =
    nodemailer.createTransport({
      service: "gmail",

      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });


  // =========================================================
  // ISSUE INFORMATION
  // =========================================================

  const authority =
    issue.zone === "dncc-north"
      ? "DNCC North"
      : issue.zone === "dncc-south"
        ? "DNCC South"
        : "DNCC Authority";


  const location =
    issue.address ||
    `${issue.location?.latitude ?? "N/A"}, ${
      issue.location?.longitude ?? "N/A"
    }`;


  const confidence =
    issue.aiConfidence !== null &&
    issue.aiConfidence !== undefined
      ? `${issue.aiConfidence}%`
      : "N/A";


  const droneId =
    issue.droneId ||
    "N/A";


  const issueId =
    issue._id?.toString?.() ||
    issue.id ||
    "Pending";


  // =========================================================
  // SEND EMAIL
  // =========================================================

  try {
    const info =
      await transporter.sendMail({
        from:
          `"DhakAI-PAKHI Alert System" <${emailUser}>`,

        to:
          cleanRecipients.join(","),

        subject:
          `DhakAI-PAKHI Alert: ${issue.title} - ${authority}`,

        text: `
DhakAI-PAKHI Infrastructure Alert

A new infrastructure issue has been detected.

Issue ID: ${issueId}

Issue: ${issue.title}
Category: ${issue.category}
Severity: ${issue.severity}
Authority: ${authority}

Location: ${location}

AI Confidence: ${confidence}
Drone: ${droneId}

Status: Detected

Please log in to the DhakAI-PAKHI dashboard to review and take action.

DhakAI-PAKHI
Smart Eyes in the Sky for a Cleaner Dhaka
        `.trim(),

        html: `
          <div
            style="
              font-family: Arial, sans-serif;
              background: #f5f7fb;
              padding: 30px;
              color: #1f2937;
            "
          >

            <div
              style="
                max-width: 650px;
                margin: auto;
                background: white;
                border-radius: 14px;
                overflow: hidden;
                border: 1px solid #e5e7eb;
              "
            >

              <div
                style="
                  background: #111827;
                  color: white;
                  padding: 22px 26px;
                "
              >

                <h2
                  style="
                    margin: 0;
                    font-size: 22px;
                  "
                >
                  DhakAI-PAKHI
                </h2>

                <p
                  style="
                    margin: 6px 0 0;
                    color: #93c5fd;
                    font-size: 13px;
                  "
                >
                  Infrastructure Alert System
                </p>

              </div>


              <div
                style="
                  padding: 26px;
                "
              >

                <h3
                  style="
                    margin-top: 0;
                    color: #dc2626;
                  "
                >
                  New Infrastructure Issue Detected
                </h3>


                <table
                  style="
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 14px;
                  "
                >

                  <tr>
                    <td style="padding: 8px 0;">
                      <strong>Issue ID</strong>
                    </td>

                    <td style="padding: 8px 0;">
                      ${issueId}
                    </td>
                  </tr>


                  <tr>
                    <td style="padding: 8px 0;">
                      <strong>Issue</strong>
                    </td>

                    <td style="padding: 8px 0;">
                      ${issue.title}
                    </td>
                  </tr>


                  <tr>
                    <td style="padding: 8px 0;">
                      <strong>Category</strong>
                    </td>

                    <td style="padding: 8px 0;">
                      ${issue.category}
                    </td>
                  </tr>


                  <tr>
                    <td style="padding: 8px 0;">
                      <strong>Severity</strong>
                    </td>

                    <td style="padding: 8px 0;">
                      ${issue.severity}
                    </td>
                  </tr>


                  <tr>
                    <td style="padding: 8px 0;">
                      <strong>Authority</strong>
                    </td>

                    <td style="padding: 8px 0;">
                      ${authority}
                    </td>
                  </tr>


                  <tr>
                    <td style="padding: 8px 0;">
                      <strong>Location</strong>
                    </td>

                    <td style="padding: 8px 0;">
                      ${location}
                    </td>
                  </tr>


                  <tr>
                    <td style="padding: 8px 0;">
                      <strong>AI Confidence</strong>
                    </td>

                    <td style="padding: 8px 0;">
                      ${confidence}
                    </td>
                  </tr>


                  <tr>
                    <td style="padding: 8px 0;">
                      <strong>Drone ID</strong>
                    </td>

                    <td style="padding: 8px 0;">
                      ${droneId}
                    </td>
                  </tr>


                  <tr>
                    <td style="padding: 8px 0;">
                      <strong>Status</strong>
                    </td>

                    <td style="padding: 8px 0;">
                      Detected
                    </td>
                  </tr>

                </table>


                ${
                  issue.imageUrl
                    ? `
                      <div
                        style="
                          margin-top: 22px;
                        "
                      >

                        <p>
                          <strong>
                            Detection Image
                          </strong>
                        </p>

                        <a
                          href="${issue.imageUrl}"
                          target="_blank"
                        >
                          View captured image
                        </a>

                      </div>
                    `
                    : ""
                }


                <p
                  style="
                    margin-top: 26px;
                    font-size: 13px;
                    color: #6b7280;
                  "
                >
                  Please log in to the
                  DhakAI-PAKHI dashboard
                  to review and take action.
                </p>

              </div>


              <div
                style="
                  padding: 16px 26px;
                  background: #f9fafb;
                  border-top: 1px solid #e5e7eb;
                  color: #6b7280;
                  font-size: 12px;
                "
              >

                Smart Eyes in the Sky
                for a Cleaner Dhaka

              </div>

            </div>

          </div>
        `,
      });


    console.log(
      `Email alert sent successfully to ${authority}.`,
    );

    console.log(
      "Recipients:",
      cleanRecipients,
    );

    console.log(
      "Message ID:",
      info.messageId,
    );


    return {
      success: true,

      sent: true,

      skipped: false,

      authority,

      recipients:
        cleanRecipients,

      messageId:
        info.messageId,

      message:
        `Email alert sent successfully to ${authority}.`,
    };


  } catch (error) {
    console.error(
      "Email alert failed:",
      error.message,
    );


    return {
      success: false,

      sent: false,

      skipped: false,

      authority,

      recipients:
        cleanRecipients,

      message:
        error.message ||
        "Unable to send email alert.",
    };
  }
}