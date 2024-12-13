const GOOGLE_DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

let tokenClient;
let accessToken = null;
let isInitialized = false;

const loadGoogleScript = () => {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google API script'));
    document.head.appendChild(script);
  });
};

const initializeGoogleAuth = async () => {
  return new Promise((resolve, reject) => {
    try {
      if (!window.google) {
        reject(new Error('Google API not loaded'));
        return;
      }

      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
          if (response.error) {
            reject(response);
          } else {
            accessToken = response.access_token;
            resolve(response);
          }
        },
      });
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

export const loadGoogleDriveApi = async () => {
  if (isInitialized) {
    return Promise.resolve();
  }

  try {
    await loadGoogleScript();
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure script is ready
    await initializeGoogleAuth();
    isInitialized = true;
  } catch (error) {
    console.error('Error initializing Google Drive API:', error);
    throw error;
  }
};

export const getAccessToken = async () => {
  if (accessToken) {
    return accessToken;
  }

  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Token client not initialized'));
      return;
    }

    // Handle the callback when token is received
    const originalCallback = tokenClient.callback;
    tokenClient.callback = (response) => {
      if (response.error !== undefined) {
        reject(response);
      } else {
        accessToken = response.access_token;
        resolve(accessToken);
      }
      tokenClient.callback = originalCallback;
    };

    try {
      // Request token with immediate mode first
      tokenClient.requestAccessToken({ prompt: '' });
    } catch (err) {
      console.error('Immediate mode failed, trying with consent prompt', err);
      // If immediate mode fails, try with consent prompt
      tokenClient.requestAccessToken({ prompt: 'consent' });
    }
  });
};

export const listFiles = async (folderId) => {
  if (!folderId) {
    console.warn('No folder ID provided');
    return [];
  }

  try {
    console.log('Getting access token...');
    const token = await getAccessToken();
    console.log('Access token received');

    const query = `'${folderId}' in parents and (mimeType='application/pdf' or mimeType='application/msword' or mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document')`;
    const url = `${GOOGLE_DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)`;
    
    console.log('Fetching from URL:', url);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error:', errorText);
      throw new Error(`Failed to fetch files: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Files retrieved:', data);
    return data.files;
  } catch (error) {
    console.error('Detailed error in listFiles:', error);
    throw error;
  }
};

export const getFileContent = async (fileId) => {
  try {
    const accessToken = await getAccessToken();
    const response = await fetch(
      `${GOOGLE_DRIVE_API_BASE}/files/${fileId}?alt=media`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch file content');
    }

    return await response.blob();
  } catch (error) {
    console.error('Error getting file content:', error);
    throw error;
  }
};