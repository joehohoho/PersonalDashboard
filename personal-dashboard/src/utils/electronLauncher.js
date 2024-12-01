export const launchTimeTracker = async () => {
  console.log('Attempting to launch Time Tracker...');
  
  try {
    if (!window.require) {
      console.error('Electron require is not available');
      return;
    }

    const { ipcRenderer } = window.require('electron');
    
    try {
      const result = await ipcRenderer.invoke('launch-time-tracker');
      console.log('Launch result:', result);
    } catch (error) {
      console.error('Failed to launch Time Tracker:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in launchTimeTracker:', error);
    throw error;
  }
}; 