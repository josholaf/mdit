import { Button } from "@mdit/ui/components/button"
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@mdit/ui/components/tooltip"
import { cn } from "@mdit/ui/lib/utils"
import {
	LayoutGridIcon,
	type LucideIcon,
	MessageSquareIcon,
	PanelLeftIcon,
	SearchIcon,
	SettingsIcon,
	SquarePenIcon,
} from "lucide-react"
import { useShallow } from "zustand/shallow"
import { HotkeyKbd } from "@/components/hotkeys/hotkey-kbd"
import {
	useDesktopRuntime,
	useHotkeysState,
	useWindowState,
	useWorkspaceState,
} from "@/state"
import { isMac } from "@/utils/platform"

export const RIBBON_WIDTH = 44

export function Ribbon() {
	const runtime = useDesktopRuntime()
	const {
		toggleFileExplorerOpen,
		openCommandMenu,
		setSettingsDialogOpen,
		toggleChatPanelOpen,
	} = runtime.window.commands
	const { createNote, toggleCollectionView } = runtime.workspace.commands
	const {
		isFileExplorerOpen,
		isFocusMode,
		chatPanelBetaEnabled,
		isChatPanelOpen,
	} = useWindowState(
		useShallow((s) => ({
			isFileExplorerOpen: s.isFileExplorerOpen,
			isFocusMode: s.isFocusMode,
			chatPanelBetaEnabled: s.chatPanelBetaEnabled,
			isChatPanelOpen: s.isChatPanelOpen,
		})),
	)
	const { workspacePath, isCollectionViewOpen } = useWorkspaceState(
		useShallow((s) => ({
			workspacePath: s.workspacePath,
			isCollectionViewOpen: s.currentCollectionPath !== null,
		})),
	)
	const hotkeys = useHotkeysState((s) => s.hotkeys)

	return (
		<nav
			aria-label="Ribbon"
			className={cn(
				"flex shrink-0 flex-col items-center gap-1 border-r border-border/40 pb-2 pt-12 transition-opacity duration-500",
				isFocusMode && "pointer-events-none opacity-0",
			)}
			style={{ width: RIBBON_WIDTH }}
			{...(isMac() && { "data-tauri-drag-region": "" })}
		>
			<RibbonButton
				icon={PanelLeftIcon}
				label="Toggle sidebar"
				binding={hotkeys["toggle-file-explorer"]}
				isActive={isFileExplorerOpen}
				onClick={toggleFileExplorerOpen}
			/>
			<RibbonButton
				icon={SearchIcon}
				label="Search"
				binding={hotkeys["open-command-menu"]}
				onClick={openCommandMenu}
			/>
			<RibbonButton
				icon={SquarePenIcon}
				label="New note"
				disabled={!workspacePath}
				onClick={() => {
					if (workspacePath) {
						void createNote(workspacePath, { openTab: true })
					}
				}}
			/>
			<RibbonButton
				icon={LayoutGridIcon}
				label="Collection view"
				isActive={isCollectionViewOpen}
				onClick={toggleCollectionView}
			/>
			{chatPanelBetaEnabled && (
				<RibbonButton
					icon={MessageSquareIcon}
					label="Chat"
					isActive={isChatPanelOpen}
					onClick={toggleChatPanelOpen}
				/>
			)}
			<div className="flex-1" />
			<RibbonButton
				icon={SettingsIcon}
				label="Settings"
				binding={hotkeys["toggle-settings"]}
				onClick={() => setSettingsDialogOpen(true)}
			/>
		</nav>
	)
}

function RibbonButton({
	icon: Icon,
	label,
	binding,
	isActive = false,
	disabled = false,
	onClick,
}: {
	icon: LucideIcon
	label: string
	binding?: string
	isActive?: boolean
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
					aria-pressed={isActive}
					disabled={disabled}
					onClick={onClick}
					className={cn(
						"text-foreground/60 hover:bg-background/50 hover:text-foreground",
						isActive && "text-foreground",
					)}
				>
					<Icon strokeWidth={1.75} />
				</Button>
			</TooltipTrigger>
			<TooltipContent side="right" className="pr-1">
				<div className="flex items-center gap-1">
					{label}
					{binding && <HotkeyKbd binding={binding} />}
				</div>
			</TooltipContent>
		</Tooltip>
	)
}
