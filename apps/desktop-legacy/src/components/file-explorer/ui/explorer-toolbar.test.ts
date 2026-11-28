import { describe, expect, it } from "vitest"
import { getAncestorDirectories } from "./explorer-toolbar"

describe("getAncestorDirectories", () => {
	it("returns directories between the workspace root and the file", () => {
		expect(getAncestorDirectories("/vault", "/vault/a/b/note.md")).toEqual([
			"/vault/a",
			"/vault/a/b",
		])
	})

	it("returns nothing for root files or paths outside the workspace", () => {
		expect(getAncestorDirectories("/vault", "/vault/note.md")).toEqual([])
		expect(getAncestorDirectories("/vault", "/other/x/note.md")).toEqual([])
	})
})
