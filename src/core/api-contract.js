import { z } from "zod";
import { resolveTaskTitle } from "./task-title.js";
export const runtimeWorkspaceFileStatusSchema = z.enum([
    "modified",
    "added",
    "deleted",
    "renamed",
    "copied",
    "untracked",
    "unknown",
]);
export const runtimeWorkspaceFileChangeSchema = z.object({
    path: z.string(),
    previousPath: z.string().optional(),
    status: runtimeWorkspaceFileStatusSchema,
    additions: z.number(),
    deletions: z.number(),
    oldText: z.string().nullable(),
    newText: z.string().nullable(),
});
export const runtimeWorkspaceChangesRequestSchema = z.object({
    taskId: z.string(),
    baseRef: z.string(),
    mode: z.enum(["working_copy", "last_turn"]).optional(),
});
export const runtimeWorkspaceChangesModeSchema = z.enum(["working_copy", "last_turn"]);
export const runtimeWorkspaceChangesResponseSchema = z.object({
    repoRoot: z.string(),
    generatedAt: z.number(),
    files: z.array(runtimeWorkspaceFileChangeSchema),
});
export const runtimeWorkspaceFileSearchRequestSchema = z.object({
    query: z.string(),
    limit: z.number().int().positive().optional(),
});
export const runtimeWorkspaceFileSearchMatchSchema = z.object({
    path: z.string(),
    name: z.string(),
    changed: z.boolean(),
});
export const runtimeWorkspaceFileSearchResponseSchema = z.object({
    query: z.string(),
    files: z.array(runtimeWorkspaceFileSearchMatchSchema),
});
export const runtimeSlashCommandSchema = z.object({
    name: z.string(),
    instructions: z.string(),
    description: z.string().optional(),
});
export const runtimeSlashCommandsResponseSchema = z.object({
    commands: z.array(runtimeSlashCommandSchema),
});
export const runtimeAgentIdSchema = z.enum(["claude", "codex", "gemini", "opencode", "droid", "kiro", "cline"]);
export const runtimeBoardColumnIdSchema = z.enum(["backlog", "in_progress", "review", "trash"]);
export const runtimeTaskAutoReviewModeSchema = z.enum(["commit", "pr", "move_to_trash"]);
export const runtimeClineReasoningEffortSchema = z.enum(["low", "medium", "high", "xhigh"]);
export const runtimeTaskClineSettingsSchema = z.object({
    providerId: z.string().optional(),
    modelId: z.string().optional(),
    reasoningEffort: runtimeClineReasoningEffortSchema.optional(),
});
export const runtimeTaskImageSchema = z.object({
    id: z.string(),
    data: z.string(),
    mimeType: z.string(),
    name: z.string().optional(),
});
const runtimeLegacyTaskClineReasoningEffortSchema = z.enum(["default", "low", "medium", "high", "xhigh"]);
function normalizeRuntimeTaskClineSettings(input) {
    if (input.clineSettings !== undefined) {
        return input.clineSettings;
    }
    const providerId = input.clineProviderId?.trim();
    const modelId = input.clineModelId?.trim();
    if (!providerId && !modelId && input.clineReasoningEffort === undefined) {
        return undefined;
    }
    return {
        ...(providerId ? { providerId } : {}),
        ...(modelId ? { modelId } : {}),
        ...(input.clineReasoningEffort && input.clineReasoningEffort !== "default"
            ? { reasoningEffort: input.clineReasoningEffort }
            : {}),
    };
}
export const runtimeBoardCardSchema = z
    .object({
    id: z.string(),
    externalTaskKey: z.string().optional(),
    title: z.string().optional(),
    prompt: z.string(),
    startInPlanMode: z.boolean(),
    autoReviewEnabled: z.boolean().optional(),
    autoReviewMode: runtimeTaskAutoReviewModeSchema.optional(),
    images: z.array(runtimeTaskImageSchema).optional(),
    agentId: runtimeAgentIdSchema.optional(),
    clineSettings: runtimeTaskClineSettingsSchema.optional(),
    clineProviderId: z.string().optional(),
    clineModelId: z.string().optional(),
    clineReasoningEffort: runtimeLegacyTaskClineReasoningEffortSchema.optional(),
    baseRef: z.string(),
    createdAt: z.number(),
    updatedAt: z.number(),
})
    .transform(({ clineProviderId: _legacyProviderId, clineModelId: _legacyModelId, clineReasoningEffort: _legacyReasoningEffort, ...card }) => {
    const clineSettings = normalizeRuntimeTaskClineSettings({
        clineSettings: card.clineSettings,
        clineProviderId: _legacyProviderId,
        clineModelId: _legacyModelId,
        clineReasoningEffort: _legacyReasoningEffort,
    });
    return {
        ...card,
        ...(clineSettings !== undefined ? { clineSettings } : {}),
        title: resolveTaskTitle(card.title, card.prompt),
    };
});
export const runtimeBoardColumnSchema = z.object({
    id: runtimeBoardColumnIdSchema,
    title: z.string(),
    cards: z.array(runtimeBoardCardSchema),
});
export const runtimeBoardDependencySchema = z.object({
    id: z.string(),
    fromTaskId: z.string(),
    toTaskId: z.string(),
    createdAt: z.number(),
});
export const runtimeBoardDataSchema = z.object({
    columns: z.array(runtimeBoardColumnSchema),
    dependencies: z.array(runtimeBoardDependencySchema).default([]),
});
export const runtimeGitRepositoryInfoSchema = z.object({
    currentBranch: z.string().nullable(),
    defaultBranch: z.string().nullable(),
    branches: z.array(z.string()),
});
export const runtimeGitSyncActionSchema = z.enum(["fetch", "pull", "push"]);
export const runtimeGitSyncSummarySchema = z.object({
    currentBranch: z.string().nullable(),
    upstreamBranch: z.string().nullable(),
    changedFiles: z.number(),
    additions: z.number(),
    deletions: z.number(),
    aheadCount: z.number(),
    behindCount: z.number(),
});
export const runtimeGitSummaryResponseSchema = z.object({
    ok: z.boolean(),
    summary: runtimeGitSyncSummarySchema,
    error: z.string().optional(),
});
export const runtimeGitSyncResponseSchema = z.object({
    ok: z.boolean(),
    action: runtimeGitSyncActionSchema,
    summary: runtimeGitSyncSummarySchema,
    output: z.string(),
    error: z.string().optional(),
});
export const runtimeGitCheckoutRequestSchema = z.object({
    branch: z.string(),
});
export const runtimeGitCheckoutResponseSchema = z.object({
    ok: z.boolean(),
    branch: z.string(),
    summary: runtimeGitSyncSummarySchema,
    output: z.string(),
    error: z.string().optional(),
});
export const runtimeGitDiscardResponseSchema = z.object({
    ok: z.boolean(),
    summary: runtimeGitSyncSummarySchema,
    output: z.string(),
    error: z.string().optional(),
});
export const runtimeTaskSessionStateSchema = z.enum(["idle", "running", "awaiting_review", "failed", "interrupted"]);
export const runtimeTaskSessionModeSchema = z.enum(["act", "plan"]);
export const runtimeTaskSessionReviewReasonSchema = z
    .enum(["attention", "exit", "error", "interrupted", "hook"])
    .nullable();
export const runtimeTaskHookActivitySchema = z.object({
    activityText: z.string().nullable().default(null),
    toolName: z.string().nullable().default(null),
    toolInputSummary: z.string().nullable().default(null),
    finalMessage: z.string().nullable().default(null),
    hookEventName: z.string().nullable().default(null),
    notificationType: z.string().nullable().default(null),
    source: z.string().nullable().default(null),
});
export const runtimeTaskTurnCheckpointSchema = z.object({
    turn: z.number().int().positive(),
    ref: z.string(),
    commit: z.string(),
    createdAt: z.number(),
});
export const runtimeTaskSessionSummarySchema = z.object({
    taskId: z.string(),
    state: runtimeTaskSessionStateSchema,
    mode: runtimeTaskSessionModeSchema.nullable().optional(),
    agentId: runtimeAgentIdSchema.nullable(),
    workspacePath: z.string().nullable(),
    pid: z.number().nullable(),
    startedAt: z.number().nullable(),
    updatedAt: z.number(),
    lastOutputAt: z.number().nullable(),
    reviewReason: runtimeTaskSessionReviewReasonSchema,
    exitCode: z.number().nullable(),
    lastHookAt: z.number().nullable().default(null),
    latestHookActivity: runtimeTaskHookActivitySchema.nullable().default(null),
    warningMessage: z.string().nullable().optional(),
    latestTurnCheckpoint: runtimeTaskTurnCheckpointSchema.nullable().optional(),
    previousTurnCheckpoint: runtimeTaskTurnCheckpointSchema.nullable().optional(),
});
export const runtimeWorkspaceStateResponseSchema = z.object({
    repoPath: z.string(),
    statePath: z.string(),
    boardPath: z.string().optional(),
    git: runtimeGitRepositoryInfoSchema,
    board: runtimeBoardDataSchema,
    sessions: z.record(z.string(), runtimeTaskSessionSummarySchema),
    revision: z.number(),
});
export const runtimeTaskImportVersionSchema = z.literal("v1");
export const runtimeTaskImportTaskSchema = z.object({
    externalTaskKey: z.string(),
    title: z.string().optional(),
    prompt: z.string(),
    startInPlanMode: z.boolean().optional(),
    autoReviewEnabled: z.boolean().optional(),
    autoReviewMode: runtimeTaskAutoReviewModeSchema.optional(),
    images: z.array(runtimeTaskImageSchema).optional(),
    agentId: runtimeAgentIdSchema.optional(),
    clineSettings: runtimeTaskClineSettingsSchema.optional(),
    baseRef: z.string().optional(),
});
export const runtimeTaskImportLinkSchema = z.object({
    fromExternalTaskKey: z.string(),
    toExternalTaskKey: z.string(),
});
export const runtimeTaskImportRequestSchema = z.object({
    version: runtimeTaskImportVersionSchema,
    tasks: z.array(runtimeTaskImportTaskSchema),
    links: z.array(runtimeTaskImportLinkSchema).optional(),
    startTaskExternalKeys: z.array(z.string()).optional(),
});
export const runtimeTaskImportTaskMappingSchema = z.object({
    externalTaskKey: z.string(),
    taskId: z.string(),
    columnId: runtimeBoardColumnIdSchema,
    created: z.boolean(),
});
export const runtimeTaskImportLinkResultSchema = z.object({
    fromExternalTaskKey: z.string(),
    toExternalTaskKey: z.string(),
    dependencyId: z.string(),
    created: z.boolean(),
});
export const runtimeTaskImportStartResultSchema = z.object({
    externalTaskKey: z.string(),
    taskId: z.string(),
    ok: z.boolean(),
    summary: runtimeTaskSessionSummarySchema.nullable().optional(),
    error: z.string().optional(),
});
export const runtimeTaskImportErrorCodeSchema = z.enum([
    "conflicting_task_intent",
    "duplicate_task_key",
    "missing_link_task",
    "invalid_link",
    "invalid_start_task",
]);
export const runtimeTaskImportErrorSchema = z.object({
    code: runtimeTaskImportErrorCodeSchema,
    message: z.string(),
    externalTaskKey: z.string().optional(),
    fromExternalTaskKey: z.string().optional(),
    toExternalTaskKey: z.string().optional(),
});
export const runtimeTaskImportResponseSchema = z.object({
    version: runtimeTaskImportVersionSchema,
    ok: z.boolean(),
    applied: z.boolean(),
    taskMappings: z.array(runtimeTaskImportTaskMappingSchema),
    linkResults: z.array(runtimeTaskImportLinkResultSchema),
    startResults: z.array(runtimeTaskImportStartResultSchema),
    error: runtimeTaskImportErrorSchema.optional(),
});
export const runtimeWorkspaceStateSaveRequestSchema = z.object({
    board: runtimeBoardDataSchema,
    sessions: z.record(z.string(), runtimeTaskSessionSummarySchema),
    expectedRevision: z.number().int().nonnegative().optional(),
});
export const runtimeWorkspaceStateConflictResponseSchema = z.object({
    error: z.string(),
    currentRevision: z.number(),
});
export const runtimeWorkspaceStateNotifyResponseSchema = z.object({
    ok: z.boolean(),
});
export const runtimeProjectTaskCountsSchema = z.object({
    backlog: z.number(),
    in_progress: z.number(),
    review: z.number(),
    trash: z.number(),
});
export const runtimeProjectSummarySchema = z.object({
    id: z.string(),
    path: z.string(),
    name: z.string(),
    taskCounts: runtimeProjectTaskCountsSchema,
});
export const runtimeTaskWorkspaceMetadataSchema = z.object({
    taskId: z.string(),
    path: z.string(),
    displayPath: z.string(),
    exists: z.boolean(),
    baseRef: z.string(),
    branch: z.string().nullable(),
    isDetached: z.boolean(),
    headCommit: z.string().nullable(),
    changedFiles: z.number().nullable(),
    additions: z.number().nullable(),
    deletions: z.number().nullable(),
    stateVersion: z.number().int().nonnegative(),
});
export const runtimeWorkspaceMetadataSchema = z.object({
    homeGitSummary: runtimeGitSyncSummarySchema.nullable(),
    homeGitStateVersion: z.number().int().nonnegative(),
    taskWorkspaces: z.array(runtimeTaskWorkspaceMetadataSchema),
});
export const runtimeClineMcpServerAuthStatusSchema = z.object({
    serverName: z.string(),
    oauthSupported: z.boolean(),
    oauthConfigured: z.boolean(),
    lastError: z.string().nullable(),
    lastAuthenticatedAt: z.number().nullable(),
});
export const runtimeStateStreamSnapshotMessageSchema = z.object({
    type: z.literal("snapshot"),
    currentProjectId: z.string().nullable(),
    projects: z.array(runtimeProjectSummarySchema),
    workspaceState: runtimeWorkspaceStateResponseSchema.nullable(),
    workspaceMetadata: runtimeWorkspaceMetadataSchema.nullable(),
    clineSessionContextVersion: z.number().int().nonnegative(),
});
export const runtimeStateStreamWorkspaceStateMessageSchema = z.object({
    type: z.literal("workspace_state_updated"),
    workspaceId: z.string(),
    workspaceState: runtimeWorkspaceStateResponseSchema,
});
export const runtimeStateStreamTaskSessionsMessageSchema = z.object({
    type: z.literal("task_sessions_updated"),
    workspaceId: z.string(),
    summaries: z.array(runtimeTaskSessionSummarySchema),
});
export const runtimeStateStreamProjectsMessageSchema = z.object({
    type: z.literal("projects_updated"),
    currentProjectId: z.string().nullable(),
    projects: z.array(runtimeProjectSummarySchema),
});
export const runtimeStateStreamWorkspaceMetadataMessageSchema = z.object({
    type: z.literal("workspace_metadata_updated"),
    workspaceId: z.string(),
    workspaceMetadata: runtimeWorkspaceMetadataSchema,
});
export const runtimeStateStreamTaskReadyForReviewMessageSchema = z.object({
    type: z.literal("task_ready_for_review"),
    workspaceId: z.string(),
    taskId: z.string(),
    triggeredAt: z.number(),
});
export const runtimeStateStreamTaskChatMessageSchema = z.object({
    type: z.literal("task_chat_message"),
    workspaceId: z.string(),
    taskId: z.string(),
    message: z.lazy(() => runtimeTaskChatMessageSchema),
});
export const runtimeStateStreamTaskChatClearedMessageSchema = z.object({
    type: z.literal("task_chat_cleared"),
    workspaceId: z.string(),
    taskId: z.string(),
});
export const runtimeStateStreamMcpAuthUpdatedMessageSchema = z.object({
    type: z.literal("mcp_auth_updated"),
    statuses: z.array(runtimeClineMcpServerAuthStatusSchema),
});
export const runtimeStateStreamClineSessionContextUpdatedMessageSchema = z.object({
    type: z.literal("cline_session_context_updated"),
    version: z.number().int().nonnegative(),
});
export const runtimeStateStreamErrorMessageSchema = z.object({
    type: z.literal("error"),
    message: z.string(),
});
export const runtimeStateStreamMessageSchema = z.discriminatedUnion("type", [
    runtimeStateStreamSnapshotMessageSchema,
    runtimeStateStreamWorkspaceStateMessageSchema,
    runtimeStateStreamTaskSessionsMessageSchema,
    runtimeStateStreamProjectsMessageSchema,
    runtimeStateStreamWorkspaceMetadataMessageSchema,
    runtimeStateStreamTaskReadyForReviewMessageSchema,
    runtimeStateStreamTaskChatMessageSchema,
    runtimeStateStreamTaskChatClearedMessageSchema,
    runtimeStateStreamMcpAuthUpdatedMessageSchema,
    runtimeStateStreamClineSessionContextUpdatedMessageSchema,
    runtimeStateStreamErrorMessageSchema,
]);
export const runtimeProjectsResponseSchema = z.object({
    currentProjectId: z.string().nullable(),
    projects: z.array(runtimeProjectSummarySchema),
});
export const runtimeProjectAddRequestSchema = z
    .object({
    path: z.string().optional(),
    gitUrl: z.string().optional(),
    initializeGit: z.boolean().optional(),
})
    .refine((data) => data.path || data.gitUrl, { message: "Either path or gitUrl is required" });
export const runtimeProjectAddResponseSchema = z.object({
    ok: z.boolean(),
    project: runtimeProjectSummarySchema.nullable(),
    requiresGitInitialization: z.boolean().optional(),
    error: z.string().optional(),
});
export const runtimeProjectDirectoryPickerResponseSchema = z.object({
    ok: z.boolean(),
    path: z.string().nullable(),
    error: z.string().optional(),
});
export const runtimeDirectoryListEntrySchema = z.object({
    name: z.string(),
    path: z.string(),
    isGitRepository: z.boolean(),
});
export const runtimeDirectoryListRequestSchema = z.object({
    path: z.string().optional(),
});
export const runtimeDirectoryListResponseSchema = z.object({
    ok: z.boolean(),
    currentPath: z.string(),
    parentPath: z.string().nullable(),
    rootPath: z.string(),
    entries: z.array(runtimeDirectoryListEntrySchema),
    error: z.string().optional(),
});
export const runtimeProjectRemoveRequestSchema = z.object({
    projectId: z.string(),
});
export const runtimeProjectRemoveResponseSchema = z.object({
    ok: z.boolean(),
    error: z.string().optional(),
});
export const runtimeWorktreeEnsureRequestSchema = z.object({
    taskId: z.string(),
    baseRef: z.string(),
});
export const runtimeWorktreeEnsureResponseSchema = z.union([
    z.object({
        ok: z.literal(true),
        path: z.string(),
        displayPath: z.string(),
        baseRef: z.string(),
        baseCommit: z.string(),
        warning: z.string().optional(),
        error: z.string().optional(),
    }),
    z.object({
        ok: z.literal(false),
        path: z.null(),
        baseRef: z.string(),
        baseCommit: z.null(),
        error: z.string().optional(),
    }),
]);
export const runtimeWorktreeDeleteRequestSchema = z.object({
    taskId: z.string(),
});
export const runtimeWorktreeDeleteResponseSchema = z.object({
    ok: z.boolean(),
    removed: z.boolean(),
    error: z.string().optional(),
});
export const runtimeTaskWorkspaceInfoRequestSchema = z.object({
    taskId: z.string(),
    baseRef: z.string(),
});
export const runtimeTaskWorkspaceInfoResponseSchema = z.object({
    taskId: z.string(),
    path: z.string(),
    displayPath: z.string(),
    exists: z.boolean(),
    baseRef: z.string(),
    branch: z.string().nullable(),
    isDetached: z.boolean(),
    headCommit: z.string().nullable(),
});
export const runtimeProjectShortcutSchema = z.object({
    label: z.string(),
    command: z.string(),
    icon: z.string().optional(),
});
export const runtimeClineOauthProviderSchema = z.enum(["cline", "oca", "openai-codex"]);
export const runtimeClineProviderSettingsSchema = z.object({
    providerId: z.string().nullable(),
    modelId: z.string().nullable(),
    baseUrl: z.string().nullable(),
    reasoningEffort: runtimeClineReasoningEffortSchema.nullable().optional(),
    apiKeyConfigured: z.boolean(),
    oauthProvider: runtimeClineOauthProviderSchema.nullable(),
    oauthAccessTokenConfigured: z.boolean(),
    oauthRefreshTokenConfigured: z.boolean(),
    oauthAccountId: z.string().nullable(),
    oauthExpiresAt: z.number().int().positive().nullable(),
});
export const runtimeClineAccountProfileSchema = z.object({
    accountId: z.string().nullable(),
    email: z.string().nullable(),
    displayName: z.string().nullable(),
});
export const runtimeClineAccountProfileResponseSchema = z.object({
    profile: runtimeClineAccountProfileSchema.nullable(),
    error: z.string().optional(),
});
export const runtimeClineKanbanAccessResponseSchema = z.object({
    enabled: z.boolean(),
    error: z.string().optional(),
});
export const runtimeClineAccountOrganizationSchema = z.object({
    organizationId: z.string(),
    name: z.string(),
    active: z.boolean(),
    roles: z.array(z.string()),
});
export const runtimeClineAccountOrganizationsResponseSchema = z.object({
    organizations: z.array(runtimeClineAccountOrganizationSchema),
    error: z.string().optional(),
});
export const runtimeClineAccountBalanceResponseSchema = z.object({
    balance: z.number().nullable(),
    activeAccountLabel: z.string().nullable(),
    activeOrganizationId: z.string().nullable(),
    error: z.string().optional(),
});
export const runtimeClineAccountSwitchRequestSchema = z.object({
    organizationId: z.string().nullable(),
});
export const runtimeClineAccountSwitchResponseSchema = z.object({
    ok: z.boolean(),
    error: z.string().optional(),
});
export const runtimeFeaturebaseTokenResponseSchema = z.object({
    featurebaseJwt: z.string(),
});
export const runtimeClineProviderCatalogItemSchema = z.object({
    id: z.string(),
    name: z.string(),
    oauthSupported: z.boolean(),
    enabled: z.boolean(),
    defaultModelId: z.string().nullable(),
    baseUrl: z.string().nullable(),
    supportsBaseUrl: z.boolean(),
    env: z.array(z.string()).optional(),
});
export const runtimeClineProviderCatalogResponseSchema = z.object({
    providers: z.array(runtimeClineProviderCatalogItemSchema),
});
export const runtimeClineProviderModelsRequestSchema = z.object({
    providerId: z.string(),
});
export const runtimeClineProviderModelSchema = z.object({
    id: z.string(),
    name: z.string(),
    supportsVision: z.boolean().optional(),
    supportsAttachments: z.boolean().optional(),
    supportsReasoningEffort: z.boolean().optional(),
});
export const runtimeClineProviderModelsResponseSchema = z.object({
    providerId: z.string(),
    models: z.array(runtimeClineProviderModelSchema),
});
export const runtimeClineProviderCapabilitySchema = z.enum([
    "streaming",
    "tools",
    "reasoning",
    "vision",
    "prompt-cache",
]);
export const runtimeClineAddProviderRequestSchema = z.object({
    providerId: z.string(),
    name: z.string(),
    baseUrl: z.string(),
    apiKey: z.string().nullable().optional(),
    headers: z.record(z.string(), z.string()).optional(),
    timeoutMs: z.number().int().positive().optional(),
    models: z.array(z.string()),
    defaultModelId: z.string().nullable().optional(),
    modelsSourceUrl: z.string().nullable().optional(),
    capabilities: z.array(runtimeClineProviderCapabilitySchema).optional(),
});
export const runtimeClineAddProviderResponseSchema = runtimeClineProviderSettingsSchema;
export const runtimeClineUpdateProviderRequestSchema = z.object({
    providerId: z.string(),
    name: z.string().optional(),
    baseUrl: z.string().optional(),
    apiKey: z.string().nullable().optional(),
    headers: z.record(z.string(), z.string()).nullable().optional(),
    timeoutMs: z.number().int().positive().nullable().optional(),
    models: z.array(z.string()).optional(),
    defaultModelId: z.string().nullable().optional(),
    modelsSourceUrl: z.string().nullable().optional(),
    capabilities: z.array(runtimeClineProviderCapabilitySchema).optional(),
});
export const runtimeClineUpdateProviderResponseSchema = runtimeClineProviderSettingsSchema;
export const runtimeClineOauthLoginRequestSchema = z.object({
    provider: runtimeClineOauthProviderSchema,
    baseUrl: z.string().nullable().optional(),
});
export const runtimeClineOauthLoginResponseSchema = z.object({
    ok: z.boolean(),
    provider: runtimeClineOauthProviderSchema,
    settings: runtimeClineProviderSettingsSchema.optional(),
    error: z.string().optional(),
});
export const runtimeClineDeviceAuthStartResponseSchema = z.object({
    deviceCode: z.string(),
    userCode: z.string(),
    verificationUrl: z.string(),
    expiresInSeconds: z.number(),
    pollIntervalSeconds: z.number(),
});
export const runtimeClineDeviceAuthCompleteRequestSchema = z.object({
    deviceCode: z.string(),
    expiresInSeconds: z.number(),
    pollIntervalSeconds: z.number(),
    baseUrl: z.string().nullable().optional(),
});
export const runtimeClineDeviceAuthCompleteResponseSchema = runtimeClineOauthLoginResponseSchema;
export const runtimeClineProviderSettingsSaveRequestSchema = z.object({
    providerId: z.string(),
    modelId: z.string().nullable().optional(),
    apiKey: z.string().nullable().optional(),
    baseUrl: z.string().nullable().optional(),
    reasoningEffort: runtimeClineReasoningEffortSchema.nullable().optional(),
    region: z.string().nullable().optional(),
    aws: z
        .object({
        accessKey: z.string().nullable().optional(),
        secretKey: z.string().nullable().optional(),
        sessionToken: z.string().nullable().optional(),
        region: z.string().nullable().optional(),
        profile: z.string().nullable().optional(),
        authentication: z.enum(["iam", "api-key", "profile"]).nullable().optional(),
        endpoint: z.string().nullable().optional(),
    })
        .optional(),
    gcp: z
        .object({
        projectId: z.string().nullable().optional(),
        region: z.string().nullable().optional(),
    })
        .optional(),
});
export const runtimeClineProviderSettingsSaveResponseSchema = runtimeClineProviderSettingsSchema;
const runtimeClineMcpServerBaseSchema = z.object({
    name: z.string(),
    disabled: z.boolean(),
});
export const runtimeClineMcpServerSchema = z.discriminatedUnion("type", [
    runtimeClineMcpServerBaseSchema.extend({
        type: z.literal("stdio"),
        command: z.string(),
        args: z.array(z.string()).optional(),
        cwd: z.string().optional(),
        env: z.record(z.string(), z.string()).optional(),
    }),
    runtimeClineMcpServerBaseSchema.extend({
        type: z.literal("sse"),
        url: z.string().url(),
        headers: z.record(z.string(), z.string()).optional(),
    }),
    runtimeClineMcpServerBaseSchema.extend({
        type: z.literal("streamableHttp"),
        url: z.string().url(),
        headers: z.record(z.string(), z.string()).optional(),
    }),
]);
export const runtimeClineMcpSettingsResponseSchema = z.object({
    path: z.string(),
    servers: z.array(runtimeClineMcpServerSchema),
});
export const runtimeClineMcpSettingsSaveRequestSchema = z.object({
    servers: z.array(runtimeClineMcpServerSchema),
});
export const runtimeClineMcpSettingsSaveResponseSchema = runtimeClineMcpSettingsResponseSchema;
export const runtimeClineMcpAuthStatusResponseSchema = z.object({
    statuses: z.array(runtimeClineMcpServerAuthStatusSchema),
});
export const runtimeClineMcpOAuthRequestSchema = z.object({
    serverName: z.string(),
});
export const runtimeClineMcpOAuthResponseSchema = z.object({
    serverName: z.string(),
    authorized: z.literal(true),
    message: z.string(),
});
export const runtimeCommandRunRequestSchema = z.object({
    command: z.string(),
});
export const runtimeCommandRunResponseSchema = z.object({
    exitCode: z.number(),
    stdout: z.string(),
    stderr: z.string(),
    combinedOutput: z.string(),
    durationMs: z.number(),
});
export const runtimeOpenFileRequestSchema = z.object({
    filePath: z.string(),
});
export const runtimeOpenFileResponseSchema = z.object({
    ok: z.boolean(),
});
export const runtimeDebugResetAllStateResponseSchema = z.object({
    ok: z.boolean(),
    clearedPaths: z.array(z.string()),
});
export const runtimeAgentDefinitionSchema = z.object({
    id: runtimeAgentIdSchema,
    label: z.string(),
    binary: z.string(),
    command: z.string(),
    defaultArgs: z.array(z.string()),
    installed: z.boolean(),
    configured: z.boolean(),
});
export const runtimeConfigResponseSchema = z.object({
    selectedAgentId: runtimeAgentIdSchema,
    selectedShortcutLabel: z.string().nullable(),
    agentAutonomousModeEnabled: z.boolean(),
    debugModeEnabled: z.boolean().optional(),
    effectiveCommand: z.string().nullable(),
    globalConfigPath: z.string(),
    projectConfigPath: z.string().nullable(),
    readyForReviewNotificationsEnabled: z.boolean(),
    detectedCommands: z.array(z.string()),
    agents: z.array(runtimeAgentDefinitionSchema),
    shortcuts: z.array(runtimeProjectShortcutSchema),
    boardPath: z.string().nullable(),
    clineProviderSettings: runtimeClineProviderSettingsSchema,
    commitPromptTemplate: z.string(),
    openPrPromptTemplate: z.string(),
    commitPromptTemplateDefault: z.string(),
    openPrPromptTemplateDefault: z.string(),
});
export const runtimeConfigSaveRequestSchema = z.object({
    selectedAgentId: runtimeAgentIdSchema.optional(),
    selectedShortcutLabel: z.string().nullable().optional(),
    agentAutonomousModeEnabled: z.boolean().optional(),
    shortcuts: z.array(runtimeProjectShortcutSchema).optional(),
    boardPath: z.string().trim().min(1).nullable().optional(),
    readyForReviewNotificationsEnabled: z.boolean().optional(),
    commitPromptTemplate: z.string().optional(),
    openPrPromptTemplate: z.string().optional(),
});
export const runtimeTaskSessionStartRequestSchema = z.object({
    taskId: z.string(),
    prompt: z.string(),
    /** Display title from the Kanban task card. Propagated to SDK session metadata as a convenience copy. */
    taskTitle: z.string().optional(),
    images: z.array(runtimeTaskImageSchema).optional(),
    startInPlanMode: z.boolean().optional(),
    mode: runtimeTaskSessionModeSchema.optional(),
    resumeFromTrash: z.boolean().optional(),
    baseRef: z.string(),
    cols: z.number().int().positive().optional(),
    rows: z.number().int().positive().optional(),
    agentId: runtimeAgentIdSchema.optional(),
    clineSettings: runtimeTaskClineSettingsSchema.optional(),
});
export const runtimeTaskSessionStartResponseSchema = z.object({
    ok: z.boolean(),
    summary: runtimeTaskSessionSummarySchema.nullable(),
    error: z.string().optional(),
});
export const runtimeTaskSessionStopRequestSchema = z.object({
    taskId: z.string(),
});
export const runtimeTaskSessionStopResponseSchema = z.object({
    ok: z.boolean(),
    summary: runtimeTaskSessionSummarySchema.nullable(),
    error: z.string().optional(),
});
export const runtimeTaskSessionInputRequestSchema = z.object({
    taskId: z.string(),
    text: z.string(),
    appendNewline: z.boolean().optional(),
});
export const runtimeTaskSessionInputResponseSchema = z.object({
    ok: z.boolean(),
    summary: runtimeTaskSessionSummarySchema.nullable(),
    error: z.string().optional(),
});
export const runtimeTaskChatMessageSchema = z.object({
    id: z.string(),
    role: z.enum(["user", "assistant", "system", "tool", "reasoning", "status"]),
    content: z.string(),
    images: z.array(runtimeTaskImageSchema).optional(),
    createdAt: z.number(),
    meta: z
        .object({
        toolName: z.string().nullable().optional(),
        hookEventName: z.string().nullable().optional(),
        toolCallId: z.string().nullable().optional(),
        streamType: z.string().nullable().optional(),
        messageKind: z.string().nullable().optional(),
        displayRole: z.string().nullable().optional(),
        reason: z.string().nullable().optional(),
    })
        .nullable()
        .optional(),
});
export const runtimeTaskChatMessagesRequestSchema = z.object({
    taskId: z.string(),
});
export const runtimeTaskChatMessagesResponseSchema = z.object({
    ok: z.boolean(),
    messages: z.array(runtimeTaskChatMessageSchema),
    error: z.string().optional(),
});
export const runtimeTaskChatSendRequestSchema = z.object({
    taskId: z.string(),
    text: z.string(),
    images: z.array(runtimeTaskImageSchema).optional(),
    mode: runtimeTaskSessionModeSchema.optional(),
});
export const runtimeTaskChatSendResponseSchema = z.object({
    ok: z.boolean(),
    summary: runtimeTaskSessionSummarySchema.nullable(),
    message: runtimeTaskChatMessageSchema.nullable().optional(),
    error: z.string().optional(),
});
export const runtimeTaskChatReloadRequestSchema = z.object({
    taskId: z.string(),
});
export const runtimeTaskChatReloadResponseSchema = z.object({
    ok: z.boolean(),
    summary: runtimeTaskSessionSummarySchema.nullable(),
    error: z.string().optional(),
});
export const runtimeTaskChatAbortRequestSchema = z.object({
    taskId: z.string(),
});
export const runtimeTaskChatAbortResponseSchema = z.object({
    ok: z.boolean(),
    summary: runtimeTaskSessionSummarySchema.nullable(),
    error: z.string().optional(),
});
export const runtimeTaskChatCancelRequestSchema = z.object({
    taskId: z.string(),
});
export const runtimeTaskChatCancelResponseSchema = z.object({
    ok: z.boolean(),
    summary: runtimeTaskSessionSummarySchema.nullable(),
    error: z.string().optional(),
});
export const runtimeShellSessionStartRequestSchema = z.object({
    taskId: z.string(),
    cols: z.number().int().positive().optional(),
    rows: z.number().int().positive().optional(),
    workspaceTaskId: z.string().optional(),
    baseRef: z.string(),
});
export const runtimeShellSessionStartResponseSchema = z.object({
    ok: z.boolean(),
    summary: runtimeTaskSessionSummarySchema.nullable(),
    shellBinary: z.string().nullable().optional(),
    error: z.string().optional(),
});
export const runtimeTerminalWsResizeMessageSchema = z.object({
    type: z.literal("resize"),
    cols: z.number().int().positive(),
    rows: z.number().int().positive(),
    pixelWidth: z.number().int().positive().optional(),
    pixelHeight: z.number().int().positive().optional(),
});
export const runtimeTerminalWsStopMessageSchema = z.object({
    type: z.literal("stop"),
});
export const runtimeTerminalWsOutputAckMessageSchema = z.object({
    type: z.literal("output_ack"),
    bytes: z.number().int().nonnegative(),
});
export const runtimeTerminalWsRestoreCompleteMessageSchema = z.object({
    type: z.literal("restore_complete"),
});
export const runtimeTerminalWsClientMessageSchema = z.discriminatedUnion("type", [
    runtimeTerminalWsResizeMessageSchema,
    runtimeTerminalWsStopMessageSchema,
    runtimeTerminalWsOutputAckMessageSchema,
    runtimeTerminalWsRestoreCompleteMessageSchema,
]);
export const runtimeTerminalWsStateMessageSchema = z.object({
    type: z.literal("state"),
    summary: runtimeTaskSessionSummarySchema,
});
export const runtimeTerminalWsErrorMessageSchema = z.object({
    type: z.literal("error"),
    message: z.string(),
});
export const runtimeTerminalWsExitMessageSchema = z.object({
    type: z.literal("exit"),
    code: z.number().nullable(),
});
export const runtimeTerminalWsRestoreMessageSchema = z.object({
    type: z.literal("restore"),
    snapshot: z.string(),
    cols: z.number().int().positive().nullable().optional(),
    rows: z.number().int().positive().nullable().optional(),
});
export const runtimeTerminalWsServerMessageSchema = z.discriminatedUnion("type", [
    runtimeTerminalWsStateMessageSchema,
    runtimeTerminalWsErrorMessageSchema,
    runtimeTerminalWsExitMessageSchema,
    runtimeTerminalWsRestoreMessageSchema,
]);
export const runtimeGitCommitSchema = z.object({
    hash: z.string(),
    shortHash: z.string(),
    authorName: z.string(),
    authorEmail: z.string(),
    date: z.string(),
    message: z.string(),
    parentHashes: z.array(z.string()),
    relation: z.enum(["selected", "upstream", "shared"]).optional(),
});
export const runtimeGitRefSchema = z.object({
    name: z.string(),
    type: z.enum(["branch", "remote", "detached"]),
    hash: z.string(),
    isHead: z.boolean(),
    upstreamName: z.string().optional(),
    ahead: z.number().optional(),
    behind: z.number().optional(),
});
export const runtimeGitLogRequestSchema = z.object({
    ref: z.string().nullable().optional(),
    refs: z.array(z.string()).optional(),
    maxCount: z.number().int().positive().optional(),
    skip: z.number().int().nonnegative().optional(),
    taskScope: runtimeTaskWorkspaceInfoRequestSchema.nullable().optional(),
});
export const runtimeGitLogResponseSchema = z.object({
    ok: z.boolean(),
    commits: z.array(runtimeGitCommitSchema),
    totalCount: z.number(),
    error: z.string().optional(),
});
export const runtimeGitCommitDiffFileSchema = z.object({
    path: z.string(),
    previousPath: z.string().optional(),
    status: z.enum(["modified", "added", "deleted", "renamed"]),
    additions: z.number(),
    deletions: z.number(),
    patch: z.string(),
});
export const runtimeGitCommitDiffRequestSchema = z.object({
    commitHash: z.string(),
    taskScope: runtimeTaskWorkspaceInfoRequestSchema.nullable().optional(),
});
export const runtimeGitCommitDiffResponseSchema = z.object({
    ok: z.boolean(),
    commitHash: z.string(),
    files: z.array(runtimeGitCommitDiffFileSchema),
    error: z.string().optional(),
});
export const runtimeGitRefsResponseSchema = z.object({
    ok: z.boolean(),
    refs: z.array(runtimeGitRefSchema),
    error: z.string().optional(),
});
export const runtimeHookEventSchema = z.enum(["to_review", "to_in_progress", "activity"]);
export const runtimeHookIngestRequestSchema = z.object({
    taskId: z.string(),
    workspaceId: z.string(),
    event: runtimeHookEventSchema,
    metadata: runtimeTaskHookActivitySchema.partial().optional(),
});
export const runtimeHookIngestResponseSchema = z.object({
    ok: z.boolean(),
    error: z.string().optional(),
});
