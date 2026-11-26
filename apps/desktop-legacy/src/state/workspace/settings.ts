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

/** Relative path keys -> absolute path keys for entry icons */
export function readEntryIcons(
	workspacePath: string,
	icons: unknown,
): Record<string, string> {
	if (!icons || typeof icons !== "object" || Array.isArray(icons)) {
		return {}
	}
	const result: Record<string, string> = {}
	for (const [relPath, iconName] of Object.entries(icons)) {
		if (typeof relPath !== "string" || typeof iconName !== "string") continue
		const trimmed = relPath.trim()
		const name = iconName.trim()
		if (!trimmed || !name) continue
		const absolute = resolve(workspacePath, normalizePathSeparators(trimmed))
		if (isPathEqualOrDescendant(absolute, workspacePath)) {
			result[absolute] = name
		}
	}
	return result
}

export function storeEntryIcons(
	workspacePath: string,
	icons: Record<string, string>,
): Record<string, string> {
	const result: Record<string, string> = {}
	for (const [absolute, iconName] of Object.entries(icons)) {
		if (!iconName?.trim()) continue
		result[relative(workspacePath, absolute) || "."] = iconName.trim()
	}
	return result
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

export function countWords(text: string): number {
	const trimmed = text.trim()
	if (!trimmed) return 0
	return trimmed.split(/\s+/).filter((w) => w.length > 0).length
}
