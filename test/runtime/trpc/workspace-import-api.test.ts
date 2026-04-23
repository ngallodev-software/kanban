import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RuntimeTaskSessionSummary, RuntimeWorkspaceStateResponse } from "../../../src/core/api-contract";

const workspaceStateMocks = vi.hoisted(() => ({
	mutateWorkspaceState: vi.fn(),
	saveWorkspaceState: vi.fn(),
}));

const workspaceTaskWorktreeMocks = vi.hoisted(() => ({
	deleteTaskWorktree: vi.fn(),
	ensureTaskWorktreeIfDoesntExist: vi.fn(),
	getTaskWorkspaceInfo: vi.fn(),
	resolveTaskCwd: vi.fn(),
}));

vi.mock("../../../src/state/workspace-state.js", () => ({
	mutateWorkspaceState: workspaceStateMocks.mutateWorkspaceState,
	saveWorkspaceState: workspaceStateMocks.saveWorkspaceState,
	WorkspaceStateConflictError: class WorkspaceStateConflictError extends Error {
		readonly currentRevision: number;

		constructor(expectedRevision: number, currentRevision: number) {
			super(`Workspace state revision mismatch: expected ${expectedRevision}, current ${currentRevision}.`);
			this.currentRevision = currentRevision;
		}
	},
}));

vi.mock("../../../src/workspace/task-worktree.js", () => ({
	deleteTaskWorktree: workspaceTaskWorktreeMocks.deleteTaskWorktree,
	ensureTaskWorktreeIfDoesntExist: workspaceTaskWorktreeMocks.ensureTaskWorktreeIfDoesntExist,
	getTaskWorkspaceInfo: workspaceTaskWorktreeMocks.getTaskWorkspaceInfo,
	resolveTaskCwd: workspaceTaskWorktreeMocks.resolveTaskCwd,
}));

import { createWorkspaceApi } from "../../../src/trpc/workspace-api";

function createSummary(taskId: string): RuntimeTaskSessionSummary {
	return {
		taskId,
		state: "running",
		agentId: "claude",
		workspacePath: `/tmp/${taskId}`,
		pid: 1234,
		startedAt: Date.now(),
		updatedAt: Date.now(),
		lastOutputAt: Date.now(),
		reviewReason: null,
		exitCode: null,
		lastHookAt: null,
		latestHookActivity: null,
	};
}

function createState(): RuntimeWorkspaceStateResponse {
	return {
		repoPath: "/tmp/repo",
		statePath: "/tmp/state",
		git: {
			currentBranch: "main",
			defaultBranch: "main",
			branches: ["main"],
		},
		board: {
			columns: [
				{ id: "backlog", title: "Backlog", cards: [] },
				{ id: "in_progress", title: "In Progress", cards: [] },
				{ id: "review", title: "Review", cards: [] },
				{ id: "trash", title: "Trash", cards: [] },
			],
			dependencies: [],
		},
		sessions: {},
		revision: 0,
	};
}

describe("createWorkspaceApi importTasks", () => {
	let currentState: RuntimeWorkspaceStateResponse;

	beforeEach(() => {
		currentState = createState();
		workspaceStateMocks.saveWorkspaceState.mockReset();
		workspaceTaskWorktreeMocks.deleteTaskWorktree.mockReset();
		workspaceTaskWorktreeMocks.ensureTaskWorktreeIfDoesntExist.mockReset();
		workspaceTaskWorktreeMocks.getTaskWorkspaceInfo.mockReset();
		workspaceTaskWorktreeMocks.resolveTaskCwd.mockReset();
		workspaceStateMocks.mutateWorkspaceState.mockReset();
		workspaceTaskWorktreeMocks.ensureTaskWorktreeIfDoesntExist.mockResolvedValue({
			ok: true,
			path: "/tmp/worktree",
			baseRef: "main",
			baseCommit: "abc1234",
		});
		workspaceStateMocks.mutateWorkspaceState.mockImplementation(async (_cwd, mutate) => {
			const mutation = mutate(currentState);
			if (mutation.save === false) {
				return {
					value: mutation.value,
					state: currentState,
					saved: false,
				};
			}
			currentState = {
				...currentState,
				board: mutation.board,
				sessions: mutation.sessions ?? currentState.sessions,
				revision: currentState.revision + 1,
			};
			return {
				value: mutation.value,
				state: currentState,
				saved: true,
			};
		});
	});

	it("creates tasks and links once, then reuses them on replay", async () => {
		const broadcastRuntimeWorkspaceStateUpdated = vi.fn();
		const broadcastRuntimeProjectsUpdated = vi.fn();
		const api = createWorkspaceApi({
			ensureTerminalManagerForWorkspace: vi.fn(),
			getScopedClineTaskSessionService: vi.fn(),
			broadcastRuntimeWorkspaceStateUpdated,
			broadcastRuntimeProjectsUpdated,
			buildWorkspaceStateSnapshot: vi.fn(async () => currentState),
		});

		const first = await api.importTasks(
			{ workspaceId: "workspace-1", workspacePath: "/tmp/repo" },
			{
				version: "v1",
				tasks: [
					{ externalTaskKey: "a", prompt: "Task A", baseRef: "main" },
					{ externalTaskKey: "b", prompt: "Task B", baseRef: "main" },
				],
				links: [{ fromExternalTaskKey: "a", toExternalTaskKey: "b" }],
			},
		);

		expect(first.ok).toBe(true);
		expect(first.applied).toBe(true);
		expect(first.taskMappings).toHaveLength(2);
		expect(first.taskMappings.every((mapping) => mapping.created)).toBe(true);
		expect(first.linkResults).toHaveLength(1);
		expect(first.linkResults[0]?.created).toBe(true);
		expect(broadcastRuntimeWorkspaceStateUpdated).toHaveBeenCalledTimes(1);
		expect(broadcastRuntimeProjectsUpdated).toHaveBeenCalledTimes(1);

		const second = await api.importTasks(
			{ workspaceId: "workspace-1", workspacePath: "/tmp/repo" },
			{
				version: "v1",
				tasks: [
					{ externalTaskKey: "a", prompt: "Task A", baseRef: "main" },
					{ externalTaskKey: "b", prompt: "Task B", baseRef: "main" },
				],
				links: [{ fromExternalTaskKey: "a", toExternalTaskKey: "b" }],
			},
		);

		expect(second.ok).toBe(true);
		expect(second.applied).toBe(true);
		expect(second.taskMappings.every((mapping) => !mapping.created)).toBe(true);
		expect(second.linkResults[0]?.created).toBe(false);
		expect(currentState.board.columns[0]?.cards).toHaveLength(2);
		expect(currentState.board.dependencies).toHaveLength(1);
		expect(broadcastRuntimeWorkspaceStateUpdated).toHaveBeenCalledTimes(1);
	});

	it("fails closed when an external task key conflicts with existing task intent", async () => {
		const api = createWorkspaceApi({
			ensureTerminalManagerForWorkspace: vi.fn(),
			getScopedClineTaskSessionService: vi.fn(),
			broadcastRuntimeWorkspaceStateUpdated: vi.fn(),
			broadcastRuntimeProjectsUpdated: vi.fn(),
			buildWorkspaceStateSnapshot: vi.fn(async () => currentState),
		});

		await api.importTasks(
			{ workspaceId: "workspace-1", workspacePath: "/tmp/repo" },
			{
				version: "v1",
				tasks: [{ externalTaskKey: "a", prompt: "Task A", baseRef: "main" }],
			},
		);

		const result = await api.importTasks(
			{ workspaceId: "workspace-1", workspacePath: "/tmp/repo" },
			{
				version: "v1",
				tasks: [{ externalTaskKey: "a", prompt: "Task A changed", baseRef: "main" }],
			},
		);

		expect(result.ok).toBe(false);
		expect(result.applied).toBe(false);
		expect(result.error).toEqual({
			code: "conflicting_task_intent",
			message: 'Imported task "a" conflicts with an existing Kanban task.',
			externalTaskKey: "a",
		});
		expect(currentState.board.columns[0]?.cards).toHaveLength(1);
	});

	it("starts explicit tasks after import and moves them to in progress", async () => {
		const startTaskSession = vi.fn(async ({ taskId }) => ({
			ok: true,
			summary: createSummary(taskId),
		}));
		const broadcastRuntimeWorkspaceStateUpdated = vi.fn();
		const broadcastRuntimeProjectsUpdated = vi.fn();
		const api = createWorkspaceApi({
			ensureTerminalManagerForWorkspace: vi.fn(),
			getScopedClineTaskSessionService: vi.fn(),
			broadcastRuntimeWorkspaceStateUpdated,
			broadcastRuntimeProjectsUpdated,
			buildWorkspaceStateSnapshot: vi.fn(async () => currentState),
			startTaskSession,
		});

		const result = await api.importTasks(
			{ workspaceId: "workspace-1", workspacePath: "/tmp/repo" },
			{
				version: "v1",
				tasks: [{ externalTaskKey: "a", prompt: "Task A", baseRef: "main" }],
				startTaskExternalKeys: ["a"],
			},
		);

		expect(result.ok).toBe(true);
		expect(result.startResults).toHaveLength(1);
		expect(result.startResults[0]?.ok).toBe(true);
		expect(startTaskSession).toHaveBeenCalledTimes(1);
		expect(workspaceTaskWorktreeMocks.ensureTaskWorktreeIfDoesntExist).toHaveBeenCalledWith({
			cwd: "/tmp/repo",
			taskId: result.taskMappings[0]?.taskId,
			baseRef: "main",
		});
		expect(currentState.board.columns[1]?.cards.map((card) => card.externalTaskKey)).toEqual(["a"]);
		expect(broadcastRuntimeWorkspaceStateUpdated).toHaveBeenCalledTimes(2);
		expect(broadcastRuntimeProjectsUpdated).toHaveBeenCalledTimes(2);
	});
});
