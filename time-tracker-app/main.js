const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;

async function waitForViteServer() {
  const maxAttempts = 10;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      const response = await fetch('http://localhost:5174');
      if (response.status === 200) {
        return true;
      }
    } catch (err) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  return false;
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    resizable: false,
    autoHideMenuBar: true
  });

  if (isDev) {
    console.log('Running in development mode...');
    await waitForViteServer();
    try {
      await win.loadURL('http://localhost:5174');
      win.webContents.openDevTools();
    } catch (err) {
      console.error('Failed to load dev server:', err);
    }
  } else {
    console.log('Running in production mode...');
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.log('Failed to load:', errorCode, errorDescription);
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
}); 