import { beforeEach, describe, expect, it, vi } from "vitest";

const workspaceTaskWorktreeMocks = vi.hoisted(() => ({
	getTaskWorkspacePathInfo: vi.fn(),
}));

const gitSyncMocks = vi.hoisted(() => ({
	getGitSyncSummary: vi.fn(),
	probeGitWorkspaceState: vi.fn(),
}));

vi.mock("../../../src/workspace/task-worktree.js", () => ({
	getTaskWorkspacePathInfo: workspaceTaskWorktreeMocks.getTaskWorkspacePathInfo,
}));

vi.mock("../../../src/workspace/git-sync.js", () => ({
	getGitSyncSummary: gitSyncMocks.getGitSyncSummary,
	probeGitWorkspaceState: gitSyncMocks.probeGitWorkspaceState,
}));

import type { RuntimeBoardData } from "../../../src/core/api-contract";
import { createWorkspaceMetadataMonitor } from "../../../src/server/workspace-metadata-monitor";

function createBoard(): RuntimeBoardData {
	return {
		columns: [
			{
				id: "in_progress",
				title: "In Progress",
				cards: [
					{
						id: "task-1",
						prompt: "Do thing",
						startInPlanMode: false,
						baseRef: "main",
						createdAt: 1,
						updatedAt: 1,
						title: "Do thing",
					},
				],
			},
			{ id: "backlog", title: "Backlog", cards: [] },
			{ id: "review", title: "Review", cards: [] },
			{ id: "trash", title: "Trash", cards: [] },
		],
		dependencies: [],
	};
}

describe("workspace-metadata-monitor", () => {
	beforeEach(() => {
		workspaceTaskWorktreeMocks.getTaskWorkspacePathInfo.mockReset();
		gitSyncMocks.getGitSyncSummary.mockReset();
		gitSyncMocks.probeGitWorkspaceState.mockReset();
		workspaceTaskWorktreeMocks.getTaskWorkspacePathInfo.mockResolvedValue({
			taskId: "task-1",
			path: "/tmp/repo/.cline/worktrees/task-1/repo",
			displayPath: "~/.cline/kanban/task-1/repo",
			exists: true,
			baseRef: "main",
		});
		gitSyncMocks.probeGitWorkspaceState.mockResolvedValue({
			stateToken: "token-1",
			currentBranch: "task-branch",
			upstreamBranch: null,
			headCommit: "abc123",
			isDetached: false,
		});
		gitSyncMocks.getGitSyncSummary.mockResolvedValue({
			currentBranch: "task-branch",
			upstreamBranch: null,
			changedFiles: 1,
			additions: 2,
			deletions: 3,
			aheadCount: 0,
			behindCount: 0,
		});
	});

	it("preserves the derived display path in task workspace metadata", async () => {
		const updates: Array<{ workspaceId: string; metadata: unknown }> = [];
		const monitor = createWorkspaceMetadataMonitor({
			onMetadataUpdated: (workspaceId, metadata) => {
				updates.push({ workspaceId, metadata });
			},
		});

		const snapshot = await monitor.connectWorkspace({
			workspaceId: "workspace-1",
			workspacePath: "/tmp/repo",
			board: createBoard(),
		});

		expect(snapshot.taskWorkspaces).toHaveLength(1);
		expect(snapshot.taskWorkspaces[0]?.displayPath).toBe("~/.cline/kanban/task-1/repo");
		expect(updates[0]?.metadata).toMatchObject({
			taskWorkspaces: [{ displayPath: "~/.cline/kanban/task-1/repo" }],
		});
	});
});
