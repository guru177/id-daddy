import { app, BrowserWindow, ipcMain, Menu, dialog } from "electron";
import { autoUpdater } from "electron-updater";
import path from "node:path";

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 720,
    backgroundColor: "#fdfaf5",
    titleBarStyle: "hidden",
    icon: path.join(__dirname, "../resources/icon.png"),
    titleBarOverlay: {
      color: "#fdfaf5",
      symbolColor: "#2c3e50",
      height: 32
    },
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.removeMenu();
  mainWindow.setMenuBarVisibility(false);

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    void mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    void mainWindow.loadFile(path.join(__dirname, "../dist-renderer/index.html"));
  }
}

Menu.setApplicationMenu(null);

app.whenReady().then(() => {
  createWindow();
  autoUpdater.checkForUpdatesAndNotify().catch(() => undefined);

  // Debugging auto-updater
  autoUpdater.on("error", (err) => {
    console.error("AutoUpdater Error:", err);
  });
  
  autoUpdater.on("update-available", (info) => {
    console.log("Update available:", info.version);
  });
  
  autoUpdater.on("update-not-available", (info) => {
    console.log("Update not available. Current version is up to date.");
  });

  // Notify user when an update is fully downloaded
  autoUpdater.on("update-downloaded", (info) => {
    dialog.showMessageBox({
      type: "info",
      title: "Update Available",
      message: `Version ${info.version} has been downloaded and is ready to install.`,
      buttons: ["Restart and Install", "Later"]
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("print-current", async (_event, options?: { silent?: boolean; deviceName?: string }) => {
  if (!mainWindow) {
    return { ok: false };
  }

  const ok = await printWebContents(mainWindow, options);
  return { ok };
});

ipcMain.handle("print-url", async (_event, url: string, options?: { silent?: boolean; deviceName?: string }) => {
  const printWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      sandbox: true
    }
  });

  await printWindow.loadURL(url);
  const ok = await printWebContents(printWindow, options);
  printWindow.close();
  return { ok };
});

function printWebContents(window: BrowserWindow, options?: { silent?: boolean; deviceName?: string }) {
  return new Promise<boolean>((resolve) => {
    window.webContents.print(
      {
        silent: options?.silent ?? false,
        deviceName: options?.deviceName,
        printBackground: true
      },
      (success) => resolve(success)
    );
  });
}
