import { normalizePathSeparators } from "@mdit/utils/path-utils"
import { type MouseEvent, useCallback } from "react"
import { useDesktopRuntime } from "@/state"
import type { WorkspaceEntry } from "@/state/workspace"

import { showDirectoryContextMenu, showEntryContextMenu } from "./menu-builders"
import { getContextMenuSelection } from "./selection"
import type { UseFileExplorerMenusProps } from "./types"

export const useFileExplorerMenus = ({
	canRenameNoteWithAI,
	renameNotesWithAI,
	canMoveNotesWithAI,
	moveNotesWithAI,
	beginRenaming,
	beginNewFolder,
	handleDeleteEntries,
	hasLockedPathConflict,
	createNote,
	workspacePath,
	selectedEntryPaths,
	selectionAnchorPath,
	setEntrySelection,
	resetSelection,
	lookupEntryByPath,
	entries,
	pinnedDirectories,
	pinDirectory,
	unpinDirectory,
}: UseFileExplorerMenusProps) => {
	const { openImageEdit, openIconPicker } = useDesktopRuntime().window.commands
	const copyEntry = useDesktopRuntime().workspace.commands.copyEntry
	const openTabInNewTab = useDesktopRuntime().documents.commands.openTabInNewTab

	const showEntryMenu = useCallback(
		async (entry: WorkspaceEntry, selectionPaths: string[]) => {
			await showEntryContextMenu({
				entry,
				selectionPaths,
				openTabInNewTab,
				canRenameNoteWithAI,
				renameNotesWithAI,
				canMoveNotesWithAI,
				moveNotesWithAI,
				beginRenaming,
				handleDeleteEntries,
				hasLockedPathConflict,
				lookupEntryByPath,
				openImageEdit,
				openIconPicker,
				workspacePath,
			})
		},
		[
			beginRenaming,
			handleDeleteEntries,
			hasLockedPathConflict,
			canRenameNoteWithAI,
			renameNotesWithAI,
			canMoveNotesWithAI,
			moveNotesWithAI,
			openTabInNewTab,
			lookupEntryByPath,
			openImageEdit,
			openIconPicker,
			workspacePath,
		],
	)

	const showDirectoryMenu = useCallback(
		async (directoryEntry: WorkspaceEntry, selectionPaths: string[]) => {
			await showDirectoryContextMenu({
				directoryEntry,
				selectionPaths,
				beginRenaming,
				beginNewFolder,
				createNote,
				handleDeleteEntries,
				hasLockedPathConflict,
				openIconPicker,
				workspacePath,
				pinnedDirectories,
				pinDirectory,
				unpinDirectory,
				copyEntry,
			})
		},
		[
			beginRenaming,
			beginNewFolder,
			createNote,
			handleDeleteEntries,
			hasLockedPathConflict,
			openIconPicker,
			workspacePath,
			pinnedDirectories,
			pinDirectory,
			unpinDirectory,
			copyEntry,
		],
	)

	const handleEntryContextMenu = useCallback(
		async (entry: WorkspaceEntry) => {
			const selectionTargets = getContextMenuSelection({
				entryPath: entry.path,
				selectedEntryPaths,
				selectionAnchorPath,
				setEntrySelection,
			})

			if (entry.isDirectory) {
				await showDirectoryMenu(entry, selectionTargets)
			} else {
				await showEntryMenu(entry, selectionTargets)
			}
		},
		[
			selectedEntryPaths,
			selectionAnchorPath,
			setEntrySelection,
			showDirectoryMenu,
			showEntryMenu,
		],
	)

	const handleRootContextMenu = useCallback(
		(event: MouseEvent<HTMLElement>) => {
			if (!workspacePath) return

			event.preventDefault()
			event.stopPropagation()

			resetSelection()

			showDirectoryMenu(
				{
					path: workspacePath,
					name:
						normalizePathSeparators(workspacePath).split("/").pop() ??
						"Workspace",
					isDirectory: true,
					children: entries,
				},
				[],
			)
		},
		[entries, resetSelection, showDirectoryMenu, workspacePath],
	)

	return {
		handleEntryContextMenu,
		handleRootContextMenu,
	}
}
