import {
	isPathEqualOrDescendant,
	normalizePathSeparators,
} from "@mdit/utils/path-utils"
import { join, relative, resolve } from "pathe"
import type { FileSystemRepositoryLike, WorkspaceSettings } from "./types"

export type WorkspaceSettingsRepository = ReturnType<
	typeof createWorkspaceSettingsRepository
>

type WorkspaceSettingsPatch = Omit<Partial<WorkspaceSettings>, "gitSync"> & {
	gitSync?: Partial<NonNullable<WorkspaceSettings["gitSync"]>>
}

const settingsPath = (workspacePath: string) =>
	join(workspacePath, ".mdit", "workspace.json")

export function createWorkspaceSettingsRepository(
	fileSystem: Pick<
		FileSystemRepositoryLike,
		"exists" | "mkdir" | "readTextFile" | "writeTextFile"
	>,
) {
	const writes = new Map<string, Promise<void>>()

	const read = async (workspacePath: string): Promise<WorkspaceSettings> => {
		const path = settingsPath(workspacePath)
		if (!(await fileSystem.exists(path))) {
			return {}
		}
		const content = await fileSystem.readTextFile(path)
		try {
			const decoded: unknown = JSON.parse(content)
			if (decoded && !Array.isArray(decoded) && typeof decoded === "object") {
				return decoded
			}
		} catch (error) {
			console.warn("Invalid workspace settings JSON:", path, error)
			return {}
		}
		console.warn("Invalid workspace settings:", path)
		return {}
	}

	const loadSettings = async (
		workspacePath: string,
	): Promise<WorkspaceSettings> => {
		const path = normalizePathSeparators(workspacePath)
		await writes.get(path)?.catch(() => {})
		try {
			return await read(path)
		} catch (error) {
			console.error("Failed to load workspace settings:", error)
			return {}
		}
	}

	const saveSettings = (
		workspacePath: string,
		{ gitSync, ...settings }: WorkspaceSettingsPatch,
	): Promise<void> => {
		const path = normalizePathSeparators(workspacePath)
		const pending = (writes.get(path) ?? Promise.resolve())
			.catch(() => {})
			.then(async () => {
				// Read and merge in the queue so independent preferences cannot clobber each other.
				const previous = await read(path)
				const merged: WorkspaceSettings = { ...previous, ...settings }
				if (gitSync) {
					merged.gitSync = {
						branchName: "",
						commitMessage: "",
						autoSync: false,
						...previous.gitSync,
						...gitSync,
					}
				}
				await fileSystem.mkdir(join(path, ".mdit"), { recursive: true })
				await fileSystem.writeTextFile(
					settingsPath(path),
					JSON.stringify(merged, null, 2),
				)
			})
		writes.set(path, pending)
		const release = () => {
			if (writes.get(path) === pending) {
				writes.delete(path)
			}
		}
		void pending.then(release, release)
		return pending
	}

	return { loadSettings, saveSettings }
}

export function readDirectorySettings(
	workspacePath: string,
	paths: unknown,
): string[] {
	if (!Array.isArray(paths)) {
		return []
	}
	return [
		...new Set(
			paths
				.filter(
					(path): path is string =>
						typeof path === "string" && path.trim().length > 0,
				)
				.map((path) =>
					resolve(workspacePath, normalizePathSeparators(path.trim())),
				)
				.filter((path) => isPathEqualOrDescendant(path, workspacePath)),
		),
	]
}

export function readEntryIconSettings(
	workspacePath: string,
	icons: unknown,
): Record<string, string> {
	if (!icons || typeof icons !== "object" || Array.isArray(icons)) {
		return {}
	}
	const result: Record<string, string> = {}
	for (const [path, icon] of Object.entries(icons)) {
		if (typeof icon !== "string" || !icon.trim() || !path.trim()) {
			continue
		}
		const absolute = resolve(workspacePath, normalizePathSeparators(path))
		if (isPathEqualOrDescendant(absolute, workspacePath)) {
			result[absolute] = icon.trim()
		}
	}
	return result
}

export function storeEntryIconSettings(
	workspacePath: string,
	icons: Record<string, string>,
): Record<string, string> {
	return Object.fromEntries(
		Object.entries(icons).map(([path, icon]) => [
			relative(workspacePath, path) || ".",
			icon,
		]),
	)
}

export function storeDirectorySettings(
	workspacePath: string,
	paths: string[],
): string[] {
	return paths.map((path) => relative(workspacePath, path) || ".")
}

export function readOpenedFileSettings(
	workspacePath: string,
	paths: unknown,
): string[] {
	if (!Array.isArray(paths)) {
		return []
	}
	return paths
		.filter((path): path is string => typeof path === "string")
		.slice(-5)
		.map((path) => resolve(workspacePath, path))
		.filter((path) => isPathEqualOrDescendant(path, workspacePath))
}

export function readVaultIconSetting(icon: unknown): string | null {
	return typeof icon === "string" && icon.trim() ? icon.trim() : null
}

export function readWritingActivity(raw: unknown): Record<string, number> {
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}
	const result: Record<string, number> = {}
	for (const [day, count] of Object.entries(raw)) {
		if (
			typeof day === "string" &&
			/^\d{4}-\d{2}-\d{2}$/.test(day) &&
			typeof count === "number" &&
			Number.isFinite(count) &&
			count >= 0
		) {
			result[day] = Math.floor(count)
		}
	}
	return result
}

export function todayKey(date = new Date()): string {
	const y = date.getFullYear()
	const m = String(date.getMonth() + 1).padStart(2, "0")
	const d = String(date.getDate()).padStart(2, "0")
	return `${y}-${m}-${d}`
}

const FRONTMATTER =
	/^\uFEFF?---\r?\n[\s\S]*?\r?\n(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/
const WORD_CHARACTER = /[\p{L}\p{N}]/u

/** Counts body words; ignores frontmatter and pure Markdown syntax tokens. */
export function countWords(text: string): number {
	return text
		.replace(FRONTMATTER, "")
		.split(/\s+/)
		.filter((token) => WORD_CHARACTER.test(token)).length
}
