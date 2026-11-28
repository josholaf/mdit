import { cn } from "@mdit/ui/lib/utils"
import { normalizePathSeparators } from "@mdit/utils/path-utils"
import { Fragment } from "react"
import { useShallow } from "zustand/shallow"
import { useDesktopRuntime, useDocumentState, useWorkspaceState } from "@/state"
import { selectActiveTabPath } from "@/state/documents/selectors"

export type BreadcrumbSegment = { name: string; path: string }

export function getBreadcrumbSegments(
	workspacePath: string | null,
	path: string,
): BreadcrumbSegment[] {
	const normalized = normalizePathSeparators(path)
	const root = workspacePath ? normalizePathSeparators(workspacePath) : null
	const relative =
		root && normalized.startsWith(`${root}/`)
			? normalized.slice(root.length + 1)
			: normalized.replace(/^\/+/, "")
	const parts = relative.split("/").filter(Boolean)
	const base = root ?? ""
	return parts.map((part, index) => ({
		name: index === parts.length - 1 ? part.replace(/\.md$/i, "") : part,
		path: [base, ...parts.slice(0, index + 1)].join("/"),
	}))
}

export function Breadcrumbs() {
	const { activePath } = useDocumentState(
		useShallow((s) => ({ activePath: selectActiveTabPath(s) })),
	)
	const workspacePath = useWorkspaceState((s) => s.workspacePath)
	const { setCurrentCollectionPath } = useDesktopRuntime().workspace.commands

	if (!activePath) {
		return <div className="min-w-0 flex-1" />
	}

	const segments = getBreadcrumbSegments(workspacePath, activePath)

	return (
		<nav
			aria-label="Breadcrumb"
			className="flex min-w-0 flex-1 items-center justify-center gap-1 overflow-hidden text-sm"
		>
			{segments.map((segment, index) => {
				const isLast = index === segments.length - 1
				return (
					<Fragment key={segment.path}>
						{index > 0 && <span className="text-muted-foreground/50">/</span>}
						{isLast ? (
							<span className="truncate text-foreground" aria-current="page">
								{segment.name}
							</span>
						) : (
							<button
								type="button"
								className={cn(
									"shrink truncate rounded-sm px-0.5 text-muted-foreground transition-colors",
									"hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50",
								)}
								onClick={() => setCurrentCollectionPath(segment.path)}
							>
								{segment.name}
							</button>
						)}
					</Fragment>
				)
			})}
		</nav>
	)
}
