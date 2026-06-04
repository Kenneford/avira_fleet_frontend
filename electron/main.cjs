const { app, BrowserWindow, shell, Menu, dialog } = require('electron')
const path = require('path')
const { autoUpdater } = require('electron-updater')

const isDev = !app.isPackaged

// ── Auto-update (GitHub Releases) ───────────────────────────────────────────
// Checks the repo's Releases for a newer version, downloads it in the
// background, and offers to restart-and-install. Only runs in the packaged app.
let updateWin = null
function initAutoUpdate(win) {
  if (isDev) return // never check during local development
  updateWin = win
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-downloaded', (info) => {
    dialog
      .showMessageBox(updateWin, {
        type: 'info',
        buttons: ['Restart now', 'Later'],
        defaultId: 0,
        title: 'Update ready',
        message: `Avira Fleet ${info.version} has been downloaded.`,
        detail: 'Restart the app to apply the update.',
      })
      .then(({ response }) => {
        if (response === 0) autoUpdater.quitAndInstall()
      })
  })

  autoUpdater.on('error', (err) => {
    // Don't interrupt the user — updates simply retry next launch.
    console.error('autoUpdater error:', err == null ? 'unknown' : (err.stack || err).toString())
  })

  // Check on launch, then every 6 hours while the app stays open.
  autoUpdater.checkForUpdatesAndNotify().catch(() => {})
  setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 6 * 60 * 60 * 1000)
}

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

  // Start checking for updates once the window exists.
  initAutoUpdate(win)
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
