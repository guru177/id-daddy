import { app, BrowserWindow, ipcMain, Menu } from "electron";
import { autoUpdater } from "electron-updater";
import path from "node:path";

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 720,
    backgroundColor: "#f7f7f4",
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
    void mainWindow.loadFile(path.join(__dirname, "../../dist-renderer/index.html"));
  }
}

Menu.setApplicationMenu(null);

app.whenReady().then(() => {
  createWindow();
  autoUpdater.checkForUpdatesAndNotify().catch(() => undefined);

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
