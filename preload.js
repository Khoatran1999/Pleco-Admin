/**
 * Electron Preload Script
 * Provides safe bridge between main and renderer processes
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Platform info
  platform: process.platform,
  isElectron: true,
  
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Future: You can add more APIs here as needed
  // Example: database backup, file operations, etc.
});

console.log('✅ Preload script loaded');
