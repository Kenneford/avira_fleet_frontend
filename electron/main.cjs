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

// ── Manual "Check for Updates" (from the Help menu) ─────────────────────────
function checkForUpdatesManual(win) {
  if (isDev) {
    dialog.showMessageBox(win, {
      type: 'info',
      title: 'Updates',
      message: 'Update checks are disabled in development.',
    })
    return
  }
  autoUpdater.once('update-not-available', () => {
    dialog.showMessageBox(win, {
      type: 'info',
      title: 'No updates',
      message: `You're up to date.`,
      detail: `Avira Fleet ${app.getVersion()} is the latest version.`,
    })
  })
  autoUpdater.once('update-available', (info) => {
    dialog.showMessageBox(win, {
      type: 'info',
      title: 'Update available',
      message: `Version ${info.version} is downloading…`,
      detail: `You'll be prompted to restart when it's ready.`,
    })
  })
  autoUpdater.checkForUpdates().catch((err) => {
    dialog.showMessageBox(win, {
      type: 'error',
      title: 'Update check failed',
      message: 'Could not check for updates.',
      detail: String(err && err.message ? err.message : err),
    })
  })
}

function showAbout(win) {
  dialog.showMessageBox(win, {
    type: 'info',
    title: 'About Avira Fleet',
    message: 'Avira Fleet Management',
    detail: `Version ${app.getVersion()}\n© Avira Transport`,
  })
}

// ── Application menu (Reload, Edit, Zoom, DevTools, Updates, etc.) ───────────
function buildMenu(win) {
  const isMac = process.platform === 'darwin'
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: 'File',
      submenu: [isMac ? { role: 'close' } : { role: 'quit' }],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },        // Ctrl/Cmd+R
        { role: 'forceReload' },   // Ctrl/Cmd+Shift+R
        { role: 'toggleDevTools' },// Ctrl/Cmd+Shift+I / F12
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [{ type: 'separator' }, { role: 'front' }] : [{ role: 'close' }]),
      ],
    },
    {
      label: 'Help',
      submenu: [
        { label: 'Check for Updates…', click: () => checkForUpdatesManual(win) },
        { type: 'separator' },
        { label: 'About Avira Fleet', click: () => showAbout(win) },
      ],
    },
  ]
  return Menu.buildFromTemplate(template)
}

// Right-click context menu — copy/paste/select on inputs and selected text.
function attachContextMenu(win) {
  win.webContents.on('context-menu', (_event, params) => {
    const items = []
    if (params.isEditable || params.selectionText) {
      items.push(
        { role: 'cut', enabled: params.editFlags.canCut },
        { role: 'copy', enabled: params.editFlags.canCopy },
        { role: 'paste', enabled: params.editFlags.canPaste },
        { type: 'separator' },
        { role: 'selectAll' },
      )
    }
    if (isDev) {
      items.push(
        { type: 'separator' },
        { label: 'Inspect element', click: () => win.webContents.inspectElement(params.x, params.y) },
      )
    }
    if (items.length) Menu.buildFromTemplate(items).popup({ window: win })
  })
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

  // Full application menu — Reload, Edit (copy/paste/undo), Zoom, DevTools,
  // Fullscreen, and Check for Updates. (Previously the menu was removed
  // entirely, which also disabled Ctrl+R reload and copy/paste shortcuts.)
  Menu.setApplicationMenu(buildMenu(win))
  attachContextMenu(win)

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
