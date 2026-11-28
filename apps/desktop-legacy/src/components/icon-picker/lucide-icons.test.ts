import { describe, expect, it } from "vitest"
import {
	getLucideIcon,
	LUCIDE_ICON_NAMES,
	searchLucideIcons,
	toIconName,
} from "./lucide-icons"

describe("lucide icons", () => {
	it("converts component names to kebab-case icon names", () => {
		expect(toIconName("FileText")).toBe("file-text")
		expect(toIconName("Heading1")).toBe("heading-1")
		expect(toIconName("AArrowDown")).toBe("a-arrow-down")
		expect(toIconName("ALargeSmall")).toBe("a-large-small")
		expect(toIconName("Grid2x2Check")).toBe("grid-2x2-check")
	})

	it("resolves known icons and rejects unknown names", () => {
		expect(LUCIDE_ICON_NAMES.length).toBeGreaterThan(1000)
		expect(getLucideIcon("folder")).not.toBeNull()
		expect(getLucideIcon("not-a-real-icon")).toBeNull()
		expect(getLucideIcon(null)).toBeNull()
	})

	it("ranks exact and prefix matches before partial matches", () => {
		const names = ["book-open", "notebook", "book", "bookmark", "folder"]
		expect(searchLucideIcons("book", names)).toEqual([
			"book",
			"bookmark",
			"book-open",
			"notebook",
		])
		expect(searchLucideIcons("open book", names)).toEqual(["book-open"])
		expect(searchLucideIcons("  ", names)).toEqual(names)
	})
})
