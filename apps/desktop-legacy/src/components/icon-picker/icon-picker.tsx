import { cn } from "@mdit/ui/lib/utils"
import { useVirtualizer } from "@tanstack/react-virtual"
import { SearchIcon } from "lucide-react"
import {
	type KeyboardEvent,
	type RefObject,
	useMemo,
	useRef,
	useState,
} from "react"
import { getLucideIcon, searchLucideIcons } from "./lucide-icons"

const COLUMNS = 9
const CELL_SIZE = 36

type IconPickerProps = {
	value?: string | null
	onSelect: (icon: string) => void
	inputRef?: RefObject<HTMLInputElement | null>
}

export function IconPicker({ value, onSelect, inputRef }: IconPickerProps) {
	const [query, setQuery] = useState("")
	const [activeIndex, setActiveIndex] = useState(0)
	const scrollRef = useRef<HTMLDivElement | null>(null)
	const results = useMemo(() => searchLucideIcons(query), [query])
	const rowCount = Math.ceil(results.length / COLUMNS)
	const activeName = results[activeIndex] ?? null

	const virtualizer = useVirtualizer({
		count: rowCount,
		getScrollElement: () => scrollRef.current,
		estimateSize: () => CELL_SIZE,
		overscan: 4,
	})

	const moveActive = (delta: number) => {
		if (results.length === 0) {
			return
		}
		const next = Math.min(Math.max(activeIndex + delta, 0), results.length - 1)
		setActiveIndex(next)
		virtualizer.scrollToIndex(Math.floor(next / COLUMNS))
	}

	const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		const deltas: Record<string, number> = {
			ArrowRight: 1,
			ArrowLeft: -1,
			ArrowDown: COLUMNS,
			ArrowUp: -COLUMNS,
		}
		if (event.key in deltas) {
			event.preventDefault()
			moveActive(deltas[event.key])
		} else if (event.key === "Enter" && activeName) {
			event.preventDefault()
			onSelect(activeName)
		}
	}

	return (
		<div className="flex flex-col gap-2">
			<div className="relative">
				<SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
				<input
					value={query}
					onChange={(event) => {
						setQuery(event.target.value)
						setActiveIndex(0)
						scrollRef.current?.scrollTo({ top: 0 })
					}}
					onKeyDown={handleKeyDown}
					ref={inputRef}
					placeholder="Search icons…"
					aria-label="Search icons"
					className="h-8 w-full rounded-md border border-input bg-transparent pl-8 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 dark:bg-input/30"
				/>
			</div>
			<div
				ref={scrollRef}
				className="h-72 overflow-x-hidden overflow-y-auto [scrollbar-gutter:stable]"
				style={{ width: COLUMNS * CELL_SIZE + 16 }}
			>
				{results.length === 0 ? (
					<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
						No icons found
					</div>
				) : (
					<div
						role="listbox"
						aria-label="Icons"
						className="relative"
						style={{ height: virtualizer.getTotalSize() }}
					>
						{virtualizer.getVirtualItems().map((row) => (
							<div
								key={row.key}
								className="absolute left-0 flex"
								style={{ top: row.start, height: CELL_SIZE }}
							>
								{results
									.slice(row.index * COLUMNS, row.index * COLUMNS + COLUMNS)
									.map((name, column) => {
										const index = row.index * COLUMNS + column
										const Icon = getLucideIcon(name)
										if (!Icon) {
											return null
										}
										return (
											<button
												key={name}
												type="button"
												role="option"
												aria-selected={name === value}
												aria-label={name}
												title={name}
												onClick={() => onSelect(name)}
												onMouseEnter={() => setActiveIndex(index)}
												className={cn(
													"flex items-center justify-center rounded-md text-foreground/80 outline-none transition-colors",
													index === activeIndex && "bg-accent text-foreground",
													name === value && "text-primary ring-1 ring-ring/60",
												)}
												style={{ width: CELL_SIZE, height: CELL_SIZE }}
											>
												<Icon className="size-[18px]" strokeWidth={1.75} />
											</button>
										)
									})}
							</div>
						))}
					</div>
				)}
			</div>
			<div className="flex h-5 items-center justify-between text-xs text-muted-foreground">
				<span className="truncate">{activeName ?? ""}</span>
				<span>
					{results.length} {results.length === 1 ? "icon" : "icons"}
				</span>
			</div>
		</div>
	)
}
