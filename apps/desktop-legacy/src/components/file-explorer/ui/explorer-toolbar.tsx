import { Button } from "@mdit/ui/components/button"
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@mdit/ui/components/tooltip"
import {
	isPathEqualOrDescendant,
	normalizePathSeparators,
} from "@mdit/utils/path-utils"
import {
	ChevronsDownUpIcon,
	FolderPlusIcon,
	LocateFixedIcon,
	type LucideIcon,
	SquarePenIcon,
} from "lucide-react"
import { dirname } from "pathe"

type ExplorerToolbarProps = {
	workspacePath: string | null
	activeTabPath: string | null
	expandedDirectories: string[]
	onNewNote: () => void
	onNewFolder: () => void
	setExpandedDirectories: (paths: string[]) => void
}

export function getAncestorDirectories(
	workspacePath: string,
	path: string,
): string[] {
	const root = normalizePathSeparators(workspacePath)
	const ancestors: string[] = []
	let current = dirname(normalizePathSeparators(path))
	while (current !== root && isPathEqualOrDescendant(current, root)) {
		ancestors.push(current)
		const parent = dirname(current)
		if (parent === current) {
			break
		}
		current = parent
	}
	return ancestors.reverse()
}

export function ExplorerToolbar({
	workspacePath,
	activeTabPath,
	expandedDirectories,
	onNewNote,
	onNewFolder,
	setExpandedDirectories,
}: ExplorerToolbarProps) {
	const revealActiveNote = () => {
		if (!workspacePath || !activeTabPath) {
			return
		}
		setExpandedDirectories([
			...new Set([
				...expandedDirectories,
				...getAncestorDirectories(workspacePath, activeTabPath),
			]),
		])
		requestAnimationFrame(() => {
			document
				.getElementById(activeTabPath)
				?.scrollIntoView({ block: "nearest" })
		})
	}

	return (
		<div className="flex items-center justify-center gap-0.5 px-2 py-1">
			<ToolbarButton
				icon={SquarePenIcon}
				label="New note"
				disabled={!workspacePath}
				onClick={onNewNote}
			/>
			<ToolbarButton
				icon={FolderPlusIcon}
				label="New folder"
				disabled={!workspacePath}
				onClick={onNewFolder}
			/>
			<ToolbarButton
				icon={LocateFixedIcon}
				label="Reveal active note"
				disabled={!activeTabPath}
				onClick={revealActiveNote}
			/>
			<ToolbarButton
				icon={ChevronsDownUpIcon}
				label="Collapse all"
				disabled={expandedDirectories.length === 0}
				onClick={() => setExpandedDirectories([])}
			/>
		</div>
	)
}

function ToolbarButton({
	icon: Icon,
	label,
	disabled,
	onClick,
}: {
	icon: LucideIcon
	label: string
	disabled?: boolean
	onClick: () => void
}) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					aria-label={label}
					disabled={disabled}
					className="size-7 text-foreground/60 hover:bg-background/40 hover:text-foreground"
					onClick={(event) => {
						event.stopPropagation()
						onClick()
					}}
				>
					<Icon className="size-4" strokeWidth={1.75} />
				</Button>
			</TooltipTrigger>
			<TooltipContent>{label}</TooltipContent>
		</Tooltip>
	)
}
