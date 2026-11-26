import { Button } from "@mdit/ui/components/button"
import { cn } from "@mdit/ui/lib/utils"
import {
	eachDayOfInterval,
	endOfYear,
	format,
	getDay,
	startOfYear,
	subYears,
} from "date-fns"
import { CalendarDays, X } from "lucide-react"
import { motion } from "motion/react"
import { useMemo, useState } from "react"
import { useResizablePanel } from "@/hooks/use-resizable-panel"
import { useDesktopRuntime, useWindowState, useWorkspaceState } from "@/state"

const WEEKDAYS = ["", "Mon", "", "Wed", "", "Fri", ""] as const

function intensityClass(count: number, max: number): string {
	if (count <= 0 || max <= 0) return "bg-muted/60"
	const ratio = count / max
	if (ratio < 0.2) return "bg-emerald-900/40"
	if (ratio < 0.4) return "bg-emerald-800/60"
	if (ratio < 0.6) return "bg-emerald-600/70"
	if (ratio < 0.8) return "bg-emerald-500/80"
	return "bg-emerald-400"
}

export function WritingHeatmapPanel() {
	const isCalendarPanelOpen = useWindowState((s) => s.isCalendarPanelOpen)
	const setCalendarPanelOpen =
		useDesktopRuntime().window.commands.setCalendarPanelOpen

	const { isOpen, width, isResizing, handlePointerDown } = useResizablePanel({
		storageKey: "calendar-panel-width",
		defaultWidth: 280,
		minWidth: 220,
		maxWidth: 420,
		invertDrag: true,
		isOpen: isCalendarPanelOpen,
		setIsOpen: setCalendarPanelOpen,
	})

	return (
		<motion.aside
			className="relative shrink-0 overflow-hidden"
			animate={{ width: isOpen ? width : 0 }}
			initial={false}
			transition={
				isResizing
					? { width: { duration: 0 } }
					: { width: { type: "spring", bounce: 0, duration: 0.12 } }
			}
		>
			<div
				className="flex h-full shrink-0 flex-col border-l bg-background"
				style={{ width }}
			>
				<HeatmapContent onClose={() => setCalendarPanelOpen(false)} />
			</div>
			{isOpen && (
				<div
					className="absolute top-0 -left-1 z-10 h-full w-1.5 cursor-col-resize bg-transparent transition-colors delay-100 hover:bg-foreground/20"
					onPointerDown={handlePointerDown}
				/>
			)}
		</motion.aside>
	)
}

function HeatmapContent({ onClose }: { onClose: () => void }) {
	const writingActivity = useWorkspaceState((s) => s.writingActivity)
	const [yearOffset, setYearOffset] = useState(0)

	const { days, max, total, yearLabel } = useMemo(() => {
		const now = new Date()
		const yearStart = startOfYear(subYears(now, yearOffset))
		const yearEnd =
			yearOffset === 0 ? now : endOfYear(subYears(now, yearOffset))
		const range = eachDayOfInterval({ start: yearStart, end: yearEnd })
		let maxCount = 0
		let sum = 0
		const mapped = range.map((date) => {
			const key = format(date, "yyyy-MM-dd")
			const count = writingActivity[key] ?? 0
			if (count > maxCount) maxCount = count
			sum += count
			return { date, key, count, weekday: getDay(date) }
		})
		return {
			days: mapped,
			max: maxCount,
			total: sum,
			yearLabel: format(yearStart, "yyyy"),
		}
	}, [writingActivity, yearOffset])

	const weeks = useMemo(() => {
		const cols: (typeof days)[] = []
		let current: typeof days = []
		for (const day of days) {
			if (current.length === 0 && day.weekday !== 0) {
				for (let i = 0; i < day.weekday; i++) {
					current.push({
						date: day.date,
						key: `pad-${i}`,
						count: -1,
						weekday: i,
					})
				}
			}
			current.push(day)
			if (day.weekday === 6) {
				cols.push(current)
				current = []
			}
		}
		if (current.length > 0) cols.push(current)
		return cols
	}, [days])

	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center justify-between border-b px-3 py-2">
				<div className="flex items-center gap-2 text-sm font-medium">
					<CalendarDays className="size-4 text-muted-foreground" />
					<span>Writing</span>
				</div>
				<Button
					variant="ghost"
					size="icon"
					className="size-7"
					onClick={onClose}
					aria-label="Close calendar"
				>
					<X className="size-4" />
				</Button>
			</div>

			<div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
				<button
					type="button"
					className="hover:text-foreground disabled:opacity-30"
					disabled={yearOffset >= 5}
					onClick={() => setYearOffset((y) => y + 1)}
				>
					←
				</button>
				<span className="font-medium text-foreground">{yearLabel}</span>
				<button
					type="button"
					className="hover:text-foreground disabled:opacity-30"
					disabled={yearOffset <= 0}
					onClick={() => setYearOffset((y) => Math.max(0, y - 1))}
				>
					→
				</button>
			</div>

			<div className="flex-1 overflow-auto px-3 pb-3">
				<div className="flex gap-0.5">
					<div className="flex flex-col gap-0.5 pr-1 text-[9px] text-muted-foreground leading-[11px]">
						{WEEKDAYS.map((label, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: static weekday labels
							<span key={i} className="h-[11px]">
								{label}
							</span>
						))}
					</div>
					<div className="flex gap-0.5 overflow-x-auto">
						{weeks.map((week, wi) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: week columns
							<div key={wi} className="flex flex-col gap-0.5">
								{week.map((day) =>
									day.count < 0 ? (
										<div
											key={day.key}
											className="size-[11px] rounded-[2px] bg-transparent"
										/>
									) : (
										<div
											key={day.key}
											title={`${day.key}: ${day.count} words`}
											className={cn(
												"size-[11px] rounded-[2px]",
												intensityClass(day.count, max),
											)}
										/>
									),
								)}
							</div>
						))}
					</div>
				</div>

				<div className="mt-4 space-y-1 text-xs">
					<div className="flex justify-between">
						<span className="text-muted-foreground">Words this year</span>
						<span className="font-medium tabular-nums">{total}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Best day</span>
						<span className="font-medium tabular-nums">{max}</span>
					</div>
				</div>

				<div className="mt-3 flex items-center gap-1 text-[10px] text-muted-foreground">
					<span>Less</span>
					{[0, 0.15, 0.35, 0.55, 0.75, 1].map((r) => (
						<div
							key={r}
							className={cn(
								"size-[11px] rounded-[2px]",
								intensityClass(r * Math.max(max, 1), Math.max(max, 1)),
							)}
						/>
					))}
					<span>More</span>
				</div>
			</div>
		</div>
	)
}

export function CalendarToggleButton() {
	const isOpen = useWindowState((s) => s.isCalendarPanelOpen)
	const toggle = useDesktopRuntime().window.commands.toggleCalendarPanelOpen

	return (
		<Button
			variant="ghost"
			size="icon"
			className={cn("text-foreground/70", isOpen && "bg-accent text-foreground")}
			onClick={() => toggle()}
			aria-label="Toggle writing calendar"
			title="Writing calendar"
		>
			<CalendarDays className="size-4" />
		</Button>
	)
}
