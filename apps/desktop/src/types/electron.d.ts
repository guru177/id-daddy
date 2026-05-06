export {};

declare global {
  interface Window {
    idDaddy: {
      printUrl: (url: string, options?: { silent?: boolean; deviceName?: string }) => Promise<{ ok: boolean }>;
      printCurrent: (options?: { silent?: boolean; deviceName?: string }) => Promise<{ ok: boolean }>;
      versions: {
        electron: string;
        chrome: string;
        node: string;
      };
    };
  }
}
