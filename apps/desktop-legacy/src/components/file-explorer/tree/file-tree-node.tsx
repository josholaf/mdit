import { cn } from "@mdit/ui/lib/utils"
import { normalizePathSeparators } from "@mdit/utils/path-utils"
import { FileIcon, FileImageIcon, FileTextIcon } from "lucide-react"
import { useMemo } from "react"
import { EntryIcon } from "@/components/icon-picker/entry-icon"
import { useWorkspaceState } from "@/state"
import { isImageFile } from "@/utils/file-icon"
import { useInlineEditableInput } from "../hooks/use-inline-editable-input"
import { getEntryButtonClassName } from "../utils/entry-classnames"
import type { TreeNodeProps } from "./tree-node.types"
import { TreeNodeRenameInput } from "./tree-node-rename-input"
import { useTreeNodeInteractions } from "./use-tree-node-interactions"

const INDENTATION_WIDTH = 12

export function FileTreeNode({
	node,
	onEntryPrimaryAction,
	onEntryContextMenu,
	onRenameSubmit,
	onRenameCancel,
}: TreeNodeProps) {
	const { entry } = node
	const {
		isRenaming,
		isLocked,
		isBusy,
		isSelected,
		isDragging,
		setDraggableRef,
		handlePrimaryAction,
		handleContextMenu,
	} = useTreeNodeInteractions({
		node,
		onEntryPrimaryAction,
		onEntryContextMenu,
	})

	const extension = useMemo(() => {
		if (entry.isDirectory) {
			return ""
		}

		const lastDotIndex = entry.name.lastIndexOf(".")
		if (lastDotIndex <= 0) {
			return ""
		}

		return entry.name.slice(lastDotIndex)
	}, [entry.isDirectory, entry.name])

	const baseName = useMemo(() => {
		if (!extension) {
			return entry.name
		}

		return entry.name.slice(0, -extension.length)
	}, [entry.name, extension])

	const isMarkdown = useMemo(
		() => !entry.isDirectory && extension.toLowerCase() === ".md",
		[entry.isDirectory, extension],
	)
	const isActiveNote = isMarkdown && node.isActive
	const customIcon = useWorkspaceState(
		(state) => state.entryIcons[normalizePathSeparators(entry.path)],
	)
	const fallbackIcon = isMarkdown
		? FileTextIcon
		: extension && isImageFile(extension)
			? FileImageIcon
			: FileIcon
	const showExtension = !isMarkdown && extension

	const renameInput = useInlineEditableInput({
		active: isRenaming,
		initialValue: baseName,
		onSubmit: async (trimmedName) => {
			let finalName = trimmedName
			if (extension && !trimmedName.endsWith(extension)) {
				finalName = `${trimmedName}${extension}`
			}
			await onRenameSubmit(entry, finalName)
		},
		onCancel: onRenameCancel,
	})

	return (
		<li>
			<button
				ref={setDraggableRef}
				type="button"
				id={entry.path}
				onClick={handlePrimaryAction}
				onContextMenu={handleContextMenu}
				className={cn(
					getEntryButtonClassName({
						isSelected,
						isActive: isActiveNote,
						isDragging,
						isRenaming,
						isLocked,
						widthClass: "w-full",
					}),
					showExtension && "pr-1",
				)}
				style={{ paddingLeft: `${(node.depth + 1) * INDENTATION_WIDTH}px` }}
				aria-current={isActiveNote ? "page" : undefined}
				disabled={isBusy}
			>
				<EntryIcon
					icon={customIcon}
					fallback={fallbackIcon}
					className={cn(
						"mr-1.5 text-foreground/60",
						customIcon && "text-foreground/80",
					)}
				/>
				<div
					className={cn(
						"relative flex-1 overflow-hidden whitespace-nowrap",
						!isRenaming && "text-overflow-mask",
					)}
				>
					<span className={cn("text-sm", isRenaming && "opacity-0")}>
						{baseName}
					</span>
					{isRenaming && (
						<TreeNodeRenameInput
							value={renameInput.value}
							setValue={renameInput.setValue}
							inputRef={renameInput.inputRef}
							onKeyDown={renameInput.onKeyDown}
							onBlur={renameInput.onBlur}
							className="pt-px"
						/>
					)}
				</div>
				{showExtension && (
					<span
						className={cn(
							"ml-auto shrink-0 px-1 py-0.5 text-xs rounded",
							"bg-muted/50 text-muted-foreground/60",
							"font-mono",
							isRenaming && "opacity-0",
						)}
					>
						{extension.slice(1)}
					</span>
				)}
			</button>
		</li>
	)
}
