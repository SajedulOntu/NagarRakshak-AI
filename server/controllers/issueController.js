import Issue from "../models/Issue.js";
import User from "../models/User.js";
import { sendIssueAlert } from "../services/emailService.js";


// ==========================================================
// HELPERS
// ==========================================================

function getAllowedZone(user) {
  if (!user) {
    return null;
  }

  if (user.role === "dncc-north") {
    return "dncc-north";
  }

  if (user.role === "dncc-south") {
    return "dncc-south";
  }

  return null;
}


function canAccessIssue(user, issue) {
  if (!user || !issue) {
    return false;
  }

  const allowedZone =
    getAllowedZone(user);

  if (
    allowedZone &&
    issue.zone !== allowedZone
  ) {
    return false;
  }

  if (
    user.role === "maintenance" &&
    String(
      issue.assignedTeam?._id ||
        issue.assignedTeam ||
        "",
    ) !== String(user._id)
  ) {
    return false;
  }

  return true;
}


function getAuthorityName(zone) {
  if (zone === "dncc-north") {
    return "DNCC North";
  }

  if (zone === "dncc-south") {
    return "DNCC South";
  }

  return "DNCC Authority";
}


// ==========================================================
// CREATE ISSUE
// ==========================================================

export async function createIssue(
  req,
  res,
) {
  try {
    console.log(
      "CREATE ISSUE CONTROLLER HIT",
    );


    const {
      title,
      description,
      category,
      severity,
      zone,
      address,
      latitude,
      longitude,
      imageUrl,
      droneId,
      aiConfidence,
    } = req.body;


    // ======================================================
    // BASIC VALIDATION
    // ======================================================

    if (
      !title ||
      !category ||
      !zone
    ) {
      return res
        .status(400)
        .json({
          success: false,

          issueCreated: false,

          message:
            "Title, category, and zone are required.",
        });
    }


    if (
      zone !== "dncc-north" &&
      zone !== "dncc-south"
    ) {
      return res
        .status(400)
        .json({
          success: false,

          issueCreated: false,

          message:
            "Invalid DNCC zone.",
        });
    }


    // ======================================================
    // ZONE AUTHORIZATION
    // ======================================================

    const allowedZone =
      getAllowedZone(req.user);


    if (
      allowedZone &&
      zone !== allowedZone
    ) {
      return res
        .status(403)
        .json({
          success: false,

          issueCreated: false,

          message:
            "You cannot create an issue for another DNCC zone.",
        });
    }


    // ======================================================
    // NORMALIZE COORDINATES
    // ======================================================

    const parsedLatitude =
      latitude === undefined ||
      latitude === ""
        ? null
        : Number(latitude);


    const parsedLongitude =
      longitude === undefined ||
      longitude === ""
        ? null
        : Number(longitude);


    if (
      parsedLatitude !== null &&
      (
        Number.isNaN(parsedLatitude) ||
        parsedLatitude < -90 ||
        parsedLatitude > 90
      )
    ) {
      return res
        .status(400)
        .json({
          success: false,

          issueCreated: false,

          message:
            "Invalid latitude.",
        });
    }


    if (
      parsedLongitude !== null &&
      (
        Number.isNaN(parsedLongitude) ||
        parsedLongitude < -180 ||
        parsedLongitude > 180
      )
    ) {
      return res
        .status(400)
        .json({
          success: false,

          issueCreated: false,

          message:
            "Invalid longitude.",
        });
    }


    // ======================================================
    // NORMALIZE AI CONFIDENCE
    // ======================================================

    const parsedConfidence =
      aiConfidence === undefined ||
      aiConfidence === ""
        ? null
        : Number(aiConfidence);


    if (
      parsedConfidence !== null &&
      Number.isNaN(
        parsedConfidence,
      )
    ) {
      return res
        .status(400)
        .json({
          success: false,

          issueCreated: false,

          message:
            "Invalid AI confidence value.",
        });
    }


    // ======================================================
    // CREATE ISSUE IN MONGODB
    // ======================================================

    const issue =
      await Issue.create({
        title,

        description:
          description || "",

        category,

        severity:
          severity || "medium",

        status:
          "detected",

        zone,

        address:
          address || "",

        location: {
          latitude:
            parsedLatitude,

          longitude:
            parsedLongitude,
        },

        imageUrl:
          imageUrl || "",

        proofImage: "",

        droneId:
          droneId || "",

        aiConfidence:
          parsedConfidence,

        reportedBy:
          req.user._id,
      });


    await issue.populate(
      "reportedBy",
      "name email role organization",
    );


    console.log(
      "Issue saved successfully:",
      issue._id,
    );


    // ======================================================
    // DEFAULT EMAIL RESULT
    // ======================================================

    let emailNotification = {
      success: true,

      sent: false,

      skipped: true,

      authority:
        getAuthorityName(
          issue.zone,
        ),

      recipients: [],

      message:
        "Email notification was not attempted.",
    };


    // ======================================================
    // EMAIL ALERT
    // ======================================================

    try {
      console.log(
        "EMAIL DEBUG - issue zone:",
        issue.zone,
      );


      // Find all active users
      // belonging to the detected DNCC zone.

      const dnccUsers =
        await User.find({
          role:
            issue.zone,

          isActive:
            true,
        }).select(
          "name email role",
        );


      console.log(
        "EMAIL DEBUG - users found:",
        dnccUsers.length,
      );


      // Clean and remove duplicate emails.

      const recipients = [
        ...new Set(
          dnccUsers
            .map(
              (user) =>
                user.email,
            )
            .filter(Boolean)
            .map(
              (email) =>
                String(email)
                  .trim()
                  .toLowerCase(),
            )
            .filter(Boolean),
        ),
      ];


      console.log(
        "EMAIL DEBUG - recipients:",
        recipients,
      );


      // ====================================================
      // SEND EMAIL
      // ====================================================

      if (
        recipients.length > 0
      ) {
        const emailResult =
          await sendIssueAlert({
            recipients,
            issue,
          });


        emailNotification = {
          success:
            Boolean(
              emailResult?.success,
            ),

          sent:
            Boolean(
              emailResult?.sent,
            ),

          skipped:
            Boolean(
              emailResult?.skipped,
            ),

          authority:
            emailResult?.authority ||
            getAuthorityName(
              issue.zone,
            ),

          recipients:
            Array.isArray(
              emailResult?.recipients,
            )
              ? emailResult.recipients
              : recipients,

          messageId:
            emailResult?.messageId ||
            null,

          message:
            emailResult?.message ||
            "Email service completed.",
        };


        if (
          emailNotification.sent
        ) {
          console.log(
            `EMAIL ALERT SENT FOR ${issue.zone}`,
          );
        } else if (
          emailNotification.skipped
        ) {
          console.warn(
            "Email notification skipped:",
            emailNotification.message,
          );
        } else {
          console.warn(
            "Email notification failed:",
            emailNotification.message,
          );
        }
      } else {
        emailNotification = {
          success: true,

          sent: false,

          skipped: true,

          authority:
            getAuthorityName(
              issue.zone,
            ),

          recipients: [],

          message:
            `No active email account found for ${issue.zone}.`,
        };


        console.log(
          emailNotification.message,
        );
      }
    } catch (emailError) {
      console.error(
        "Issue created, but email alert failed:",
        emailError,
      );


      // IMPORTANT:
      // The MongoDB issue remains saved
      // even if email notification fails.

      emailNotification = {
        success: false,

        sent: false,

        skipped: false,

        authority:
          getAuthorityName(
            issue.zone,
          ),

        recipients: [],

        message:
          emailError.message ||
          "Email notification failed.",
      };
    }


    // ======================================================
    // FINAL RESPONSE
    // ======================================================

    return res
      .status(201)
      .json({
        success: true,

        issueCreated: true,

        message:
          emailNotification.sent
            ? "Issue created and email notification sent successfully."
            : emailNotification.skipped
              ? "Issue created successfully. Email notification was skipped."
              : "Issue created successfully, but email notification failed.",

        issue,

        emailNotification,
      });


  } catch (error) {
    console.error(
      "Create issue error:",
      error,
    );


    return res
      .status(500)
      .json({
        success: false,

        issueCreated: false,

        message:
          error.message ||
          "Unable to create the issue.",
      });
  }
}


// ==========================================================
// GET ALL ISSUES
// ==========================================================

export async function getIssues(
  req,
  res,
) {
  try {
    const {
      status,
      severity,
      category,
      zone,
    } = req.query;


    const query = {};


    if (status) {
      query.status =
        status;
    }


    if (severity) {
      query.severity =
        severity;
    }


    if (category) {
      query.category =
        category;
    }


    const allowedZone =
      getAllowedZone(
        req.user,
      );


    if (allowedZone) {
      query.zone =
        allowedZone;
    } else if (zone) {
      query.zone =
        zone;
    }


    // Maintenance users see
    // only assigned issues.

    if (
      req.user.role ===
      "maintenance"
    ) {
      query.assignedTeam =
        req.user._id;
    }


    const issues =
      await Issue.find(
        query,
      )
        .populate(
          "reportedBy",
          "name email role organization",
        )
        .populate(
          "assignedTeam",
          "name email role organization phone",
        )
        .sort({
          createdAt: -1,
        });


    return res
      .status(200)
      .json({
        success: true,

        count:
          issues.length,

        issues,
      });


  } catch (error) {
    console.error(
      "Get issues error:",
      error,
    );


    return res
      .status(500)
      .json({
        success: false,

        message:
          error.message ||
          "Unable to load issues.",
      });
  }
}


// ==========================================================
// GET ISSUE BY ID
// ==========================================================

export async function getIssueById(
  req,
  res,
) {
  try {
    const issue =
      await Issue.findById(
        req.params.id,
      )
        .populate(
          "reportedBy",
          "name email role organization",
        )
        .populate(
          "assignedTeam",
          "name email role organization phone",
        );


    if (!issue) {
      return res
        .status(404)
        .json({
          success: false,

          message:
            "Issue not found.",
        });
    }


    if (
      !canAccessIssue(
        req.user,
        issue,
      )
    ) {
      return res
        .status(403)
        .json({
          success: false,

          message:
            "You do not have permission to view this issue.",
        });
    }


    return res
      .status(200)
      .json({
        success: true,

        issue,
      });


  } catch (error) {
    console.error(
      "Get issue error:",
      error,
    );


    if (
      error.name ===
      "CastError"
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Invalid issue ID.",
        });
    }


    return res
      .status(500)
      .json({
        success: false,

        message:
          error.message ||
          "Unable to load the issue.",
      });
  }
}


// ==========================================================
// GET MAINTENANCE TEAMS
// ==========================================================

export async function getMaintenanceTeams(
  req,
  res,
) {
  try {
    const teams =
      await User.find({
        role:
          "maintenance",

        isActive:
          true,
      })
        .select(
          "name email role organization phone isActive",
        )
        .sort({
          name: 1,
        });


    return res
      .status(200)
      .json({
        success: true,

        count:
          teams.length,

        teams,
      });


  } catch (error) {
    console.error(
      "Get maintenance teams error:",
      error,
    );


    return res
      .status(500)
      .json({
        success: false,

        message:
          error.message ||
          "Unable to load maintenance teams.",
      });
  }
}


// ==========================================================
// ASSIGN ISSUE
// ==========================================================

export async function assignIssue(
  req,
  res,
) {
  try {
    const {
      maintenanceUserId,
    } = req.body;


    if (!maintenanceUserId) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Maintenance user ID is required.",
        });
    }


    const issue =
      await Issue.findById(
        req.params.id,
      );


    if (!issue) {
      return res
        .status(404)
        .json({
          success: false,

          message:
            "Issue not found.",
        });
    }


    const allowedZone =
      getAllowedZone(
        req.user,
      );


    if (
      allowedZone &&
      issue.zone !==
        allowedZone
    ) {
      return res
        .status(403)
        .json({
          success: false,

          message:
            "You cannot assign issues from another DNCC zone.",
        });
    }


    const maintenanceUser =
      await User.findById(
        maintenanceUserId,
      );


    if (
      !maintenanceUser ||
      maintenanceUser.role !==
        "maintenance" ||
      !maintenanceUser.isActive
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Please select an active maintenance account.",
        });
    }


    issue.assignedTeam =
      maintenanceUser._id;


    issue.assignedAt =
      new Date();


    issue.status =
      "assigned";


    await issue.save();


    await issue.populate(
      "reportedBy",
      "name email role organization",
    );


    await issue.populate(
      "assignedTeam",
      "name email role organization phone",
    );


    return res
      .status(200)
      .json({
        success: true,

        message:
          `Issue assigned to ${maintenanceUser.name}.`,

        issue,
      });


  } catch (error) {
    console.error(
      "Assign issue error:",
      error,
    );


    if (
      error.name ===
      "CastError"
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Invalid issue or maintenance user ID.",
        });
    }


    return res
      .status(500)
      .json({
        success: false,

        message:
          error.message ||
          "Unable to assign the issue.",
      });
  }
}


// ==========================================================
// UPDATE ISSUE STATUS
// ==========================================================

export async function updateIssueStatus(
  req,
  res,
) {
  try {
    const {
      status,
      resolutionNote,
      proofImage,
    } = req.body;


    const allowedStatuses = [
      "detected",
      "verified",
      "assigned",
      "in-progress",
      "resolved",
      "rejected",
    ];


    if (
      !allowedStatuses.includes(
        status,
      )
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Invalid issue status.",
        });
    }


    const issue =
      await Issue.findById(
        req.params.id,
      );


    if (!issue) {
      return res
        .status(404)
        .json({
          success: false,

          message:
            "Issue not found.",
        });
    }


    const allowedZone =
      getAllowedZone(
        req.user,
      );


    if (
      allowedZone &&
      issue.zone !==
        allowedZone
    ) {
      return res
        .status(403)
        .json({
          success: false,

          message:
            "You cannot update issues from another DNCC zone.",
        });
    }


    // ======================================================
    // MAINTENANCE RESTRICTIONS
    // ======================================================

    if (
      req.user.role ===
      "maintenance"
    ) {
      if (
        !issue.assignedTeam ||
        String(
          issue.assignedTeam,
        ) !==
          String(
            req.user._id,
          )
      ) {
        return res
          .status(403)
          .json({
            success: false,

            message:
              "This issue is not assigned to your maintenance account.",
          });
      }


      if (
        status !==
          "in-progress" &&
        status !==
          "resolved"
      ) {
        return res
          .status(403)
          .json({
            success: false,

            message:
              "Maintenance can only mark an issue In Progress or Resolved.",
          });
      }
    }


    // ======================================================
    // UPDATE STATUS
    // ======================================================

    issue.status =
      status;


    if (
      status ===
      "resolved"
    ) {
      issue.resolvedAt =
        new Date();


      issue.resolutionNote =
        resolutionNote || "";


      if (proofImage) {
        issue.proofImage =
          proofImage;
      }
    } else {
      issue.resolvedAt =
        null;


      if (
        resolutionNote !==
        undefined
      ) {
        issue.resolutionNote =
          resolutionNote;
      }


      if (
        status !==
        "resolved"
      ) {
        issue.proofImage =
          "";
      }
    }


    await issue.save();


    await issue.populate(
      "reportedBy",
      "name email role organization",
    );


    await issue.populate(
      "assignedTeam",
      "name email role organization phone",
    );


    return res
      .status(200)
      .json({
        success: true,

        message:
          "Issue status updated successfully.",

        issue,
      });


  } catch (error) {
    console.error(
      "Update issue status error:",
      error,
    );


    if (
      error.name ===
      "CastError"
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Invalid issue ID.",
        });
    }


    return res
      .status(500)
      .json({
        success: false,

        message:
          error.message ||
          "Unable to update the issue status.",
      });
  }
}