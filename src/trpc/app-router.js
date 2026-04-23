import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";
import { runtimeClineAccountBalanceResponseSchema, runtimeClineAccountOrganizationsResponseSchema, runtimeClineAccountProfileResponseSchema, runtimeClineAccountSwitchRequestSchema, runtimeClineAccountSwitchResponseSchema, runtimeClineAddProviderRequestSchema, runtimeClineAddProviderResponseSchema, runtimeClineDeviceAuthCompleteRequestSchema, runtimeClineDeviceAuthCompleteResponseSchema, runtimeClineDeviceAuthStartResponseSchema, runtimeClineKanbanAccessResponseSchema, runtimeClineMcpAuthStatusResponseSchema, runtimeClineMcpOAuthRequestSchema, runtimeClineMcpOAuthResponseSchema, runtimeClineMcpSettingsResponseSchema, runtimeClineMcpSettingsSaveRequestSchema, runtimeClineMcpSettingsSaveResponseSchema, runtimeClineOauthLoginRequestSchema, runtimeClineOauthLoginResponseSchema, runtimeClineProviderCatalogResponseSchema, runtimeClineProviderModelsRequestSchema, runtimeClineProviderModelsResponseSchema, runtimeClineProviderSettingsSaveRequestSchema, runtimeClineProviderSettingsSaveResponseSchema, runtimeClineUpdateProviderRequestSchema, runtimeClineUpdateProviderResponseSchema, runtimeCommandRunRequestSchema, runtimeCommandRunResponseSchema, runtimeConfigResponseSchema, runtimeConfigSaveRequestSchema, runtimeDebugResetAllStateResponseSchema, runtimeDirectoryListRequestSchema, runtimeDirectoryListResponseSchema, runtimeFeaturebaseTokenResponseSchema, runtimeGitCheckoutRequestSchema, runtimeGitCheckoutResponseSchema, runtimeGitCommitDiffRequestSchema, runtimeGitCommitDiffResponseSchema, runtimeGitDiscardResponseSchema, runtimeGitLogRequestSchema, runtimeGitLogResponseSchema, runtimeGitRefsResponseSchema, runtimeGitSummaryResponseSchema, runtimeGitSyncActionSchema, runtimeGitSyncResponseSchema, runtimeHookIngestRequestSchema, runtimeHookIngestResponseSchema, runtimeOpenFileRequestSchema, runtimeOpenFileResponseSchema, runtimeProjectAddRequestSchema, runtimeProjectAddResponseSchema, runtimeProjectDirectoryPickerResponseSchema, runtimeProjectRemoveRequestSchema, runtimeProjectRemoveResponseSchema, runtimeProjectsResponseSchema, runtimeShellSessionStartRequestSchema, runtimeShellSessionStartResponseSchema, runtimeSlashCommandsResponseSchema, runtimeTaskChatAbortRequestSchema, runtimeTaskChatAbortResponseSchema, runtimeTaskChatCancelRequestSchema, runtimeTaskChatCancelResponseSchema, runtimeTaskChatMessagesRequestSchema, runtimeTaskChatMessagesResponseSchema, runtimeTaskChatReloadRequestSchema, runtimeTaskChatReloadResponseSchema, runtimeTaskChatSendRequestSchema, runtimeTaskChatSendResponseSchema, runtimeTaskImportRequestSchema, runtimeTaskImportResponseSchema, runtimeTaskSessionInputRequestSchema, runtimeTaskSessionInputResponseSchema, runtimeTaskSessionStartRequestSchema, runtimeTaskSessionStartResponseSchema, runtimeTaskSessionStopRequestSchema, runtimeTaskSessionStopResponseSchema, runtimeTaskWorkspaceInfoRequestSchema, runtimeTaskWorkspaceInfoResponseSchema, runtimeWorkspaceChangesRequestSchema, runtimeWorkspaceChangesResponseSchema, runtimeWorkspaceFileSearchRequestSchema, runtimeWorkspaceFileSearchResponseSchema, runtimeWorkspaceStateNotifyResponseSchema, runtimeWorkspaceStateResponseSchema, runtimeWorkspaceStateSaveRequestSchema, runtimeWorktreeDeleteRequestSchema, runtimeWorktreeDeleteResponseSchema, runtimeWorktreeEnsureRequestSchema, runtimeWorktreeEnsureResponseSchema, } from "../core/api-contract";
function readConflictRevision(cause) {
    if (!cause || typeof cause !== "object" || !("currentRevision" in cause)) {
        return null;
    }
    const revision = cause.currentRevision;
    if (typeof revision !== "number") {
        return null;
    }
    return Number.isFinite(revision) ? revision : null;
}
const t = initTRPC.context().create({
    errorFormatter({ shape, error }) {
        const conflictRevision = error.code === "CONFLICT" ? readConflictRevision(error.cause) : null;
        return {
            ...shape,
            data: {
                ...shape.data,
                conflictRevision,
            },
        };
    },
});
const workspaceProcedure = t.procedure.use(({ ctx, next }) => {
    if (!ctx.requestedWorkspaceId) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Missing workspace scope. Include x-kanban-workspace-id header or workspaceId query parameter.",
        });
    }
    if (!ctx.workspaceScope) {
        throw new TRPCError({
            code: "NOT_FOUND",
            message: `Unknown workspace ID: ${ctx.requestedWorkspaceId}`,
        });
    }
    return next({
        ctx: {
            ...ctx,
            workspaceScope: ctx.workspaceScope,
        },
    });
});
const optionalTaskWorkspaceInfoRequestSchema = runtimeTaskWorkspaceInfoRequestSchema.nullable().optional();
const gitSyncActionInputSchema = z.object({
    action: runtimeGitSyncActionSchema,
});
export const runtimeAppRouter = t.router({
    runtime: t.router({
        getConfig: t.procedure.output(runtimeConfigResponseSchema).query(async ({ ctx }) => {
            return await ctx.runtimeApi.loadConfig(ctx.workspaceScope);
        }),
        saveConfig: t.procedure
            .input(runtimeConfigSaveRequestSchema)
            .output(runtimeConfigResponseSchema)
            .mutation(async ({ ctx, input }) => {
            return await ctx.runtimeApi.saveConfig(ctx.workspaceScope, input);
        }),
        saveClineProviderSettings: t.procedure
            .input(runtimeClineProviderSettingsSaveRequestSchema)
            .output(runtimeClineProviderSettingsSaveResponseSchema)
            .mutation(async ({ ctx, input }) => {
            return await ctx.runtimeApi.saveClineProviderSettings(ctx.workspaceScope, input);
        }),
        addClineProvider: t.procedure
            .input(runtimeClineAddProviderRequestSchema)
            .output(runtimeClineAddProviderResponseSchema)
            .mutation(async ({ ctx, input }) => {
            return await ctx.runtimeApi.addClineProvider(ctx.workspaceScope, input);
        }),
        updateClineProvider: t.procedure
            .input(runtimeClineUpdateProviderRequestSchema)
            .output(runtimeClineUpdateProviderResponseSchema)
            .mutation(async ({ ctx, input }) => {
            return await ctx.runtimeApi.updateClineProvider(ctx.workspaceScope, input);
        }),
        startTaskSession: workspaceProcedure
            .input(runtimeTaskSessionStartRequestSchema)
            .output(runtimeTaskSessionStartResponseSchema)
            .mutation(async ({ ctx, input }) => {
            return await ctx.runtimeApi.startTaskSession(ctx.workspaceScope, input);
        }),
        stopTaskSession: workspaceProcedure
            .input(runtimeTaskSessionStopRequestSchema)
            .output(runtimeTaskSessionStopResponseSchema)
            .mutation(async ({ ctx, input }) => {
            return await ctx.runtimeApi.stopTaskSession(ctx.workspaceScope, input);
        }),
        sendTaskSessionInput: workspaceProcedure
            .input(runtimeTaskSessionInputRequestSchema)
            .output(runtimeTaskSessionInputResponseSchema)
            .mutation(async ({ ctx, input }) => {
            return await ctx.runtimeApi.sendTaskSessionInput(ctx.workspaceScope, input);
        }),
        getTaskChatMessages: workspaceProcedure
            .input(runtimeTaskChatMessagesRequestSchema)
            .output(runtimeTaskChatMessagesResponseSchema)
            .query(async ({ ctx, input }) => {
            return await ctx.runtimeApi.getTaskChatMessages(ctx.workspaceScope, input);
        }),
        getClineSlashCommands: t.procedure.output(runtimeSlashCommandsResponseSchema).query(async ({ ctx }) => {
            return await ctx.runtimeApi.getClineSlashCommands(ctx.workspaceScope);
        }),
        reloadTaskChatSession: workspaceProcedure
            .input(runtimeTaskChatReloadRequestSchema)
            .output(runtimeTaskChatReloadResponseSchema)
            .mutation(async ({ ctx, input }) => {
            return await ctx.runtimeApi.reloadTaskChatSession(ctx.workspaceScope, input);
        }),
        sendTaskChatMessage: workspaceProcedure
            .input(runtimeTaskChatSendRequestSchema)
            .output(runtimeTaskChatSendResponseSchema)
            .mutation(async ({ ctx, input }) => {
            return await ctx.runtimeApi.sendTaskChatMessage(ctx.workspaceScope, input);
        }),
        abortTaskChatTurn: workspaceProcedure
            .input(runtimeTaskChatAbortRequestSchema)
            .output(runtimeTaskChatAbortResponseSchema)
            .mutation(async ({ ctx, input }) => {
            return await ctx.runtimeApi.abortTaskChatTurn(ctx.workspaceScope, input);
        }),
        cancelTaskChatTurn: workspaceProcedure
            .input(runtimeTaskChatCancelRequestSchema)
            .output(runtimeTaskChatCancelResponseSchema)
            .mutation(async ({ ctx, input }) => {
            return await ctx.runtimeApi.cancelTaskChatTurn(ctx.workspaceScope, input);
        }),
        getClineProviderCatalog: t.procedure.output(runtimeClineProviderCatalogResponseSchema).query(async ({ ctx }) => {
            return await ctx.runtimeApi.getClineProviderCatalog(ctx.workspaceScope);
        }),
        getClineAccountProfile: t.procedure.output(runtimeClineAccountProfileResponseSchema).query(async ({ ctx }) => {
            return await ctx.runtimeApi.getClineAccountProfile(ctx.workspaceScope);
        }),
        getClineKanbanAccess: t.procedure.output(runtimeClineKanbanAccessResponseSchema).query(async ({ ctx }) => {
            return await ctx.runtimeApi.getClineKanbanAccess(ctx.workspaceScope);
        }),
        getFeaturebaseToken: t.procedure.output(runtimeFeaturebaseTokenResponseSchema).query(async ({ ctx }) => {
            return await ctx.runtimeApi.getFeaturebaseToken(ctx.workspaceScope);
        }),
        getClineAccountBalance: t.procedure.output(runtimeClineAccountBalanceResponseSchema).query(async ({ ctx }) => {
            return await ctx.runtimeApi.getClineAccountBalance(ctx.workspaceScope);
        }),
        getClineAccountOrganizations: t.procedure
            .output(runtimeClineAccountOrganizationsResponseSchema)
            .query(async ({ ctx }) => {
            return await ctx.runtimeApi.getClineAccountOrganizations(ctx.workspaceScope);
        }),
        switchClineAccount: t.procedure
            .input(runtimeClineAccountSwitchRequestSchema)
            .output(runtimeClineAccountSwitchResponseSchema)
            .mutation(async ({ ctx, input }) => {
            return await ctx.runtimeApi.switchClineAccount(ctx.workspaceScope, input);
        }),
        getClineProviderModels: t.procedure
            .input(runtimeClineProviderModelsRequestSchema)
            .output(runtimeClineProviderModelsResponseSchema)
            .query(async ({ ctx, input }) => {
            return await ctx.runtimeApi.getClineProviderModels(ctx.workspaceScope, input);
        }),
        getClineMcpAuthStatuses: t.procedure.output(runtimeClineMcpAuthStatusResponseSchema).query(async ({ ctx }) => {
            return await ctx.runtimeApi.getClineMcpAuthStatuses(ctx.workspaceScope);
        }),
        runClineMcpServerOAuth: t.procedure
            .input(runtimeClineMcpOAuthRequestSchema)
            .output(runtimeClineMcpOAuthResponseSchema)
            .mutation(async ({ ctx, input }) => {
            return await ctx.runtimeApi.runClineMcpServerOAuth(ctx.workspaceScope, input);
        }),
        getClineMcpSettings: t.procedure.output(runtimeClineMcpSettingsResponseSchema).query(async ({ ctx }) => {
            return await ctx.runtimeApi.getClineMcpSettings(ctx.workspaceScope);
        }),
        saveClineMcpSettings: t.procedure
            .input(runtimeClineMcpSettingsSaveRequestSchema)
            .output(runtimeClineMcpSettingsSaveResponseSchema)
            .mutation(async ({ ctx, input }) => {
            return await ctx.runtimeApi.saveClineMcpSettings(ctx.workspaceScope, input);
        }),
        runClineProviderOAuthLogin: t.procedure
            .input(runtimeClineOauthLoginRequestSchema)
            .output(runtimeClineOauthLoginResponseSchema)
            .mutation(async ({ ctx, input }) => {
            return await ctx.runtimeApi.runClineProviderOAuthLogin(ctx.workspaceScope, input);
        }),
        startClineDeviceAuth: t.procedure.output(runtimeClineDeviceAuthStartResponseSchema).mutation(async ({ ctx }) => {
            return await ctx.runtimeApi.startClineDeviceAuth(ctx.workspaceScope);
        }),
        completeClineDeviceAuth: t.procedure
            .input(runtimeClineDeviceAuthCompleteRequestSchema)
            .output(runtimeClineDeviceAuthCompleteResponseSchema)
            .mutation(async ({ ctx, input }) => {
            return await ctx.runtimeApi.completeClineDeviceAuth(ctx.workspaceScope, input);
        }),
        startShellSession: workspaceProcedure
            .input(runtimeShellSessionStartRequestSchema)
            .output(runtimeShellSessionStartResponseSchema)
            .mutation(async ({ ctx, input }) => {
            return await ctx.runtimeApi.startShellSession(ctx.workspaceScope, input);
        }),
        runCommand: workspaceProcedure
            .input(runtimeCommandRunRequestSchema)
            .output(runtimeCommandRunResponseSchema)
            .mutation(async ({ ctx, input }) => {
            return await ctx.runtimeApi.runCommand(ctx.workspaceScope, input);
        }),
        resetAllState: t.procedure.output(runtimeDebugResetAllStateResponseSchema).mutation(async ({ ctx }) => {
            return await ctx.runtimeApi.resetAllState(ctx.workspaceScope);
        }),
        openFile: t.procedure
            .input(runtimeOpenFileRequestSchema)
            .output(runtimeOpenFileResponseSchema)
            .mutation(async ({ ctx, input }) => {
            return await ctx.runtimeApi.openFile(input);
        }),
    }),
    workspace: t.router({
        getGitSummary: workspaceProcedure
            .input(optionalTaskWorkspaceInfoRequestSchema)
            .output(runtimeGitSummaryResponseSchema)
            .query(async ({ ctx, input }) => {
            return await ctx.workspaceApi.loadGitSummary(ctx.workspaceScope, input ?? null);
        }),
        runGitSyncAction: workspaceProcedure
            .input(gitSyncActionInputSchema)
            .output(runtimeGitSyncResponseSchema)
            .mutation(async ({ ctx, input }) => {
            return await ctx.workspaceApi.runGitSyncAction(ctx.workspaceScope, input);
        }),
        checkoutGitBranch: workspaceProcedure
            .input(runtimeGitCheckoutRequestSchema)
            .output(runtimeGitCheckoutResponseSchema)
            .mutation(async ({ ctx, input }) => {
            return await ctx.workspaceApi.checkoutGitBranch(ctx.workspaceScope, input);
        }),
        discardGitChanges: workspaceProcedure
            .input(optionalTaskWorkspaceInfoRequestSchema)
            .output(runtimeGitDiscardResponseSchema)
            .mutation(async ({ ctx, input }) => {
            return await ctx.workspaceApi.discardGitChanges(ctx.workspaceScope, input ?? null);
        }),
        getChanges: workspaceProcedure
            .input(runtimeWorkspaceChangesRequestSchema)
            .output(runtimeWorkspaceChangesResponseSchema)
            .query(async ({ ctx, input }) => {
            return await ctx.workspaceApi.loadChanges(ctx.workspaceScope, input);
        }),
        ensureWorktree: workspaceProcedure
            .input(runtimeWorktreeEnsureRequestSchema)
            .output(runtimeWorktreeEnsureResponseSchema)
            .mutation(async ({ ctx, input }) => {
            return await ctx.workspaceApi.ensureWorktree(ctx.workspaceScope, input);
        }),
        deleteWorktree: workspaceProcedure
            .input(runtimeWorktreeDeleteRequestSchema)
            .output(runtimeWorktreeDeleteResponseSchema)
            .mutation(async ({ ctx, input }) => {
            return await ctx.workspaceApi.deleteWorktree(ctx.workspaceScope, input);
        }),
        getTaskContext: workspaceProcedure
            .input(runtimeTaskWorkspaceInfoRequestSchema)
            .output(runtimeTaskWorkspaceInfoResponseSchema)
            .query(async ({ ctx, input }) => {
            return await ctx.workspaceApi.loadTaskContext(ctx.workspaceScope, input);
        }),
        searchFiles: workspaceProcedure
            .input(runtimeWorkspaceFileSearchRequestSchema)
            .output(runtimeWorkspaceFileSearchResponseSchema)
            .query(async ({ ctx, input }) => {
            return await ctx.workspaceApi.searchFiles(ctx.workspaceScope, input);
        }),
        importTasks: workspaceProcedure
            .input(runtimeTaskImportRequestSchema)
            .output(runtimeTaskImportResponseSchema)
            .mutation(async ({ ctx, input }) => {
            return await ctx.workspaceApi.importTasks(ctx.workspaceScope, input);
        }),
        getState: workspaceProcedure.output(runtimeWorkspaceStateResponseSchema).query(async ({ ctx }) => {
            return await ctx.workspaceApi.loadState(ctx.workspaceScope);
        }),
        notifyStateUpdated: workspaceProcedure
            .output(runtimeWorkspaceStateNotifyResponseSchema)
            .mutation(async ({ ctx }) => {
            return await ctx.workspaceApi.notifyStateUpdated(ctx.workspaceScope);
        }),
        saveState: workspaceProcedure
            .input(runtimeWorkspaceStateSaveRequestSchema)
            .output(runtimeWorkspaceStateResponseSchema)
            .mutation(async ({ ctx, input }) => {
            return await ctx.workspaceApi.saveState(ctx.workspaceScope, input);
        }),
        getWorkspaceChanges: workspaceProcedure.output(runtimeWorkspaceChangesResponseSchema).query(async ({ ctx }) => {
            return await ctx.workspaceApi.loadWorkspaceChanges(ctx.workspaceScope);
        }),
        getGitLog: workspaceProcedure
            .input(runtimeGitLogRequestSchema)
            .output(runtimeGitLogResponseSchema)
            .query(async ({ ctx, input }) => {
            return await ctx.workspaceApi.loadGitLog(ctx.workspaceScope, input);
        }),
        getGitRefs: workspaceProcedure
            .input(optionalTaskWorkspaceInfoRequestSchema)
            .output(runtimeGitRefsResponseSchema)
            .query(async ({ ctx, input }) => {
            return await ctx.workspaceApi.loadGitRefs(ctx.workspaceScope, input ?? null);
        }),
        getCommitDiff: workspaceProcedure
            .input(runtimeGitCommitDiffRequestSchema)
            .output(runtimeGitCommitDiffResponseSchema)
            .query(async ({ ctx, input }) => {
            return await ctx.workspaceApi.loadCommitDiff(ctx.workspaceScope, input);
        }),
    }),
    projects: t.router({
        list: t.procedure.output(runtimeProjectsResponseSchema).query(async ({ ctx }) => {
            return await ctx.projectsApi.listProjects(ctx.requestedWorkspaceId);
        }),
        add: t.procedure
            .input(runtimeProjectAddRequestSchema)
            .output(runtimeProjectAddResponseSchema)
            .mutation(async ({ ctx, input }) => {
            return await ctx.projectsApi.addProject(ctx.requestedWorkspaceId, input);
        }),
        remove: t.procedure
            .input(runtimeProjectRemoveRequestSchema)
            .output(runtimeProjectRemoveResponseSchema)
            .mutation(async ({ ctx, input }) => {
            return await ctx.projectsApi.removeProject(ctx.requestedWorkspaceId, input);
        }),
        pickDirectory: t.procedure.output(runtimeProjectDirectoryPickerResponseSchema).mutation(async ({ ctx }) => {
            return await ctx.projectsApi.pickProjectDirectory(ctx.requestedWorkspaceId);
        }),
        listDirectoryContents: t.procedure
            .input(runtimeDirectoryListRequestSchema)
            .output(runtimeDirectoryListResponseSchema)
            .query(async ({ ctx, input }) => {
            return await ctx.projectsApi.listDirectoryContents(ctx.requestedWorkspaceId, input);
        }),
    }),
    hooks: t.router({
        ingest: t.procedure
            .input(runtimeHookIngestRequestSchema)
            .output(runtimeHookIngestResponseSchema)
            .mutation(async ({ ctx, input }) => {
            return await ctx.hooksApi.ingest(input);
        }),
    }),
});
