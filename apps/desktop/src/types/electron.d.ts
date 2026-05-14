export {};

declare global {
  interface Window {
    idDaddy: {
      printUrl: (url: string, options?: { silent?: boolean; deviceName?: string }) => Promise<{ ok: boolean }>;
      printCurrent: (options?: { silent?: boolean; deviceName?: string }) => Promise<{ ok: boolean }>;
      getAppVersion: () => Promise<string>;
      versions: {
        electron: string;
        chrome: string;
        node: string;
      };
      // Update APIs
      onUpdateDownloaded: (
        callback: (info: { version: string; releaseNotes: string; mandatory: boolean }) => void
      ) => () => void;
      rendererReady: () => Promise<void>;
      installUpdate: () => Promise<void>;
      dismissUpdate: () => Promise<void>;
      checkForUpdates: () => Promise<void>;
    };
  }
}
