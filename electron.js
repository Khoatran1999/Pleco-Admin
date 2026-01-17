/**
 * Electron Main Process
 * FishMarket Pro Dashboard Desktop Application
 */

const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");
const fs = require("fs");

// Set Electron flag before loading backend
process.versions.electron = process.versions.electron || "1.0.0";

let mainWindow;
let serverInstance;
const PORT = 5000;

// Import backend server
// Ensure backend uses the same DB file as Electron when desired.
// You can override by setting DATABASE_PATH to an absolute path.
process.env.DATABASE_PATH =
  process.env.DATABASE_PATH ||
  require("path").join(process.cwd(), "database", "fishmarket.db");
const backendApp = require("./backend/src/server");

function startBackendServer() {
  return new Promise((resolve, reject) => {
    try {
      serverInstance = backendApp.listen(PORT, "127.0.0.1", () => {
        console.log(`🚀 Backend server running on http://localhost:${PORT}`);
        resolve();
      });

      serverInstance.on("error", (err) => {
        console.error("❌ Backend server error:", err);
        reject(err);
      });
    } catch (error) {
      console.error("❌ Failed to start backend:", error);
      reject(error);
    }
  });
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: "FishMarket Pro Dashboard",
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      webSecurity: false, // Disable for debugging
    },
    autoHideMenuBar: true,
    backgroundColor: "#0f172a", // Dark background
  });

  // Load the app
  const isDev = process.env.NODE_ENV !== "production" && !app.isPackaged;

  if (isDev) {
    // Development: load from Vite dev server (port may vary)
    const vitePort = process.env.VITE_PORT || "5173";
    const viteUrl = `http://localhost:${vitePort}`;

    console.log(`📱 Loading frontend from: ${viteUrl}`);
    mainWindow.loadURL(viteUrl);
    mainWindow.webContents.openDevTools();
  } else {
    // Production: load from backend server which serves static files
    const appUrl = `http://localhost:${PORT}`;

    console.log(`📱 Loading frontend from: ${appUrl}`);

    mainWindow.loadURL(appUrl);
    // Open DevTools for debugging
    mainWindow.webContents.openDevTools();
  }

  // Handle window events
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Setup application menu
  createApplicationMenu();
}

function createApplicationMenu() {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "Reload",
          accelerator: "CmdOrCtrl+R",
          click: () => {
            if (mainWindow) mainWindow.reload();
          },
        },
        { type: "separator" },
        {
          label: "Exit",
          accelerator: "Alt+F4",
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          label: "Toggle Developer Tools",
          accelerator: "F12",
          click: () => {
            if (mainWindow) mainWindow.webContents.toggleDevTools();
          },
        },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "About",
          click: () => {
            const { dialog } = require("electron");
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "About FishMarket Pro",
              message: "FishMarket Pro Dashboard",
              detail: `Version: ${app.getVersion()}\nElectron: ${
                process.versions.electron
              }\nChrome: ${process.versions.chrome}\nNode: ${
                process.versions.node
              }`,
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App lifecycle handlers
app.whenReady().then(async () => {
  try {
    // Start backend server first
    console.log("🔧 Starting backend server...");
    await startBackendServer();

    // Then create window
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error) {
    console.error("❌ Failed to start application:", error);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  // Quit when all windows are closed
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  // Cleanup: stop backend server
  if (serverInstance) {
    console.log("🔌 Stopping backend server...");
    serverInstance.close();
  }
});

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});
