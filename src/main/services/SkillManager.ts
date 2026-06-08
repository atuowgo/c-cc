import { readFileSync, existsSync, readdirSync, statSync, mkdirSync, copyFileSync } from 'fs'
import { join, basename, dirname } from 'path'
import type { Skill } from '../../shared/index.js'
import { getAppClaudeDir } from './ConfigManager.js'

const SKILLS_DIR = join(getAppClaudeDir(), 'skills')

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

export class SkillManager {
  private skills: Map<string, Skill> = new Map()
  private enabledSkills: Set<string> = new Set()

  scanSkills(): Skill[] {
    this.skills.clear()
    ensureDir(SKILLS_DIR)

    try {
      const entries = readdirSync(SKILLS_DIR)
      for (const entry of entries) {
        const fullPath = join(SKILLS_DIR, entry)
        const stat = statSync(fullPath)

        if (stat.isDirectory()) {
          const skillMd = join(fullPath, 'SKILL.md')
          if (existsSync(skillMd)) {
            const skill = this.parseSkill(skillMd)
            if (skill) {
              // 恢复 enabled 状态
              skill.enabled = this.enabledSkills.has(skill.name)
              this.skills.set(skill.name, skill)
            }
          }
        } else if (stat.isFile() && entry.endsWith('.md')) {
          const skill = this.parseSkill(fullPath)
          if (skill) {
            skill.enabled = this.enabledSkills.has(skill.name)
            this.skills.set(skill.name, skill)
          }
        }
      }
    } catch (err) {
      console.error('[SkillManager] Failed to scan skills:', err)
    }

    return this.listSkills()
  }

  parseSkill(mdPath: string): Skill | null {
    try {
      const content = readFileSync(mdPath, 'utf-8')
      const frontmatter = this.extractFrontmatter(content)

      const name = frontmatter.name ?? basename(dirname(mdPath))
      const description = frontmatter.description ?? ''

      return {
        name,
        description,
        path: mdPath,
        enabled: true,
        scope: 'global'
      }
    } catch (err) {
      console.error(`[SkillManager] Failed to parse skill at ${mdPath}:`, err)
      return null
    }
  }

  private extractFrontmatter(content: string): Record<string, string> {
    const result: Record<string, string> = {}

    // 支持 YAML frontmatter (---...---)
    const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/)
    if (fmMatch) {
      const fmContent = fmMatch[1]
      const lines = fmContent.split('\n')
      for (const line of lines) {
        const kvMatch = line.match(/^(\w[\w\s]*?):\s*(.*)$/)
        if (kvMatch) {
          result[kvMatch[1].trim()] = kvMatch[2].trim()
        }
      }
      return result
    }

    // 支持简单的 key: value 注释格式
    const lines = content.split('\n')
    for (const line of lines) {
      const kvMatch = line.match(/^#\s*(\w+):\s*(.*)$/)
      if (kvMatch) {
        result[kvMatch[1].trim()] = kvMatch[2].trim()
      }
    }

    return result
  }

  listSkills(): Skill[] {
    return Array.from(this.skills.values())
  }

  toggleSkill(name: string, enabled: boolean): void {
    const skill = this.skills.get(name)
    if (skill) {
      skill.enabled = enabled
      if (enabled) {
        this.enabledSkills.add(name)
      } else {
        this.enabledSkills.delete(name)
      }
    }
  }

  importSkill(sourcePath: string): { success: boolean; skill?: Skill } {
    try {
      if (!existsSync(sourcePath)) {
        throw new Error(`Source file not found: ${sourcePath}`)
      }

      ensureDir(SKILLS_DIR)

      const fileName = basename(sourcePath)
      const destPath = join(SKILLS_DIR, fileName)

      // 如果是目录，复制整个目录
      const stat = statSync(sourcePath)
      if (stat.isDirectory()) {
        const skillMd = join(sourcePath, 'SKILL.md')
        if (existsSync(skillMd)) {
          const destDir = join(SKILLS_DIR, fileName)
          ensureDir(destDir)
          this.copyDirRecursive(sourcePath, destDir)
          const skill = this.parseSkill(join(destDir, 'SKILL.md'))
          if (skill) {
            this.skills.set(skill.name, skill)
            return { success: true, skill }
          }
        }
        throw new Error('No SKILL.md found in directory')
      }

      // 复制文件
      copyFileSync(sourcePath, destPath)
      const skill = this.parseSkill(destPath)
      if (skill) {
        this.skills.set(skill.name, skill)
        return { success: true, skill }
      }
      return { success: true }
    } catch (err) {
      console.error('[SkillManager] Failed to import skill:', err)
      return { success: false }
    }
  }

  readSkillContent(name: string): { content: string; path: string } {
    const skill = this.skills.get(name)
    if (!skill) {
      throw new Error(`Skill not found: ${name}`)
    }

    const targetPath = join(SKILLS_DIR, name, 'SKILL.md')
    const filePath = existsSync(targetPath) ? targetPath : skill.path
    const content = readFileSync(filePath, 'utf-8')
    return { content, path: filePath }
  }

  private copyDirRecursive(src: string, dest: string): void {
    ensureDir(dest)
    const entries = readdirSync(src, { withFileTypes: true })
    for (const entry of entries) {
      const srcPath = join(src, entry.name)
      const destPath = join(dest, entry.name)
      if (entry.isDirectory()) {
        this.copyDirRecursive(srcPath, destPath)
      } else {
        copyFileSync(srcPath, destPath)
      }
    }
  }
}

export const skillManager = new SkillManager()