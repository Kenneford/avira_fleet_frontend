// Preload runs in a privileged context before the renderer page loads.
// Use contextBridge.exposeInMainWorld() here if you ever need to expose
// secure Node/Electron APIs to the React app.
//
// Example:
//   const { contextBridge, ipcRenderer } = require('electron')
//   contextBridge.exposeInMainWorld('electronAPI', {
//     getVersion: () => ipcRenderer.invoke('get-version'),
//   })
