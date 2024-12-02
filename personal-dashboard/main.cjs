const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

const isDev = !app.isPackaged;

// Handle IPC for time tracker launch
ipcMain.handle('launch-time-tracker', async () => {
  try {
    const timeTrackerPath = 'C:\\Users\\joe5h\\PersonalDashboard\\time-tracker-app\\build\\win-unpacked\\Time Tracker.exe';
    console.log('Attempting to launch:', timeTrackerPath);

    return new Promise((resolve, reject) => {
      // First check if file exists
      if (!require('fs').existsSync(timeTrackerPath)) {
        console.error('Time Tracker executable not found at:', timeTrackerPath);
        reject(new Error('Time Tracker executable not found'));
        return;
      }

      // Use explorer.exe to launch the application
      const process = spawn('explorer.exe', [timeTrackerPath], {
        windowsHide: false,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      process.stdout?.on('data', (data) => {
        console.log('Launch output:', data.toString());
      });

      process.stderr?.on('data', (data) => {
        console.error('Launch error:', data.toString());
      });

      process.on('error', (error) => {
        console.error('Failed to launch:', error);
        reject(error);
      });

      process.on('close', (code) => {
        console.log(`Process exited with code ${code}`);
        // Explorer.exe exits immediately after launching the app
        // So we'll consider this a success even with exit code 1
        resolve('Time Tracker launch initiated');
      });
    });
  } catch (error) {
    console.error('Launch error:', error);
    throw error;
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      nodeIntegrationInWorker: true
    }
  });

  if (isDev) {
    console.log('Running in development mode...');
    win.loadURL('http://localhost:5173');
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