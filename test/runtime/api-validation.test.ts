import { describe, expect, it } from "vitest";

import {
	parseHookIngestRequest,
	parseRuntimeConfigSaveRequest,
	parseTaskImportRequest,
	parseTaskSessionStartRequest,
	parseWorkspaceFileSearchRequest,
} from "../../src/core/api-validation";

describe("parseWorkspaceFileSearchRequest", () => {
	it("parses q and limit", () => {
		const parsed = parseWorkspaceFileSearchRequest(new URLSearchParams({ q: "  src/runtime ", limit: "25" }));
		expect(parsed).toEqual({
			query: "src/runtime",
			limit: 25,
		});
	});

	it("treats missing q as empty query", () => {
		const parsed = parseWorkspaceFileSearchRequest(new URLSearchParams({ limit: "10" }));
		expect(parsed).toEqual({
			query: "",
		});
	});

	it("does not accept legacy query alias", () => {
		const parsed = parseWorkspaceFileSearchRequest(new URLSearchParams({ query: "legacy" }));
		expect(parsed).toEqual({
			query: "",
		});
	});

	it("throws when limit is invalid", () => {
		expect(() => {
			parseWorkspaceFileSearchRequest(new URLSearchParams({ q: "board", limit: "0" }));
		}).toThrow("Invalid file search limit parameter.");
	});
});

describe("parseHookIngestRequest", () => {
	it("parses and trims task and workspace identifiers", () => {
		const parsed = parseHookIngestRequest({
			taskId: "  task-123  ",
			workspaceId: "  workspace-456  ",
			event: "to_review",
			metadata: {
				source: " claude ",
				activityText: " Using Read ",
			},
		});
		expect(parsed).toEqual({
			taskId: "task-123",
			workspaceId: "workspace-456",
			event: "to_review",
			metadata: {
				source: "claude",
				activityText: "Using Read",
				hookEventName: undefined,
				toolName: undefined,
				finalMessage: undefined,
				notificationType: undefined,
			},
		});
	});

	it("throws when workspaceId is missing", () => {
		expect(() => {
			parseHookIngestRequest({
				taskId: "task-1",
				workspaceId: "   ",
				event: "to_review",
			});
		}).toThrow("Missing workspaceId");
	});
});

describe("parseTaskSessionStartRequest", () => {
	it("parses resumeFromTrash and trims task identifiers", () => {
		const parsed = parseTaskSessionStartRequest({
			taskId: "  task-1  ",
			prompt: "",
			baseRef: "  main  ",
			resumeFromTrash: true,
		});
		expect(parsed).toEqual({
			taskId: "task-1",
			prompt: "",
			baseRef: "main",
			resumeFromTrash: true,
		});
	});
});

describe("parseRuntimeConfigSaveRequest", () => {
	it("accepts nullable board path overrides", () => {
		expect(
			parseRuntimeConfigSaveRequest({
				boardPath: ".kanban/board.json",
			}),
		).toEqual({
			boardPath: ".kanban/board.json",
		});

		expect(
			parseRuntimeConfigSaveRequest({
				boardPath: null,
			}),
		).toEqual({
			boardPath: null,
		});
	});

	it("rejects empty board path overrides", () => {
		expect(() => {
			parseRuntimeConfigSaveRequest({
				boardPath: "   ",
			});
		}).toThrow();
	});
});

describe("parseTaskImportRequest", () => {
	it("trims import identifiers and defaults omitted arrays", () => {
		expect(
			parseTaskImportRequest({
				version: "v1",
				tasks: [
					{
						externalTaskKey: " ext-1 ",
						title: " Task One ",
						prompt: " do work ",
						baseRef: " main ",
					},
				],
			}),
		).toEqual({
			version: "v1",
			tasks: [
				{
					externalTaskKey: "ext-1",
					title: "Task One",
					prompt: "do work",
					baseRef: "main",
				},
			],
		});
	});

	it("rejects empty task keys after trim", () => {
		expect(() =>
			parseTaskImportRequest({
				version: "v1",
				tasks: [
					{
						externalTaskKey: "   ",
						prompt: "do work",
					},
				],
			}),
		).toThrow("Imported task externalTaskKey cannot be empty.");
	});

	it("rejects empty link identifiers after trim", () => {
		expect(() =>
			parseTaskImportRequest({
				version: "v1",
				tasks: [
					{
						externalTaskKey: "ext-1",
						prompt: "do work",
					},
				],
				links: [
					{
						fromExternalTaskKey: "ext-1",
						toExternalTaskKey: "  ",
					},
				],
			}),
		).toThrow("Imported task links require non-empty fromExternalTaskKey and toExternalTaskKey.");
	});
});
