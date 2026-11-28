import { Button } from "@mdit/ui/components/button"
import { Dialog, DialogContent, DialogTitle } from "@mdit/ui/components/dialog"
import { getFileNameFromPath } from "@mdit/utils/path-utils"
import { useRef } from "react"
import { useDesktopRuntime, useWindowState, useWorkspaceState } from "@/state"
import { IconPicker } from "./icon-picker"

export function IconPickerDialog() {
	const searchInputRef = useRef<HTMLInputElement | null>(null)
	const path = useWindowState((state) => state.iconPickerPath)
	const currentIcon = useWorkspaceState((state) =>
		path ? (state.entryIcons[path] ?? null) : null,
	)
	const { closeIconPicker } = useDesktopRuntime().window.commands
	const { setEntryIcon } = useDesktopRuntime().workspace.commands

	const apply = (icon: string | null) => {
		if (path) {
			void setEntryIcon(path, icon)
		}
		closeIconPicker()
	}

	return (
		<Dialog
			open={path !== null}
			onOpenChange={(open) => {
				if (!open) {
					closeIconPicker()
				}
			}}
		>
			<DialogContent
				className="w-auto gap-3 p-4 sm:max-w-none"
				initialFocus={searchInputRef}
			>
				<div className="flex items-center justify-between gap-4 pr-6">
					<DialogTitle className="truncate text-sm font-medium">
						{path ? `Icon for ${getFileNameFromPath(path)}` : "Choose icon"}
					</DialogTitle>
					{currentIcon && (
						<Button
							variant="ghost"
							size="sm"
							className="h-7 px-2 text-xs text-muted-foreground"
							onClick={() => apply(null)}
						>
							Remove icon
						</Button>
					)}
				</div>
				{path && (
					<IconPicker
						value={currentIcon}
						onSelect={apply}
						inputRef={searchInputRef}
					/>
				)}
			</DialogContent>
		</Dialog>
	)
}
