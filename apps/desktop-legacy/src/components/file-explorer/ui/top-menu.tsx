import { cn } from "@mdit/ui/lib/utils"
import { RIBBON_WIDTH } from "@/components/ribbon/ribbon"
import { isMac } from "@/utils/platform"
import { SearchButton } from "./search-button"
import { ToggleButton } from "./toggle-button"

export function TopMenu({
	isOpen,
	width,
	isResizing,
	isFileExplorerOpen,
	setFileExplorerOpen,
}: {
	isOpen: boolean
	width: number
	isResizing: boolean
	isFileExplorerOpen: boolean
	setFileExplorerOpen: (isOpen: boolean) => void
}) {
	const isMacOS = isMac()

	if (!isOpen) {
		return null
	}

	return (
		<div
			className={cn(
				"fixed top-0 h-12 flex items-center justify-end gap-1 px-2 z-101",
				!isResizing && "transition-[width] ease-out duration-100",
			)}
			style={{ left: RIBBON_WIDTH, width }}
			{...(isMacOS && { "data-tauri-drag-region": "" })}
		>
			{isFileExplorerOpen && <SearchButton />}
			<ToggleButton
				isOpen={isFileExplorerOpen}
				onToggle={() => setFileExplorerOpen(!isFileExplorerOpen)}
			/>
		</div>
	)
}
