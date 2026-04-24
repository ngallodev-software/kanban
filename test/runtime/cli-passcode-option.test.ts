import { describe, expect, it } from "vitest";

import { normalizeRootCommandOptions } from "../../src/cli";

describe("normalizeRootCommandOptions", () => {
	it("treats commander --no-passcode output as passcode disabled", () => {
		expect(
			normalizeRootCommandOptions({
				passcode: false,
			}).noPasscode,
		).toBe(true);
	});

	it("keeps passcode enabled when commander default is true", () => {
		expect(
			normalizeRootCommandOptions({
				passcode: true,
			}).noPasscode,
		).toBe(false);
	});

	it("still honors legacy noPasscode option shape", () => {
		expect(
			normalizeRootCommandOptions({
				noPasscode: true,
			}).noPasscode,
		).toBe(true);
	});
});
