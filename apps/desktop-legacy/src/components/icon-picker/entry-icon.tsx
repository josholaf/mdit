import { cn } from "@mdit/ui/lib/utils"
import type { LucideIcon } from "lucide-react"
import { getLucideIcon } from "./lucide-icons"

export function EntryIcon({
	icon,
	fallback,
	className,
}: {
	icon?: string | null
	fallback: LucideIcon
	className?: string
}) {
	const Icon = getLucideIcon(icon) ?? fallback
	return (
		<Icon
			className={cn("size-4 shrink-0", className)}
			strokeWidth={1.75}
			aria-hidden
		/>
	)
}
