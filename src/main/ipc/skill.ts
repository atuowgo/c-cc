import { ipcMain } from 'electron'
import { SkillToggleSchema, SkillImportSchema } from '../../shared/schemas'
import type { SkillManager } from '../services/SkillManager'

export function registerSkillHandlers(skillManager: SkillManager): void {
  ipcMain.handle('skill:list', async () => {
    return skillManager.listSkills()
  })

  ipcMain.handle('skill:toggle', async (_event, args) => {
    const { name, enabled } = SkillToggleSchema.parse(args)
    skillManager.toggleSkill(name, enabled)
    return { success: true }
  })

  ipcMain.handle('skill:import', async (_event, args) => {
    const { sourcePath } = SkillImportSchema.parse(args)
    return skillManager.importSkill(sourcePath)
  })

  ipcMain.handle('skill:read', async (_event, args) => {
    const { name } = SkillToggleSchema.pick({ name: true }).parse(args)
    return skillManager.readSkillContent(name)
  })
}