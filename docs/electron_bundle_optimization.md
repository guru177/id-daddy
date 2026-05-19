# Electron Bundle Size Optimization Guide

This guide details the steps to reduce the ID Daddy desktop application's installer size from >100MB to under 30MB, primarily by eliminating dependency duplication and maximizing compression.

## The Root Cause of the Bloat

Currently, your `apps/desktop/package.json` lists all frontend libraries (like `react`, `fabric`, `xlsx`, `recharts`) under the `"dependencies"` block. 

When you run `electron-builder`, it automatically takes everything in `"dependencies"` and packages them as raw folders inside the final `app.asar` archive. However, because you are using **Vite** to build your renderer (`dist-renderer`), Vite is *already* bundling these libraries into your compiled JavaScript files. 

**This means your users are downloading the same code twice:** Once inside your optimized Vite bundle, and once as tens of thousands of raw `node_modules` files.

---

## Step 1: Re-categorize Dependencies

To fix the duplication, you must move all libraries that Vite bundles into `"devDependencies"`. `electron-builder` will completely ignore `"devDependencies"`, preventing them from bloating the final installer.

Open `apps/desktop/package.json` and move the following packages from `"dependencies"` to `"devDependencies"`:

```diff
-  "dependencies": {
-    "@dnd-kit/core": "^6.3.1",
-    "@dnd-kit/sortable": "^10.0.0",
-    "@dnd-kit/utilities": "^3.2.2",
-    "clsx": "^2.1.1",
-    "fabric": "^5.3.0",
-    "jspdf": "^4.2.1",
-    "jszip": "^3.10.1",
-    "lucide-react": "^0.468.0",
-    "qrcode": "^1.5.4",
-    "react": "^18.3.1",
-    "react-dom": "^18.3.1",
-    "recharts": "^3.8.1",
-    "xlsx": "^0.18.5",
-    "zustand": "^5.0.13",
+  "devDependencies": {
+    "@dnd-kit/core": "^6.3.1",
+    "@dnd-kit/sortable": "^10.0.0",
+    "@dnd-kit/utilities": "^3.2.2",
+    "clsx": "^2.1.1",
+    "fabric": "^5.3.0",
+    "jspdf": "^4.2.1",
+    "jszip": "^3.10.1",
+    "lucide-react": "^0.468.0",
+    "qrcode": "^1.5.4",
+    "react": "^18.3.1",
+    "react-dom": "^18.3.1",
+    "recharts": "^3.8.1",
+    "xlsx": "^0.18.5",
+    "zustand": "^5.0.13",
     ...
```

**What stays in `"dependencies"`?**
Only packages used exclusively by the Node.js Main Process (`src/main/`) that cannot be bundled, such as:
*   `electron-updater`
*   `@id-daddy/shared` (If it's dynamically imported by the main process)

---

## Step 2: Implement Vite Chunking

While chunking doesn't drastically reduce the compressed installer size, it significantly improves the **startup speed** and memory usage of the app by parsing JavaScript in parallel.

Update your `apps/desktop/vite.config.ts` to explicitly split heavy libraries into their own chunks:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "dist-renderer",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'fabric-vendor': ['fabric'],
          'ui-vendor': ['lucide-react', 'recharts', 'clsx'],
          'utils-vendor': ['xlsx', 'jspdf', 'jszip']
        }
      }
    }
  },
  server: { port: 5180 }
});
```

---

## Step 3: Maximize NSIS Compression

`electron-builder` defaults to a fast compression algorithm to speed up your build times. For production releases, you should enforce maximum LZMA compression to shave off the remaining megabytes.

Update the `"build"` object in `apps/desktop/package.json`:

```json
  "build": {
    "appId": "com.iddaddy.desktop",
    "productName": "ID Daddy",
    "compression": "maximum", // Add this line
    "directories": {
      "output": "release"
    },
    "win": {
      "target": ["nsis"],
      ...
    },
    "nsis": {
      "oneClick": false,
      "perMachine": true,
      ...
    }
  }
```



By following these four steps, your Electron installer size will drop from **~110MB to approximately ~25-30MB**.
