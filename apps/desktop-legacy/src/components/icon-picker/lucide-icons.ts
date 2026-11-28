import { icons, type LucideIcon } from "lucide-react"

export function toIconName(componentName: string): string {
	return componentName
		.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
		.replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
		.replace(/(?<!\d)([a-zA-Z])(\d)/g, "$1-$2")
		.toLowerCase()
}

const iconsByName = new Map<string, LucideIcon>(
	Object.entries(icons).map(([componentName, icon]) => [
		toIconName(componentName),
		icon,
	]),
)

export const LUCIDE_ICON_NAMES: readonly string[] = [
	...iconsByName.keys(),
].sort()

export function getLucideIcon(name: string | null | undefined) {
	return name ? (iconsByName.get(name) ?? null) : null
}

function scoreIconName(name: string, terms: string[]): number | null {
	let score = 0
	for (const term of terms) {
		if (name === term) {
			continue
		}
		if (name.startsWith(term)) {
			score += 1
		} else if (name.includes(`-${term}`)) {
			score += 2
		} else if (name.includes(term)) {
			score += 3
		} else {
			return null
		}
	}
	return score
}

export function searchLucideIcons(
	query: string,
	names: readonly string[] = LUCIDE_ICON_NAMES,
): string[] {
	const terms = query
		.trim()
		.toLowerCase()
		.split(/[\s_-]+/)
		.filter(Boolean)
	if (terms.length === 0) {
		return [...names]
	}
	return names
		.map((name) => ({ name, score: scoreIconName(name, terms) }))
		.filter(
			(match): match is { name: string; score: number } => match.score !== null,
		)
		.sort(
			(a, b) =>
				a.score - b.score ||
				a.name.length - b.name.length ||
				a.name.localeCompare(b.name),
		)
		.map((match) => match.name)
}
