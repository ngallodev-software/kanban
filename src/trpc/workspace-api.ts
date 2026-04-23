import { TRPCError } from "@trpc/server";
import type { ClineTaskSessionService } from "../cline-sdk/cline-task-session-service";
import type {
	RuntimeBoardCard,
	RuntimeBoardColumnId,
	RuntimeBoardData,
	RuntimeGitCheckoutResponse,
	RuntimeGitDiscardResponse,
	RuntimeGitSummaryResponse,
	RuntimeGitSyncAction,
	RuntimeGitSyncResponse,
	RuntimeTaskClineSettings,
	RuntimeTaskImage,
	RuntimeTaskImportRequest,
	RuntimeTaskImportResponse,
	RuntimeTaskImportTask,
	RuntimeTaskSessionStartResponse,
	RuntimeTaskSessionSummary,
	RuntimeWorkspaceChangesMode,
	RuntimeWorkspaceFileSearchResponse,
	RuntimeWorkspaceStateResponse,
} from "../core/api-contract";
import {
	parseGitCheckoutRequest,
	parseTaskImportRequest,
	parseWorktreeDeleteRequest,
	parseWorktreeEnsureRequest,
} from "../core/api-validation";
import { addTaskDependency, addTaskToColumn, getTaskColumnId, moveTaskToColumn } from "../core/task-board-mutations";
import { resolveTaskTitle } from "../core/task-title";
import { mutateWorkspaceState, saveWorkspaceState, WorkspaceStateConflictError } from "../state/workspace-state";
import type { TerminalSessionManager } from "../terminal/session-manager";
import {
	createEmptyWorkspaceChangesResponse,
	getWorkspaceChanges,
	getWorkspaceChangesBetweenRefs,
	getWorkspaceChangesFromRef,
} from "../workspace/get-workspace-changes";
import { getCommitDiff, getGitLog, getGitRefs } from "../workspace/git-history";
import { discardGitChanges, getGitSyncSummary, runGitCheckoutAction, runGitSyncAction } from "../workspace/git-sync";
import { searchWorkspaceFiles } from "../workspace/search-workspace-files";
import {
	deleteTaskWorktree,
	ensureTaskWorktreeIfDoesntExist,
	getTaskWorkspaceInfo,
	resolveTaskCwd,
} from "../workspace/task-worktree";
import type { RuntimeTrpcContext } from "./app-router";

export interface CreateWorkspaceApiDependencies {
	ensureTerminalManagerForWorkspace: (workspaceId: string, repoPath: string) => Promise<TerminalSessionManager>;
	getScopedClineTaskSessionService: (scope: {
		workspaceId: string;
		workspacePath: string;
	}) => Promise<ClineTaskSessionService>;
	broadcastRuntimeWorkspaceStateUpdated: (workspaceId: string, workspacePath: string) => Promise<void> | void;
	broadcastRuntimeProjectsUpdated: (preferredCurrentProjectId: string | null) => Promise<void> | void;
	buildWorkspaceStateSnapshot: (workspaceId: string, workspacePath: string) => Promise<RuntimeWorkspaceStateResponse>;
	startTaskSession?: (
		scope: { workspaceId: string; workspacePath: string },
		input: {
			taskId: string;
			prompt: string;
			taskTitle?: string;
			images?: RuntimeTaskImage[];
			startInPlanMode?: boolean;
			baseRef: string;
			agentId?: RuntimeBoardCard["agentId"];
			clineSettings?: RuntimeTaskClineSettings;
		},
	) => Promise<RuntimeTaskSessionStartResponse>;
}

interface NormalizedImportTaskIntent {
	externalTaskKey: string;
	title?: string;
	prompt: string;
	startInPlanMode: boolean;
	autoReviewEnabled: boolean;
	autoReviewMode: "commit" | "pr" | "move_to_trash";
	images?: RuntimeTaskImage[];
	agentId?: RuntimeBoardCard["agentId"];
	clineSettings?: RuntimeTaskClineSettings;
	baseRef: string;
}

function normalizeImportTaskIntent(
	task: RuntimeTaskImportTask,
	state: RuntimeWorkspaceStateResponse,
): NormalizedImportTaskIntent {
	const baseRef =
		task.baseRef?.trim() ?? state.git.currentBranch ?? state.git.defaultBranch ?? state.git.branches[0] ?? "";
	if (!baseRef) {
		throw new Error(
			`Imported task "${task.externalTaskKey}" requires baseRef because no workspace default branch is available.`,
		);
	}
	return {
		externalTaskKey: task.externalTaskKey,
		...(task.title ? { title: task.title } : {}),
		prompt: task.prompt,
		startInPlanMode: Boolean(task.startInPlanMode),
		autoReviewEnabled: Boolean(task.autoReviewEnabled),
		autoReviewMode: task.autoReviewMode ?? "commit",
		...(task.images && task.images.length > 0 ? { images: task.images.map((image) => ({ ...image })) } : {}),
		...(task.agentId ? { agentId: task.agentId } : {}),
		...(task.clineSettings ? { clineSettings: { ...task.clineSettings } } : {}),
		baseRef,
	};
}

function normalizeTaskImages(images?: RuntimeTaskImage[]): RuntimeTaskImage[] {
	return images?.map((image) => ({ ...image })) ?? [];
}

function normalizeTaskClineSettings(settings?: RuntimeTaskClineSettings): RuntimeTaskClineSettings | null {
	if (!settings) {
		return null;
	}
	const providerId = settings.providerId?.trim();
	const modelId = settings.modelId?.trim();
	return {
		...(providerId ? { providerId } : {}),
		...(modelId ? { modelId } : {}),
		...(settings.reasoningEffort ? { reasoningEffort: settings.reasoningEffort } : {}),
	};
}

function areImagesEqual(left?: RuntimeTaskImage[], right?: RuntimeTaskImage[]): boolean {
	const leftImages = normalizeTaskImages(left);
	const rightImages = normalizeTaskImages(right);
	if (leftImages.length !== rightImages.length) {
		return false;
	}
	return leftImages.every((image, index) => {
		const other = rightImages[index];
		return (
			other !== undefined &&
			image.id === other.id &&
			image.data === other.data &&
			image.mimeType === other.mimeType &&
			image.name === other.name
		);
	});
}

function areTaskClineSettingsEqual(left?: RuntimeTaskClineSettings, right?: RuntimeTaskClineSettings): boolean {
	const normalizedLeft = normalizeTaskClineSettings(left);
	const normalizedRight = normalizeTaskClineSettings(right);
	if (normalizedLeft === null || normalizedRight === null) {
		return normalizedLeft === normalizedRight;
	}
	return (
		normalizedLeft.providerId === normalizedRight.providerId &&
		normalizedLeft.modelId === normalizedRight.modelId &&
		normalizedLeft.reasoningEffort === normalizedRight.reasoningEffort
	);
}

function findTaskRecordByExternalTaskKey(
	board: RuntimeBoardData,
	externalTaskKey: string,
): { task: RuntimeBoardCard; columnId: RuntimeBoardColumnId } | null {
	for (const column of board.columns) {
		const task = column.cards.find((card) => card.externalTaskKey === externalTaskKey);
		if (task) {
			return {
				task,
				columnId: column.id,
			};
		}
	}
	return null;
}

function isImportedTaskCompatible(existing: RuntimeBoardCard, incoming: NormalizedImportTaskIntent): boolean {
	return (
		existing.externalTaskKey === incoming.externalTaskKey &&
		existing.title === resolveTaskTitle(incoming.title, incoming.prompt) &&
		existing.prompt === incoming.prompt &&
		existing.startInPlanMode === incoming.startInPlanMode &&
		Boolean(existing.autoReviewEnabled) === incoming.autoReviewEnabled &&
		(existing.autoReviewMode ?? "commit") === incoming.autoReviewMode &&
		existing.baseRef === incoming.baseRef &&
		existing.agentId === incoming.agentId &&
		areTaskClineSettingsEqual(existing.clineSettings, incoming.clineSettings) &&
		areImagesEqual(existing.images, incoming.images)
	);
}

function findDependencyByEndpoints(
	board: RuntimeBoardData,
	fromTaskId: string,
	toTaskId: string,
): RuntimeBoardData["dependencies"][number] | null {
	return (
		board.dependencies.find(
			(dependency) => dependency.fromTaskId === fromTaskId && dependency.toTaskId === toTaskId,
		) ?? null
	);
}

function createTaskPairKey(firstTaskId: string, secondTaskId: string): string {
	return [firstTaskId, secondTaskId].sort().join("::");
}

function resolveImportDependencyPairKey(
	board: RuntimeBoardData,
	firstTaskId: string,
	secondTaskId: string,
): string | null {
	const firstColumnId = getTaskColumnId(board, firstTaskId);
	const secondColumnId = getTaskColumnId(board, secondTaskId);
	if (!firstColumnId || !secondColumnId || firstColumnId === "trash" || secondColumnId === "trash") {
		return null;
	}
	const firstIsBacklog = firstColumnId === "backlog";
	const secondIsBacklog = secondColumnId === "backlog";
	if (firstIsBacklog && secondIsBacklog) {
		return createTaskPairKey(firstTaskId, secondTaskId);
	}
	if (!firstIsBacklog && !secondIsBacklog) {
		return null;
	}
	return firstIsBacklog ? `${firstTaskId}::${secondTaskId}` : `${secondTaskId}::${firstTaskId}`;
}

function findImportReplayDependency(
	board: RuntimeBoardData,
	firstTaskId: string,
	secondTaskId: string,
): RuntimeBoardData["dependencies"][number] | null {
	const exact = findDependencyByEndpoints(board, firstTaskId, secondTaskId);
	if (exact) {
		return exact;
	}
	const pairKey = resolveImportDependencyPairKey(board, firstTaskId, secondTaskId);
	if (!pairKey) {
		return null;
	}
	for (const dependency of board.dependencies) {
		const dependencyPairKey = resolveImportDependencyPairKey(board, dependency.fromTaskId, dependency.toTaskId);
		if (dependencyPairKey === pairKey) {
			return dependency;
		}
	}
	return null;
}

function createImportFailure(
	version: RuntimeTaskImportRequest["version"],
	error: RuntimeTaskImportResponse["error"],
): RuntimeTaskImportResponse {
	return {
		version,
		ok: false,
		applied: false,
		taskMappings: [],
		linkResults: [],
		startResults: [],
		...(error ? { error } : {}),
	};
}

function normalizeOptionalTaskWorkspaceScopeInput(
	input: { taskId: string; baseRef: string } | null,
): { taskId: string; baseRef: string } | null {
	if (!input) {
		return null;
	}
	const taskId = input.taskId.trim();
	const baseRef = input.baseRef.trim();
	if (!taskId || !baseRef) {
		throw new Error("baseRef query parameter requires taskId.");
	}
	return {
		taskId,
		baseRef,
	};
}

function normalizeRequiredTaskWorkspaceScopeInput(input: {
	taskId: string;
	baseRef: string;
	mode?: RuntimeWorkspaceChangesMode;
}): {
	taskId: string;
	baseRef: string;
	mode: RuntimeWorkspaceChangesMode;
} {
	const taskId = input.taskId.trim();
	const baseRef = input.baseRef.trim();
	if (!taskId) {
		throw new Error("Missing taskId query parameter.");
	}
	if (!baseRef) {
		throw new Error("Missing baseRef query parameter.");
	}
	const mode: RuntimeWorkspaceChangesMode = input.mode ?? "working_copy";
	return {
		taskId,
		baseRef,
		mode,
	};
}

function isActiveTaskSessionState(summary: RuntimeTaskSessionSummary | null): boolean {
	return summary?.state === "running" || summary?.state === "awaiting_review";
}

function selectLastTurnSummary(
	terminalSummary: RuntimeTaskSessionSummary | null,
	clineSummary: RuntimeTaskSessionSummary | null,
): RuntimeTaskSessionSummary | null {
	if (!terminalSummary) {
		return clineSummary;
	}
	if (!clineSummary) {
		return terminalSummary;
	}
	const terminalIsActive = isActiveTaskSessionState(terminalSummary);
	const clineIsActive = isActiveTaskSessionState(clineSummary);
	if (terminalIsActive !== clineIsActive) {
		return clineIsActive ? clineSummary : terminalSummary;
	}
	if (terminalSummary.updatedAt !== clineSummary.updatedAt) {
		return terminalSummary.updatedAt > clineSummary.updatedAt ? terminalSummary : clineSummary;
	}
	if (clineSummary.agentId === "cline" && terminalSummary.agentId !== "cline") {
		return clineSummary;
	}
	return terminalSummary;
}

function createEmptyGitSummaryErrorResponse(error: unknown): RuntimeGitSummaryResponse {
	const message = error instanceof Error ? error.message : String(error);
	return {
		ok: false,
		summary: {
			currentBranch: null,
			upstreamBranch: null,
			changedFiles: 0,
			additions: 0,
			deletions: 0,
			aheadCount: 0,
			behindCount: 0,
		},
		error: message,
	};
}

function createEmptyGitSyncErrorResponse(action: RuntimeGitSyncAction, error: unknown): RuntimeGitSyncResponse {
	const message = error instanceof Error ? error.message : String(error);
	return {
		ok: false,
		action,
		summary: {
			currentBranch: null,
			upstreamBranch: null,
			changedFiles: 0,
			additions: 0,
			deletions: 0,
			aheadCount: 0,
			behindCount: 0,
		},
		output: "",
		error: message,
	};
}

function createEmptyGitCheckoutErrorResponse(error: unknown): RuntimeGitCheckoutResponse {
	const message = error instanceof Error ? error.message : String(error);
	return {
		ok: false,
		branch: "",
		summary: {
			currentBranch: null,
			upstreamBranch: null,
			changedFiles: 0,
			additions: 0,
			deletions: 0,
			aheadCount: 0,
			behindCount: 0,
		},
		output: "",
		error: message,
	};
}

function createEmptyGitDiscardErrorResponse(error: unknown): RuntimeGitDiscardResponse {
	const message = error instanceof Error ? error.message : String(error);
	return {
		ok: false,
		summary: {
			currentBranch: null,
			upstreamBranch: null,
			changedFiles: 0,
			additions: 0,
			deletions: 0,
			aheadCount: 0,
			behindCount: 0,
		},
		output: "",
		error: message,
	};
}

function isMissingTaskWorktreeError(error: unknown): boolean {
	if (!(error instanceof Error)) {
		return false;
	}
	return error.message.startsWith("Task worktree not found for task ");
}

export function createWorkspaceApi(deps: CreateWorkspaceApiDependencies): RuntimeTrpcContext["workspaceApi"] {
	async function startImportedTask(
		workspaceScope: { workspaceId: string; workspacePath: string },
		task: RuntimeBoardCard,
	): Promise<RuntimeTaskSessionStartResponse> {
		if (!deps.startTaskSession) {
			return {
				ok: false,
				summary: null,
				error: "Task start is not configured for workspace imports.",
			};
		}
		const ensured = await ensureTaskWorktreeIfDoesntExist({
			cwd: workspaceScope.workspacePath,
			taskId: task.id,
			baseRef: task.baseRef,
		});
		if (!ensured.ok) {
			return {
				ok: false,
				summary: null,
				error: ensured.error ?? "Could not ensure task worktree.",
			};
		}
		const started = await deps.startTaskSession(workspaceScope, {
			taskId: task.id,
			prompt: task.prompt,
			taskTitle: task.title,
			images: task.images,
			startInPlanMode: task.startInPlanMode,
			baseRef: task.baseRef,
			agentId: task.agentId,
			clineSettings: task.clineSettings,
		});
		if (!started.ok || !started.summary) {
			return started;
		}
		await mutateWorkspaceState(workspaceScope.workspacePath, (state) => {
			const movement = moveTaskToColumn(state.board, task.id, "in_progress");
			if (!movement.task) {
				return {
					board: state.board,
					value: null,
					save: false,
				};
			}
			if (!movement.moved) {
				return {
					board: state.board,
					value: movement.task,
					save: false,
				};
			}
			return {
				board: movement.board,
				value: movement.task,
			};
		});
		return started;
	}

	return {
		loadGitSummary: async (workspaceScope, input) => {
			try {
				const taskScope = normalizeOptionalTaskWorkspaceScopeInput(input);
				let summaryCwd = workspaceScope.workspacePath;
				if (taskScope) {
					summaryCwd = await resolveTaskCwd({
						cwd: workspaceScope.workspacePath,
						taskId: taskScope.taskId,
						baseRef: taskScope.baseRef,
						ensure: false,
					});
				}
				const summary = await getGitSyncSummary(summaryCwd);
				return {
					ok: true,
					summary,
				} satisfies RuntimeGitSummaryResponse;
			} catch (error) {
				return createEmptyGitSummaryErrorResponse(error);
			}
		},
		runGitSyncAction: async (workspaceScope, input) => {
			try {
				return await runGitSyncAction({
					cwd: workspaceScope.workspacePath,
					action: input.action,
				});
			} catch (error) {
				return createEmptyGitSyncErrorResponse(input.action, error);
			}
		},
		checkoutGitBranch: async (workspaceScope, input) => {
			try {
				const body = parseGitCheckoutRequest(input);
				const response = await runGitCheckoutAction({
					cwd: workspaceScope.workspacePath,
					branch: body.branch,
				});
				if (response.ok) {
					void deps.broadcastRuntimeWorkspaceStateUpdated(
						workspaceScope.workspaceId,
						workspaceScope.workspacePath,
					);
				}
				return response;
			} catch (error) {
				return createEmptyGitCheckoutErrorResponse(error);
			}
		},
		discardGitChanges: async (workspaceScope, input) => {
			try {
				const taskScope = normalizeOptionalTaskWorkspaceScopeInput(input);
				let discardCwd = workspaceScope.workspacePath;
				if (taskScope) {
					discardCwd = await resolveTaskCwd({
						cwd: workspaceScope.workspacePath,
						taskId: taskScope.taskId,
						baseRef: taskScope.baseRef,
						ensure: false,
					});
				}
				const response = await discardGitChanges({
					cwd: discardCwd,
				});
				if (response.ok) {
					void deps.broadcastRuntimeWorkspaceStateUpdated(
						workspaceScope.workspaceId,
						workspaceScope.workspacePath,
					);
				}
				return response;
			} catch (error) {
				return createEmptyGitDiscardErrorResponse(error);
			}
		},
		loadChanges: async (workspaceScope, input) => {
			const normalizedInput = normalizeRequiredTaskWorkspaceScopeInput(input);
			let taskCwd: string;
			try {
				taskCwd = await resolveTaskCwd({
					cwd: workspaceScope.workspacePath,
					taskId: normalizedInput.taskId,
					baseRef: normalizedInput.baseRef,
					ensure: false,
				});
			} catch (error) {
				if (!isMissingTaskWorktreeError(error)) {
					throw error;
				}
				return await createEmptyWorkspaceChangesResponse(workspaceScope.workspacePath);
			}
			if (normalizedInput.mode === "last_turn") {
				const terminalManager = await deps.ensureTerminalManagerForWorkspace(
					workspaceScope.workspaceId,
					workspaceScope.workspacePath,
				);
				const clineTaskSessionService = await deps.getScopedClineTaskSessionService(workspaceScope);
				const summary = selectLastTurnSummary(
					terminalManager.getSummary(normalizedInput.taskId),
					clineTaskSessionService.getSummary(normalizedInput.taskId),
				);
				const fromCheckpoint = summary?.previousTurnCheckpoint;
				const toCheckpoint = summary?.latestTurnCheckpoint;
				if (!toCheckpoint) {
					return await createEmptyWorkspaceChangesResponse(taskCwd);
				}
				if (summary?.state === "running" || !fromCheckpoint) {
					return await getWorkspaceChangesFromRef({
						cwd: taskCwd,
						fromRef: toCheckpoint.commit,
					});
				}
				return await getWorkspaceChangesBetweenRefs({
					cwd: taskCwd,
					fromRef: fromCheckpoint.commit,
					toRef: toCheckpoint.commit,
				});
			}
			return await getWorkspaceChanges(taskCwd);
		},
		ensureWorktree: async (workspaceScope, input) => {
			const body = parseWorktreeEnsureRequest(input);
			return await ensureTaskWorktreeIfDoesntExist({
				cwd: workspaceScope.workspacePath,
				taskId: body.taskId,
				baseRef: body.baseRef,
			});
		},
		deleteWorktree: async (workspaceScope, input) => {
			const body = parseWorktreeDeleteRequest(input);
			return await deleteTaskWorktree({
				repoPath: workspaceScope.workspacePath,
				taskId: body.taskId,
			});
		},
		loadTaskContext: async (workspaceScope, input) => {
			const normalizedInput = normalizeRequiredTaskWorkspaceScopeInput(input);
			return await getTaskWorkspaceInfo({
				cwd: workspaceScope.workspacePath,
				taskId: normalizedInput.taskId,
				baseRef: normalizedInput.baseRef,
			});
		},
		searchFiles: async (workspaceScope, input) => {
			const query = input.query.trim();
			const limit = input.limit;
			const files = await searchWorkspaceFiles(workspaceScope.workspacePath, query, limit);
			return {
				query,
				files,
			} satisfies RuntimeWorkspaceFileSearchResponse;
		},
		importTasks: async (workspaceScope, input) => {
			const body = parseTaskImportRequest(input);
			const mutation = await mutateWorkspaceState<RuntimeTaskImportResponse>(
				workspaceScope.workspacePath,
				(state) => {
					const seenTaskKeys = new Set<string>();
					for (const task of body.tasks) {
						if (seenTaskKeys.has(task.externalTaskKey)) {
							return {
								board: state.board,
								value: createImportFailure(body.version, {
									code: "duplicate_task_key",
									message: `Imported task key "${task.externalTaskKey}" is duplicated in the request.`,
									externalTaskKey: task.externalTaskKey,
								}),
								save: false,
							};
						}
						seenTaskKeys.add(task.externalTaskKey);
					}

					let nextBoard = state.board;
					const taskMappings: RuntimeTaskImportResponse["taskMappings"] = [];
					const linkResults: RuntimeTaskImportResponse["linkResults"] = [];
					const startResults: RuntimeTaskImportResponse["startResults"] = [];
					const taskKeyToTaskId = new Map<string, string>();

					for (const task of body.tasks) {
						const normalizedTask = normalizeImportTaskIntent(task, state);
						const existing = findTaskRecordByExternalTaskKey(nextBoard, normalizedTask.externalTaskKey);
						if (existing) {
							if (!isImportedTaskCompatible(existing.task, normalizedTask)) {
								return {
									board: state.board,
									value: createImportFailure(body.version, {
										code: "conflicting_task_intent",
										message: `Imported task "${normalizedTask.externalTaskKey}" conflicts with an existing Kanban task.`,
										externalTaskKey: normalizedTask.externalTaskKey,
									}),
									save: false,
								};
							}
							taskKeyToTaskId.set(normalizedTask.externalTaskKey, existing.task.id);
							taskMappings.push({
								externalTaskKey: normalizedTask.externalTaskKey,
								taskId: existing.task.id,
								columnId: existing.columnId,
								created: false,
							});
							continue;
						}

						const created = addTaskToColumn(
							nextBoard,
							"backlog",
							{
								externalTaskKey: normalizedTask.externalTaskKey,
								title: normalizedTask.title,
								prompt: normalizedTask.prompt,
								startInPlanMode: normalizedTask.startInPlanMode,
								autoReviewEnabled: normalizedTask.autoReviewEnabled,
								autoReviewMode: normalizedTask.autoReviewMode,
								images: normalizedTask.images,
								agentId: normalizedTask.agentId,
								clineSettings: normalizedTask.clineSettings,
								baseRef: normalizedTask.baseRef,
							},
							() => crypto.randomUUID(),
						);
						nextBoard = created.board;
						taskKeyToTaskId.set(normalizedTask.externalTaskKey, created.task.id);
						taskMappings.push({
							externalTaskKey: normalizedTask.externalTaskKey,
							taskId: created.task.id,
							columnId: "backlog",
							created: true,
						});
					}

					for (const link of body.links ?? []) {
						const fromTaskId = taskKeyToTaskId.get(link.fromExternalTaskKey);
						const toTaskId = taskKeyToTaskId.get(link.toExternalTaskKey);
						if (!fromTaskId || !toTaskId) {
							return {
								board: state.board,
								value: createImportFailure(body.version, {
									code: "missing_link_task",
									message: `Imported link "${link.fromExternalTaskKey}" -> "${link.toExternalTaskKey}" references an unknown task key.`,
									fromExternalTaskKey: link.fromExternalTaskKey,
									toExternalTaskKey: link.toExternalTaskKey,
								}),
								save: false,
							};
						}
						const existingDependency = findImportReplayDependency(nextBoard, fromTaskId, toTaskId);
						if (existingDependency) {
							linkResults.push({
								fromExternalTaskKey: link.fromExternalTaskKey,
								toExternalTaskKey: link.toExternalTaskKey,
								dependencyId: existingDependency.id,
								created: false,
							});
							continue;
						}
						const linked = addTaskDependency(nextBoard, fromTaskId, toTaskId);
						if (linked.added && linked.dependency) {
							nextBoard = linked.board;
							linkResults.push({
								fromExternalTaskKey: link.fromExternalTaskKey,
								toExternalTaskKey: link.toExternalTaskKey,
								dependencyId: linked.dependency.id,
								created: true,
							});
							continue;
						}
						if (linked.reason === "duplicate") {
							const duplicateDependency = findImportReplayDependency(nextBoard, fromTaskId, toTaskId);
							if (!duplicateDependency) {
								return {
									board: state.board,
									value: createImportFailure(body.version, {
										code: "invalid_link",
										message: `Imported link "${link.fromExternalTaskKey}" -> "${link.toExternalTaskKey}" could not be reconciled to an existing dependency.`,
										fromExternalTaskKey: link.fromExternalTaskKey,
										toExternalTaskKey: link.toExternalTaskKey,
									}),
									save: false,
								};
							}
							linkResults.push({
								fromExternalTaskKey: link.fromExternalTaskKey,
								toExternalTaskKey: link.toExternalTaskKey,
								dependencyId: duplicateDependency.id,
								created: false,
							});
							continue;
						}
						return {
							board: state.board,
							value: createImportFailure(body.version, {
								code: "invalid_link",
								message: `Imported link "${link.fromExternalTaskKey}" -> "${link.toExternalTaskKey}" is invalid for the current board state (${linked.reason ?? "unknown"}).`,
								fromExternalTaskKey: link.fromExternalTaskKey,
								toExternalTaskKey: link.toExternalTaskKey,
							}),
							save: false,
						};
					}

					for (const externalTaskKey of body.startTaskExternalKeys ?? []) {
						const taskId = taskKeyToTaskId.get(externalTaskKey);
						if (!taskId) {
							return {
								board: state.board,
								value: createImportFailure(body.version, {
									code: "invalid_start_task",
									message: `Imported start task key "${externalTaskKey}" does not resolve to a task.`,
									externalTaskKey,
								}),
								save: false,
							};
						}
					}

					return {
						board: nextBoard,
						value: {
							version: body.version,
							ok: true,
							applied: true,
							taskMappings,
							linkResults,
							startResults,
						},
						save: taskMappings.some((mapping) => mapping.created) || linkResults.some((result) => result.created),
					};
				},
			);

			const response: RuntimeTaskImportResponse = mutation.value;
			if (!response.ok) {
				return response;
			}

			if (mutation.saved) {
				await deps.broadcastRuntimeWorkspaceStateUpdated(workspaceScope.workspaceId, workspaceScope.workspacePath);
				await deps.broadcastRuntimeProjectsUpdated(workspaceScope.workspaceId);
			}

			if ((body.startTaskExternalKeys?.length ?? 0) === 0) {
				return response;
			}

			const latestState = mutation.saved
				? mutation.state
				: await deps.buildWorkspaceStateSnapshot(workspaceScope.workspaceId, workspaceScope.workspacePath);
			const taskByExternalKey = new Map<string, RuntimeBoardCard>();
			for (const column of latestState.board.columns) {
				for (const card of column.cards) {
					if (card.externalTaskKey) {
						taskByExternalKey.set(card.externalTaskKey, card);
					}
				}
			}

			const startResults = [...response.startResults];
			let responseOk: boolean = response.ok;
			let responseError: RuntimeTaskImportResponse["error"] | undefined = response.error;

			for (const externalTaskKey of body.startTaskExternalKeys ?? []) {
				const task = taskByExternalKey.get(externalTaskKey);
				if (!task) {
					responseOk = false;
					responseError = {
						code: "invalid_start_task",
						message: `Imported start task key "${externalTaskKey}" does not resolve to a task.`,
						externalTaskKey,
					};
					return {
						...response,
						ok: responseOk,
						error: responseError,
						startResults,
					};
				}
				const columnId = getTaskColumnId(latestState.board, task.id);
				if (columnId !== "backlog" && columnId !== "in_progress") {
					startResults.push({
						externalTaskKey,
						taskId: task.id,
						ok: false,
						error: `Task "${task.id}" is in "${columnId}" and can only be started from backlog or in_progress.`,
					});
					continue;
				}
				const started = await startImportedTask(workspaceScope, task);
				startResults.push({
					externalTaskKey,
					taskId: task.id,
					ok: started.ok && Boolean(started.summary),
					...(started.summary ? { summary: started.summary } : {}),
					...(started.error ? { error: started.error } : {}),
				});
			}

			if (startResults.some((result: RuntimeTaskImportResponse["startResults"][number]) => !result.ok)) {
				responseOk = false;
			}
			if (startResults.length > 0) {
				await deps.broadcastRuntimeWorkspaceStateUpdated(workspaceScope.workspaceId, workspaceScope.workspacePath);
				await deps.broadcastRuntimeProjectsUpdated(workspaceScope.workspaceId);
			}
			return {
				...response,
				ok: responseOk,
				...(responseError ? { error: responseError } : {}),
				startResults,
			};
		},
		loadState: async (workspaceScope) => {
			return await deps.buildWorkspaceStateSnapshot(workspaceScope.workspaceId, workspaceScope.workspacePath);
		},
		notifyStateUpdated: async (workspaceScope) => {
			void deps.broadcastRuntimeWorkspaceStateUpdated(workspaceScope.workspaceId, workspaceScope.workspacePath);
			void deps.broadcastRuntimeProjectsUpdated(workspaceScope.workspaceId);
			return {
				ok: true,
			};
		},
		saveState: async (workspaceScope, input) => {
			try {
				const terminalManager = await deps.ensureTerminalManagerForWorkspace(
					workspaceScope.workspaceId,
					workspaceScope.workspacePath,
				);
				for (const summary of terminalManager.listSummaries()) {
					input.sessions[summary.taskId] = summary;
				}
				const response = await saveWorkspaceState(workspaceScope.workspacePath, input);
				void deps.broadcastRuntimeWorkspaceStateUpdated(workspaceScope.workspaceId, workspaceScope.workspacePath);
				void deps.broadcastRuntimeProjectsUpdated(workspaceScope.workspaceId);
				return response;
			} catch (error) {
				if (error instanceof WorkspaceStateConflictError) {
					throw new TRPCError({
						code: "CONFLICT",
						message: error.message,
						cause: {
							currentRevision: error.currentRevision,
						},
					});
				}
				throw error;
			}
		},
		loadWorkspaceChanges: async (workspaceScope) => {
			return await getWorkspaceChanges(workspaceScope.workspacePath);
		},
		loadGitLog: async (workspaceScope, input) => {
			const taskScope = normalizeOptionalTaskWorkspaceScopeInput(input.taskScope ?? null);
			let logCwd = workspaceScope.workspacePath;
			if (taskScope) {
				logCwd = await resolveTaskCwd({
					cwd: workspaceScope.workspacePath,
					taskId: taskScope.taskId,
					baseRef: taskScope.baseRef,
					ensure: false,
				});
			}
			return await getGitLog({
				cwd: logCwd,
				ref: input.ref ?? null,
				refs: input.refs ?? null,
				maxCount: input.maxCount,
				skip: input.skip,
			});
		},
		loadGitRefs: async (workspaceScope, input) => {
			const taskScope = normalizeOptionalTaskWorkspaceScopeInput(input ?? null);
			let refsCwd = workspaceScope.workspacePath;
			if (taskScope) {
				refsCwd = await resolveTaskCwd({
					cwd: workspaceScope.workspacePath,
					taskId: taskScope.taskId,
					baseRef: taskScope.baseRef,
					ensure: false,
				});
			}
			return await getGitRefs(refsCwd);
		},
		loadCommitDiff: async (workspaceScope, input) => {
			const taskScope = normalizeOptionalTaskWorkspaceScopeInput(input.taskScope ?? null);
			let diffCwd = workspaceScope.workspacePath;
			if (taskScope) {
				diffCwd = await resolveTaskCwd({
					cwd: workspaceScope.workspacePath,
					taskId: taskScope.taskId,
					baseRef: taskScope.baseRef,
					ensure: false,
				});
			}
			return await getCommitDiff({
				cwd: diffCwd,
				commitHash: input.commitHash,
			});
		},
	};
}
