import { google } from 'googleapis';

export class GoogleDriveService {
  constructor(accessToken) {
    this.drive = google.drive({ version: 'v3', auth: accessToken });
  }

  async listFiles(folderId) {
    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and (mimeType='application/pdf' or mimeType='application/msword' or mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document')`,
        fields: 'files(id, name, webViewLink)',
      });
      return response.data.files;
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }
} 