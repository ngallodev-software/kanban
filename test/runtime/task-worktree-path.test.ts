import { describe, expect, it } from "vitest";

import {
	buildTaskWorktreeDisplayPath,
	getWorkspaceFolderLabelForWorktreePath,
	normalizeTaskIdForWorktreePath,
} from "../../src/workspace/task-worktree-path";

describe("task-worktree-path", () => {
	it("builds the canonical display path from task id and repo label", () => {
		expect(buildTaskWorktreeDisplayPath("task-123", "/tmp/projects/my-app")).toBe(
			"~/.cline/worktrees/task-123/my-app",
		);
	});

	it("normalizes repo labels down to a readable folder name", () => {
		expect(getWorkspaceFolderLabelForWorktreePath("/tmp/projects/my-app/")).toBe("my-app");
		expect(getWorkspaceFolderLabelForWorktreePath("////")).toBe("workspace");
	});

	it("rejects unsafe task ids for worktree paths", () => {
		expect(() => normalizeTaskIdForWorktreePath("../task")).toThrow("Invalid task id for worktree path.");
	});
});
