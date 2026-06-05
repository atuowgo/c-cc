import { ipcMain, dialog } from 'electron'
import { readFileSync } from 'fs'
import { basename } from 'path'
import type { FileAttachment } from '../../shared/types'

export function registerFileHandlers(): void {
  ipcMain.handle('file:pick-directory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return { path: result.filePaths[0] }
  })

  ipcMain.handle('file:pick-files', async (_event, args) => {
    const filters = (args as { filters?: Array<{ name: string; extensions: string[] }> })?.filters ?? []

    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters
    })

    if (result.canceled) {
      return []
    }

    const attachments: FileAttachment[] = result.filePaths.map((filePath) => {
      const ext = filePath.split('.').pop()?.toLowerCase()
      let type: FileAttachment['type'] = 'text'
      if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'gif' || ext === 'webp') {
        type = 'image'
      } else if (ext === 'pdf') {
        type = 'pdf'
      }

      return {
        name: basename(filePath),
        path: filePath,
        type
      }
    })

    return attachments
  })

  ipcMain.handle('file:read', async (_event, args) => {
    const { path } = args as { path: string }
    const content = readFileSync(path, 'utf-8')
    return { content, name: basename(path) }
  })
}