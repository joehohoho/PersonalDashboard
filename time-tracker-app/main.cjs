const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const createWindow = () => {
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

  // Always use the built files
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  console.log('Loading from:', indexPath);
  
  if (fs.existsSync(indexPath)) {
    win.loadFile(indexPath);
  } else {
    console.error('Could not find index.html at:', indexPath);
    console.log('Current directory contents:', fs.readdirSync(__dirname));
    app.quit();
  }
};

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