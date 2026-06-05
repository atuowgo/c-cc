import { BrowserWindow } from 'electron'
import { createMainWindow } from '../windows/mainWindow'

export class WindowManager {
  private static instance: WindowManager
  private mainWindow: BrowserWindow | null = null

  static getInstance(): WindowManager {
    if (!WindowManager.instance) {
      WindowManager.instance = new WindowManager()
    }
    return WindowManager.instance
  }

  createMainWindow(): BrowserWindow {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      return this.mainWindow
    }
    this.mainWindow = createMainWindow()
    this.mainWindow.on('closed', () => {
      this.mainWindow = null
    })
    return this.mainWindow
  }

  getMainWindow(): BrowserWindow | null {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      return this.mainWindow
    }
    return null
  }
}