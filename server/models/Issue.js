import mongoose from "mongoose";


const issueSchema =
  new mongoose.Schema(
    {
      // ======================================================
      // BASIC ISSUE INFORMATION
      // ======================================================

      title: {
        type: String,

        required: [
          true,
          "Issue title is required.",
        ],

        trim: true,

        minlength: [
          3,
          "Title must contain at least 3 characters.",
        ],

        maxlength: [
          120,
          "Title cannot exceed 120 characters.",
        ],
      },


      description: {
        type: String,

        required: [
          true,
          "Issue description is required.",
        ],

        trim: true,

        maxlength: [
          1000,
          "Description cannot exceed 1000 characters.",
        ],
      },


      // ======================================================
      // ISSUE CATEGORY
      // ======================================================

      category: {
        type: String,

        required: [
          true,
          "Issue category is required.",
        ],

        enum: [
          // ==================================================
          // REAL YOLO MODEL CLASSES
          // ==================================================

          "covered-manhole",
          "damaged-manhole",
          "patched-road",
          "pothole",
          "uncovered-manhole",

          // ==================================================
          // OLD / MANUAL CATEGORIES
          // Keep these for compatibility
          // ==================================================

          "waste",
          "waterlogging",
          "streetlight",
          "drainage",
          "road-damage",
          "illegal-dumping",
          "other",
        ],
      },


      // ======================================================
      // SEVERITY
      // ======================================================

      severity: {
        type: String,

        enum: [
          "low",
          "medium",
          "high",
          "critical",
        ],

        default:
          "medium",
      },


      // ======================================================
      // WORKFLOW STATUS
      // ======================================================

      status: {
        type: String,

        enum: [
          "detected",
          "verified",
          "assigned",
          "in-progress",
          "resolved",
          "rejected",
        ],

        default:
          "detected",
      },


      // ======================================================
      // DNCC AUTHORITY
      // ======================================================

      zone: {
        type: String,

        required: [
          true,
          "DNCC zone is required.",
        ],

        enum: [
          "dncc-north",
          "dncc-south",
        ],
      },


      // ======================================================
      // ADDRESS
      // ======================================================

      address: {
        type: String,

        trim: true,

        default: "",

        maxlength: [
          250,
          "Address cannot exceed 250 characters.",
        ],
      },


      // ======================================================
      // GPS LOCATION
      // ======================================================

      location: {
        latitude: {
          type: Number,

          required: [
            true,
            "Latitude is required.",
          ],

          min: [
            -90,
            "Invalid latitude.",
          ],

          max: [
            90,
            "Invalid latitude.",
          ],
        },


        longitude: {
          type: Number,

          required: [
            true,
            "Longitude is required.",
          ],

          min: [
            -180,
            "Invalid longitude.",
          ],

          max: [
            180,
            "Invalid longitude.",
          ],
        },
      },


      // ======================================================
      // ORIGINAL AI DETECTION IMAGE
      // ======================================================

      imageUrl: {
        type: String,

        trim: true,

        default: "",
      },


      // ======================================================
      // MAINTENANCE / REPAIR PROOF IMAGE
      // ======================================================

      proofImage: {
        type: String,

        trim: true,

        default: "",
      },


      // ======================================================
      // DRONE INFORMATION
      // ======================================================

      droneId: {
        type: String,

        trim: true,

        default: "",
      },


      // ======================================================
      // AI CONFIDENCE
      // ======================================================

      aiConfidence: {
        type: Number,

        min: [
          0,
          "AI confidence cannot be below 0.",
        ],

        max: [
          100,
          "AI confidence cannot exceed 100.",
        ],

        default:
          null,
      },


      // ======================================================
      // REPORTING USER
      // ======================================================

      reportedBy: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "User",

        required: [
          true,
          "Reporting user is required.",
        ],
      },


      // ======================================================
      // ASSIGNED MAINTENANCE TEAM
      // ======================================================

      assignedTeam: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "User",

        default:
          null,
      },


      // ======================================================
      // ASSIGNMENT TIME
      // ======================================================

      assignedAt: {
        type:
          Date,

        default:
          null,
      },


      // ======================================================
      // RESOLUTION TIME
      // ======================================================

      resolvedAt: {
        type:
          Date,

        default:
          null,
      },


      // ======================================================
      // RESOLUTION NOTE
      // ======================================================

      resolutionNote: {
        type:
          String,

        trim:
          true,

        default:
          "",

        maxlength: [
          1000,
          "Resolution note cannot exceed 1000 characters.",
        ],
      },
    },


    // ========================================================
    // SCHEMA OPTIONS
    // ========================================================

    {
      timestamps:
        true,

      versionKey:
        false,
    },
  );


// ==========================================================
// INDEXES
// ==========================================================


// Faster filtering by workflow,
// DNCC zone, and severity.

issueSchema.index({
  status:
    1,

  zone:
    1,

  severity:
    1,
});


// Faster newest-first issue loading.

issueSchema.index({
  createdAt:
    -1,
});


// Faster maintenance task lookup.

issueSchema.index({
  assignedTeam:
    1,

  status:
    1,
});


// Faster category filtering,
// useful for YOLO detected issue types.

issueSchema.index({
  category:
    1,

  createdAt:
    -1,
});


// ==========================================================
// MODEL
// ==========================================================

const Issue =
  mongoose.models.Issue ||
  mongoose.model(
    "Issue",
    issueSchema,
  );


export default Issue;