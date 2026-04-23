import { afterEach, describe, expect, it } from "vitest";

import {
	clearInactiveTaskWorkspaceSnapshots,
	getTaskWorkspaceInfo,
	getTaskWorkspaceSnapshot,
	replaceWorkspaceMetadata,
	resetWorkspaceMetadataStore,
} from "@/stores/workspace-metadata-store";

describe("workspace-metadata-store", () => {
	afterEach(() => {
		resetWorkspaceMetadataStore();
	});

	it("hydrates task info and snapshot values from runtime metadata", () => {
		replaceWorkspaceMetadata({
			homeGitSummary: null,
			homeGitStateVersion: 7,
			taskWorkspaces: [
				{
					taskId: "task-1",
					path: "/tmp/worktrees/task-1",
					displayPath: "~/.cline/worktrees/task-1/kanban",
					exists: true,
					baseRef: "main",
					branch: "feature/traceability",
					isDetached: false,
					headCommit: "1234567890abcdef",
					changedFiles: 2,
					additions: 8,
					deletions: 3,
					stateVersion: 11,
				},
			],
		});

		expect(getTaskWorkspaceInfo("task-1")).toEqual({
			taskId: "task-1",
			path: "/tmp/worktrees/task-1",
			displayPath: "~/.cline/worktrees/task-1/kanban",
			exists: true,
			baseRef: "main",
			branch: "feature/traceability",
			isDetached: false,
			headCommit: "1234567890abcdef",
		});
		expect(getTaskWorkspaceSnapshot("task-1")).toEqual({
			taskId: "task-1",
			path: "/tmp/worktrees/task-1",
			displayPath: "~/.cline/worktrees/task-1/kanban",
			branch: "feature/traceability",
			isDetached: false,
			headCommit: "1234567890abcdef",
			changedFiles: 2,
			additions: 8,
			deletions: 3,
		});
	});

	it("drops inactive task snapshots without disturbing active ones", () => {
		replaceWorkspaceMetadata({
			homeGitSummary: null,
			homeGitStateVersion: 0,
			taskWorkspaces: [
				{
					taskId: "task-1",
					path: "/tmp/worktrees/task-1",
					displayPath: "~/.cline/worktrees/task-1/kanban",
					exists: true,
					baseRef: "main",
					branch: "feature/traceability",
					isDetached: false,
					headCommit: "1234567890abcdef",
					changedFiles: 1,
					additions: 1,
					deletions: 0,
					stateVersion: 1,
				},
				{
					taskId: "task-2",
					path: "/tmp/worktrees/task-2",
					displayPath: "~/.cline/worktrees/task-2/kanban",
					exists: true,
					baseRef: "main",
					branch: "feature/other",
					isDetached: false,
					headCommit: "fedcba0987654321",
					changedFiles: 4,
					additions: 10,
					deletions: 2,
					stateVersion: 2,
				},
			],
		});

		clearInactiveTaskWorkspaceSnapshots(new Set(["task-1"]));

		expect(getTaskWorkspaceSnapshot("task-1")).toEqual({
			taskId: "task-1",
			path: "/tmp/worktrees/task-1",
			displayPath: "~/.cline/worktrees/task-1/kanban",
			branch: "feature/traceability",
			isDetached: false,
			headCommit: "1234567890abcdef",
			changedFiles: 1,
			additions: 1,
			deletions: 0,
		});
		expect(getTaskWorkspaceSnapshot("task-2")).toBeNull();
	});
});
