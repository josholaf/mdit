import { Button } from "@mdit/ui/components/button"
import { cn } from "@mdit/ui/lib/utils"
import {
	addDays,
	addMonths,
	eachDayOfInterval,
	endOfMonth,
	endOfWeek,
	format,
	isSameDay,
	isSameMonth,
	startOfMonth,
	startOfWeek,
	subWeeks,
} from "date-fns"
import {
	CalendarDays,
	ChevronLeft,
	ChevronRight,
	FileText,
	X,
} from "lucide-react"
import { motion } from "motion/react"
import { useMemo, useState } from "react"
import { useResizablePanel } from "@/hooks/use-resizable-panel"
import { useDesktopRuntime, useWindowState, useWorkspaceState } from "@/state"
import { todayKey } from "@/state/workspace/settings"
import type { WorkspaceEntry } from "@/state/workspace/types"

const DAILY_WORD_GOAL = 500
const HEATMAP_WEEKS = 20
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const
const HEATMAP_ROWS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const

function intensityClass(count: number, max: number): string {
	if (count <= 0 || max <= 0) return "bg-muted"
	const ratio = count / max
	if (ratio < 0.25) return "bg-emerald-900"
	if (ratio < 0.5) return "bg-emerald-700"
	if (ratio < 0.75) return "bg-emerald-500"
	return "bg-emerald-400"
}

export function WritingHeatmapPanel() {
	const isCalendarPanelOpen = useWindowState((s) => s.isCalendarPanelOpen)
	const setCalendarPanelOpen =
		useDesktopRuntime().window.commands.setCalendarPanelOpen

	const { isOpen, width, isResizing, handlePointerDown } = useResizablePanel({
		storageKey: "calendar-panel-width",
		defaultWidth: 320,
		minWidth: 260,
		maxWidth: 440,
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
				className="flex h-full shrink-0 flex-col overflow-y-auto border-l bg-background"
				style={{ width }}
			>
				<div className="flex justify-end px-2 pt-2">
					<Button
						variant="ghost"
						size="icon"
						className="size-7 text-muted-foreground"
						onClick={() => setCalendarPanelOpen(false)}
						aria-label="Close writing calendar"
					>
						<X className="size-4" />
					</Button>
				</div>
				<MonthCalendar />
				<div className="flex flex-col gap-3 border-t p-3">
					<TodayCard />
					<ActivityHeatmap />
					<EntriesToday />
				</div>
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

function MonthCalendar() {
	const writingActivity = useWorkspaceState((s) => s.writingActivity)
	const [month, setMonth] = useState(() => startOfMonth(new Date()))
	const today = new Date()

	const days = useMemo(
		() =>
			eachDayOfInterval({
				start: startOfWeek(month),
				end: endOfWeek(endOfMonth(month)),
			}),
		[month],
	)

	return (
		<div className="px-4 pb-3">
			<div className="flex items-center justify-between pb-3">
				<h2 className="font-semibold text-2xl tracking-tight">
					{format(month, "MMM")}{" "}
					<span className="text-muted-foreground">{format(month, "yyyy")}</span>
				</h2>
				<div className="flex items-center">
					<Button
						variant="ghost"
						size="icon"
						className="size-7"
						onClick={() => setMonth((m) => addMonths(m, -1))}
						aria-label="Previous month"
					>
						<ChevronLeft className="size-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						className="h-7 px-2 font-semibold text-muted-foreground text-xs tracking-wider"
						onClick={() => setMonth(startOfMonth(new Date()))}
					>
						TODAY
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="size-7"
						onClick={() => setMonth((m) => addMonths(m, 1))}
						aria-label="Next month"
					>
						<ChevronRight className="size-4" />
					</Button>
				</div>
			</div>
			<div className="grid grid-cols-7 gap-y-1 text-center text-sm">
				{WEEKDAYS.map((day) => (
					<div
						key={day}
						className="pb-1 font-semibold text-[11px] text-muted-foreground uppercase tracking-wide"
					>
						{day}
					</div>
				))}
				{days.map((day) => {
					const words = writingActivity[todayKey(day)] ?? 0
					return (
						<div
							key={day.toISOString()}
							className={cn(
								"relative flex h-8 items-center justify-center",
								!isSameMonth(day, month) && "text-muted-foreground/40",
								isSameDay(day, today) && "font-semibold text-muted-foreground",
							)}
							title={words > 0 ? `${words} words` : undefined}
						>
							{format(day, "d")}
							{words > 0 && (
								<span className="absolute bottom-0.5 size-1 rounded-full bg-emerald-400" />
							)}
						</div>
					)
				})}
			</div>
		</div>
	)
}

function TodayCard() {
	const words = useWorkspaceState((s) => s.writingActivity[todayKey()] ?? 0)
	const progress = Math.min(100, (words / DAILY_WORD_GOAL) * 100)

	return (
		<div className="rounded-lg border bg-muted/30 px-3 py-2.5">
			<div className="text-muted-foreground text-sm">Today</div>
			<div className="font-semibold text-lg">
				{words.toLocaleString()} {words === 1 ? "word" : "words"}
			</div>
			<div
				className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
				title={`Goal: ${DAILY_WORD_GOAL} words`}
			>
				<div
					className="h-full rounded-full bg-muted-foreground/60 transition-[width]"
					style={{ width: `${progress}%` }}
				/>
			</div>
		</div>
	)
}

function ActivityHeatmap() {
	const writingActivity = useWorkspaceState((s) => s.writingActivity)

	const { weeks, max, monthLabels } = useMemo(() => {
		const end = endOfWeek(new Date(), { weekStartsOn: 1 })
		const start = startOfWeek(subWeeks(end, HEATMAP_WEEKS - 1), {
			weekStartsOn: 1,
		})
		const weeks = Array.from({ length: HEATMAP_WEEKS }, (_, week) =>
			Array.from({ length: 7 }, (_, day) => addDays(start, week * 7 + day)),
		)
		const max = Math.max(0, ...Object.values(writingActivity))
		const monthLabels = weeks.map((week, index) => {
			const first = week[0]
			const previous = weeks[index - 1]?.[0]
			return !previous || !isSameMonth(first, previous)
				? format(first, "MMM")
				: ""
		})
		monthLabels[0] = ""
		return { weeks, max, monthLabels }
	}, [writingActivity])

	const today = new Date()

	return (
		<div
			className="grid gap-[3px] rounded-lg border bg-muted/30 p-2.5 text-[11px] text-muted-foreground"
			style={{
				gridTemplateColumns: `auto repeat(${HEATMAP_WEEKS}, minmax(0, 1fr))`,
			}}
		>
			<div />
			{monthLabels.map((label, index) => (
				<div
					key={index}
					className="overflow-visible whitespace-nowrap leading-4"
				>
					{label}
				</div>
			))}
			{HEATMAP_ROWS.map((rowLabel, row) => (
				<HeatmapRow
					key={rowLabel}
					label={rowLabel}
					days={weeks.map((week) => week[row])}
					max={max}
					today={today}
					writingActivity={writingActivity}
				/>
			))}
		</div>
	)
}

function HeatmapRow({
	label,
	days,
	max,
	today,
	writingActivity,
}: {
	label: string
	days: Date[]
	max: number
	today: Date
	writingActivity: Record<string, number>
}) {
	return (
		<>
			<div className="pr-1.5 leading-none">{label}</div>
			{days.map((day) => {
				const count = writingActivity[todayKey(day)] ?? 0
				const isFuture = day > today
				return (
					<div
						key={day.toISOString()}
						className={cn(
							"aspect-square w-full max-w-3 self-center justify-self-center rounded-full",
							isFuture ? "bg-transparent" : intensityClass(count, max),
							isSameDay(day, today) && "ring-1 ring-foreground/70",
						)}
						title={`${format(day, "EEE, MMM d")}: ${count} words`}
					/>
				)
			})}
		</>
	)
}

function collectNotes(
	entries: WorkspaceEntry[],
	today: Date,
	notes: { all: Set<string>; today: Set<string> },
) {
	for (const entry of entries) {
		if (entry.isDirectory) {
			collectNotes(entry.children ?? [], today, notes)
		} else if (entry.name.toLowerCase().endsWith(".md")) {
			notes.all.add(entry.path)
			if (entry.modifiedAt && isSameDay(entry.modifiedAt, today)) {
				notes.today.add(entry.path)
			}
		}
	}
}

function EntriesToday() {
	const entries = useWorkspaceState((s) => s.entries)
	const writingEntries = useWorkspaceState((s) => s.writingEntries)
	const openTab = useDesktopRuntime().documents.commands.openTab

	const notes = useMemo(() => {
		const today = new Date()
		const notes = { all: new Set<string>(), today: new Set<string>() }
		collectNotes(entries, today, notes)
		const key = todayKey(today)
		for (const [path, day] of Object.entries(writingEntries)) {
			if (day === key && notes.all.has(path)) notes.today.add(path)
		}
		return [...notes.today].sort()
	}, [entries, writingEntries])

	return (
		<div className="rounded-lg border bg-muted/30">
			<div className="border-b px-3 py-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
				Entries today
			</div>
			<div className="flex flex-col p-1">
				{notes.length === 0 ? (
					<div className="px-2 py-1.5 text-muted-foreground text-sm">
						No notes edited yet
					</div>
				) : (
					notes.map((path) => (
						<button
							key={path}
							type="button"
							className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
							onClick={() => openTab(path)}
							title={path}
						>
							<FileText className="size-4 shrink-0 text-muted-foreground" />
							<span className="truncate">
								{path.split(/[\\/]/).pop()?.replace(/\.md$/i, "")}
							</span>
						</button>
					))
				)}
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
			className={cn(
				"text-foreground/70",
				isOpen && "bg-accent text-foreground",
			)}
			onClick={() => toggle()}
			aria-label="Toggle writing calendar"
			title="Writing calendar"
		>
			<CalendarDays className="size-4" />
		</Button>
	)
}
