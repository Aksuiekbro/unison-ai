import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Convert mixed skill arrays (strings or objects with a name field) into clean string lists
export function normalizeSkillsInput(input?: unknown): string[] {
  if (!Array.isArray(input)) return []
  return input
    .map((skill) => {
      if (typeof skill === "string") return skill.trim()
      if (skill && typeof skill === "object") {
        const name = (skill as any).name || (skill as any).title || ""
        return typeof name === "string" ? name.trim() : ""
      }
      return ""
    })
    .filter(Boolean)
}
