import { describe, expect, it } from "vitest"
import { getBreadcrumbSegments } from "./breadcrumbs"

describe("getBreadcrumbSegments", () => {
	it("builds workspace-relative segments and strips the markdown extension", () => {
		expect(
			getBreadcrumbSegments("/vault", "/vault/Projects/Ideas/Plan.md"),
		).toEqual([
			{ name: "Projects", path: "/vault/Projects" },
			{ name: "Ideas", path: "/vault/Projects/Ideas" },
			{ name: "Plan", path: "/vault/Projects/Ideas/Plan.md" },
		])
	})

	it("keeps non-markdown file names intact", () => {
		expect(getBreadcrumbSegments("/vault", "/vault/image.png")).toEqual([
			{ name: "image.png", path: "/vault/image.png" },
		])
	})
})
