import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AgentTerminalPanel } from "@/components/detail-panels/agent-terminal-panel";
import type { RuntimeTaskWorkspaceInfoResponse } from "@/runtime/types";

let mockWorkspaceInfo: RuntimeTaskWorkspaceInfoResponse | undefined;

vi.mock("@/stores/workspace-metadata-store", () => ({
	useTaskWorkspaceInfoValue: () => mockWorkspaceInfo,
}));

vi.mock("@/terminal/use-persistent-terminal-session", () => ({
	usePersistentTerminalSession: () => ({
		containerRef: { current: null },
		lastError: null,
		isStopping: false,
		clearTerminal: vi.fn(),
		stopTerminal: vi.fn(async () => {}),
	}),
}));

describe("AgentTerminalPanel", () => {
	let container: HTMLDivElement;
	let root: Root;
	let previousActEnvironment: boolean | undefined;

	beforeEach(() => {
		mockWorkspaceInfo = {
			taskId: "task-1",
			path: "/tmp/worktrees/task-1",
			displayPath: "~/.cline/worktrees/task-1/kanban",
			exists: true,
			baseRef: "main",
			branch: "feature/traceability",
			isDetached: false,
			headCommit: "1234567890abcdef",
		};
		previousActEnvironment = (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean })
			.IS_REACT_ACT_ENVIRONMENT;
		(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
		container = document.createElement("div");
		document.body.appendChild(container);
		root = createRoot(container);
	});

	afterEach(() => {
		act(() => {
			root.unmount();
		});
		container.remove();
		if (previousActEnvironment === undefined) {
			delete (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;
		} else {
			(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
				previousActEnvironment;
		}
		vi.restoreAllMocks();
	});

	it("shows the task-worktree label and canonical display path in the header", async () => {
		await act(async () => {
			root.render(
				<AgentTerminalPanel
					taskId="task-1"
					workspaceId="workspace-1"
					summary={null}
					showSessionToolbar={false}
					onClose={() => {}}
				/>,
			);
		});

		expect(container.textContent).toContain("Terminal");
		expect(container.textContent).toContain("Task worktree");
		expect(container.textContent).toContain("~/.cline/worktrees/task-1/kanban");
		expect(container.textContent).not.toContain("/tmp/worktrees/task-1");
	});
});
