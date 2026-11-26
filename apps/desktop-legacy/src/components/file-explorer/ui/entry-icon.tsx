import { cn } from "@mdit/ui/lib/utils"
import {
	FileText,
	Folder,
	FolderOpen,
	type LucideIcon,
	type LucideProps,
} from "lucide-react"
import * as LucideIcons from "lucide-react"
import { useMemo } from "react"

type EntryIconProps = LucideProps & {
	name?: string | null
	isDirectory?: boolean
	isExpanded?: boolean
	className?: string
}

/** Resolve Lucide icon by name; falls back to folder/file defaults. */
export function EntryIcon({
	name,
	isDirectory = false,
	isExpanded = false,
	className,
	...props
}: EntryIconProps) {
	const Icon = useMemo((): LucideIcon => {
		if (name) {
			const candidate = (LucideIcons as Record<string, unknown>)[name]
			if (typeof candidate === "function") {
				return candidate as LucideIcon
			}
		}
		if (isDirectory) {
			return isExpanded ? FolderOpen : Folder
		}
		return FileText
	}, [name, isDirectory, isExpanded])

	return <Icon className={cn("size-4 shrink-0", className)} {...props} />
}
