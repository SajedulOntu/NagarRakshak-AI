const ISSUE_STORAGE_KEY = "dhakaipakhiIssues";

const defaultIssues = [
  {
    id: "DN-N-001",
    authority: "dncc-north",
    type: "Major Pothole",
    location: "Mirpur-10 Roundabout",
    latitude: 23.8067,
    longitude: 90.3687,
    severity: "High",
    confidence: 96,
    status: "Pending",
    assignedTeam: null,
    detectedAt: "2026-08-05T10:25:00",
    description:
      "Large pothole detected near the main traffic lane. Immediate inspection is recommended.",
    assignedAt: "",
    workStartedAt: "",
    resolvedAt: "",
    completedAt: "",
    proofImage: "",
    completionNote: "",
    detectionImage: "",
  },
  {
    id: "DN-N-002",
    authority: "dncc-north",
    type: "Road Surface Crack",
    location: "Agargaon Main Road",
    latitude: 23.7772,
    longitude: 90.3807,
    severity: "Medium",
    confidence: 91,
    status: "Assigned",
    assignedTeam: "North Repair Unit 03",
    detectedAt: "2026-08-05T09:50:00",
    description:
      "Multiple surface cracks detected along the roadside lane.",
    assignedAt: "2026-08-05T10:00:00",
    workStartedAt: "",
    resolvedAt: "",
    completedAt: "",
    proofImage: "",
    completionNote: "",
    detectionImage: "",
  },
  {
    id: "DN-N-003",
    authority: "dncc-north",
    type: "Broken Drain Cover",
    location: "Uttara Sector 7",
    latitude: 23.8727,
    longitude: 90.3995,
    severity: "High",
    confidence: 94,
    status: "In Progress",
    assignedTeam: "North Repair Unit 02",
    detectedAt: "2026-08-05T09:15:00",
    description:
      "Damaged drain cover creates a serious safety risk for pedestrians.",
    assignedAt: "2026-08-05T09:25:00",
    workStartedAt: "2026-08-05T09:40:00",
    resolvedAt: "",
    completedAt: "",
    proofImage: "",
    completionNote: "",
    detectionImage: "",
  },
  {
    id: "DN-S-001",
    authority: "dncc-south",
    type: "Major Pothole",
    location: "Dhanmondi Road 27",
    latitude: 23.7563,
    longitude: 90.3755,
    severity: "High",
    confidence: 97,
    status: "Pending",
    assignedTeam: null,
    detectedAt: "2026-08-05T10:45:00",
    description:
      "Deep pothole detected near the centre of the road.",
    assignedAt: "",
    workStartedAt: "",
    resolvedAt: "",
    completedAt: "",
    proofImage: "",
    completionNote: "",
    detectionImage: "",
  },
  {
    id: "DN-S-002",
    authority: "dncc-south",
    type: "Damaged Road Surface",
    location: "Jatrabari Intersection",
    latitude: 23.7104,
    longitude: 90.4349,
    severity: "High",
    confidence: 93,
    status: "Assigned",
    assignedTeam: "South Repair Unit 01",
    detectedAt: "2026-08-05T10:10:00",
    description:
      "Road surface damage detected near the bus lane.",
    assignedAt: "2026-08-05T10:20:00",
    workStartedAt: "",
    resolvedAt: "",
    completedAt: "",
    proofImage: "",
    completionNote: "",
    detectionImage: "",
  },
  {
    id: "DN-S-003",
    authority: "dncc-south",
    type: "Broken Drain Cover",
    location: "Motijheel Commercial Area",
    latitude: 23.733,
    longitude: 90.4172,
    severity: "Medium",
    confidence: 90,
    status: "In Progress",
    assignedTeam: "South Repair Unit 03",
    detectedAt: "2026-08-05T09:35:00",
    description:
      "Drain cover is partially broken and requires replacement.",
    assignedAt: "2026-08-05T09:45:00",
    workStartedAt: "2026-08-05T10:00:00",
    resolvedAt: "",
    completedAt: "",
    proofImage: "",
    completionNote: "",
    detectionImage: "",
  },
];

const VALID_AUTHORITIES = [
  "dncc-north",
  "dncc-south",
];

const VALID_STATUSES = [
  "Pending",
  "Assigned",
  "In Progress",
  "Resolved",
];

function isBrowserAvailable() {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

function cloneIssues(issues) {
  return issues.map((issue) => ({
    ...issue,
  }));
}

function normalizeIssue(issue) {
  return {
    id: String(issue.id || "").trim(),
    authority: issue.authority,
    type: String(issue.type || "Unknown Issue"),
    location: String(issue.location || "Unknown Location"),
    latitude: Number(issue.latitude) || 0,
    longitude: Number(issue.longitude) || 0,
    severity: issue.severity || "Low",
    confidence: Number(issue.confidence) || 0,
    status: VALID_STATUSES.includes(issue.status)
      ? issue.status
      : "Pending",
    assignedTeam: issue.assignedTeam || null,
    detectedAt:
      issue.detectedAt || new Date().toISOString(),
    description: String(issue.description || ""),
    assignedAt: issue.assignedAt || "",
    workStartedAt: issue.workStartedAt || "",
    resolvedAt: issue.resolvedAt || "",
    completedAt: issue.completedAt || "",
    proofImage: issue.proofImage || "",
    completionNote: issue.completionNote || "",
    detectionImage: issue.detectionImage || "",
  };
}

export function initializeIssues() {
  const initialIssues = cloneIssues(defaultIssues);

  if (!isBrowserAvailable()) {
    return initialIssues;
  }

  const storedIssues = localStorage.getItem(
    ISSUE_STORAGE_KEY,
  );

  if (!storedIssues) {
    localStorage.setItem(
      ISSUE_STORAGE_KEY,
      JSON.stringify(initialIssues),
    );

    return initialIssues;
  }

  try {
    const parsedIssues = JSON.parse(storedIssues);

    if (!Array.isArray(parsedIssues)) {
      throw new Error(
        "Stored issue data is invalid.",
      );
    }

    return parsedIssues.map(normalizeIssue);
  } catch (error) {
    console.error(
      "Unable to read stored issues:",
      error,
    );

    localStorage.setItem(
      ISSUE_STORAGE_KEY,
      JSON.stringify(initialIssues),
    );

    return initialIssues;
  }
}

export function getIssues() {
  return initializeIssues();
}

export function getIssuesByAuthority(authority) {
  return getIssues().filter(
    (issue) => issue.authority === authority,
  );
}

export function getIssueById(issueId) {
  return (
    getIssues().find(
      (issue) => issue.id === issueId,
    ) || null
  );
}

export function saveIssues(issues) {
  if (!Array.isArray(issues)) {
    throw new Error(
      "Issues must be an array.",
    );
  }

  const normalizedIssues =
    issues.map(normalizeIssue);

  if (!isBrowserAvailable()) {
    return normalizedIssues;
  }

  localStorage.setItem(
    ISSUE_STORAGE_KEY,
    JSON.stringify(normalizedIssues),
  );

  return normalizedIssues;
}

export function addIssue(issue) {
  if (
    !issue ||
    typeof issue !== "object"
  ) {
    throw new Error(
      "A valid issue object is required.",
    );
  }

  const newIssue = normalizeIssue(issue);

  if (!newIssue.id) {
    throw new Error(
      "Issue ID is required.",
    );
  }

  if (
    !VALID_AUTHORITIES.includes(
      newIssue.authority,
    )
  ) {
    throw new Error(
      "A valid authority is required.",
    );
  }

  const issues = getIssues();

  const issueExists = issues.some(
    (existingIssue) =>
      existingIssue.id === newIssue.id,
  );

  if (issueExists) {
    throw new Error(
      `Issue ${newIssue.id} already exists.`,
    );
  }

  saveIssues([newIssue, ...issues]);

  return newIssue;
}

export function updateIssue(
  issueId,
  updates,
) {
  if (!issueId) {
    throw new Error(
      "Issue ID is required.",
    );
  }

  if (
    !updates ||
    typeof updates !== "object"
  ) {
    throw new Error(
      "Valid issue updates are required.",
    );
  }

  const issues = getIssues();

  const issueIndex = issues.findIndex(
    (issue) => issue.id === issueId,
  );

  if (issueIndex === -1) {
    throw new Error(
      `Issue ${issueId} was not found.`,
    );
  }

  const updatedIssue = normalizeIssue({
    ...issues[issueIndex],
    ...updates,
    id: issues[issueIndex].id,
  });

  const updatedIssues = [...issues];

  updatedIssues[issueIndex] =
    updatedIssue;

  saveIssues(updatedIssues);

  return updatedIssue;
}

export function assignIssueToTeam(
  issueId,
  teamName,
) {
  const cleanTeamName = String(
    teamName || "",
  ).trim();

  if (!cleanTeamName) {
    throw new Error(
      "Team name is required.",
    );
  }

  return updateIssue(issueId, {
    assignedTeam: cleanTeamName,
    status: "Assigned",
    assignedAt:
      new Date().toISOString(),
    workStartedAt: "",
    resolvedAt: "",
    completedAt: "",
    proofImage: "",
    completionNote: "",
  });
}

export function startIssueWork(issueId) {
  const issue = getIssueById(issueId);

  if (!issue) {
    throw new Error(
      `Issue ${issueId} was not found.`,
    );
  }

  if (!issue.assignedTeam) {
    throw new Error(
      "This issue has not been assigned to a team.",
    );
  }

  if (issue.status === "Resolved") {
    throw new Error(
      "Resolved issues cannot be restarted.",
    );
  }

  return updateIssue(issueId, {
    status: "In Progress",
    workStartedAt:
      new Date().toISOString(),
  });
}

export function resolveIssue(
  issueId,
  completionData = {},
) {
  const issue = getIssueById(issueId);

  if (!issue) {
    throw new Error(
      `Issue ${issueId} was not found.`,
    );
  }

  let proofImage = "";
  let completionNote = "";
  let completedAt =
    new Date().toISOString();

  if (
    typeof completionData === "string"
  ) {
    proofImage = completionData;
  } else if (
    completionData &&
    typeof completionData === "object"
  ) {
    proofImage =
      completionData.proofImage || "";

    completionNote =
      completionData.completionNote || "";

    completedAt =
      completionData.completedAt ||
      completedAt;
  }

  if (!proofImage) {
    throw new Error(
      "Repair proof image is required.",
    );
  }

  return updateIssue(issueId, {
    status: "Resolved",
    resolvedAt: completedAt,
    completedAt,
    proofImage,
    completionNote:
      completionNote ||
      "Maintenance work completed successfully.",
  });
}

export function deleteIssue(issueId) {
  const issues = getIssues();

  const issueExists = issues.some(
    (issue) => issue.id === issueId,
  );

  if (!issueExists) {
    throw new Error(
      `Issue ${issueId} was not found.`,
    );
  }

  const updatedIssues = issues.filter(
    (issue) => issue.id !== issueId,
  );

  saveIssues(updatedIssues);

  return updatedIssues;
}

export function resetIssues() {
  const resetData =
    cloneIssues(defaultIssues);

  if (!isBrowserAvailable()) {
    return resetData;
  }

  localStorage.setItem(
    ISSUE_STORAGE_KEY,
    JSON.stringify(resetData),
  );

  return resetData;
}

export function getIssueStatistics(
  authority = null,
) {
  const issues = authority
    ? getIssuesByAuthority(authority)
    : getIssues();

  return {
    total: issues.length,

    pending: issues.filter(
      (issue) =>
        issue.status === "Pending",
    ).length,

    assigned: issues.filter(
      (issue) =>
        issue.status === "Assigned",
    ).length,

    inProgress: issues.filter(
      (issue) =>
        issue.status === "In Progress",
    ).length,

    resolved: issues.filter(
      (issue) =>
        issue.status === "Resolved",
    ).length,

    highSeverity: issues.filter(
      (issue) =>
        issue.severity === "High",
    ).length,

    assignedTeams: new Set(
      issues
        .filter(
          (issue) =>
            issue.assignedTeam,
        )
        .map(
          (issue) =>
            issue.assignedTeam,
        ),
    ).size,
  };
}