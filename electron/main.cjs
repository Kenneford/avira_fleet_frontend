const { app, BrowserWindow, shell, Menu, dialog } = require('electron')
const path = require('path')

const isDev = !app.isPackaged

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    title: 'Avira Fleet Management',
    show: true, // show immediately — no risk of window staying hidden
    backgroundColor: '#f8f8f8',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  Menu.setApplicationMenu(null)

  if (isDev) {
    win.loadURL('http://localhost:5174')
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html')
    win.loadFile(indexPath).catch((err) => {
      dialog.showErrorBox(
        'Failed to load app',
        `Could not load: ${indexPath}\n\n${err.message}`
      )
    })
  }

  // If the page itself reports a load failure, show it rather than silently hang
  win.webContents.on('did-fail-load', (_event, code, description) => {
    if (isDev) return // dev server may not be up yet — ignore
    dialog.showErrorBox(
      'Page failed to load',
      `Error ${code}: ${description}`
    )
  })

  // Open target="_blank" links in the system browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
