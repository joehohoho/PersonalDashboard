import { Client } from '@microsoft/microsoft-graph-client';

export class OneDriveService {
  constructor(accessToken) {
    this.client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });
  }

  async listFiles(folderId) {
    try {
      const response = await this.client
        .api(`/me/drive/items/${folderId}/children`)
        .get();
      return response.value;
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  async getFileContent(fileId) {
    try {
      const response = await this.client
        .api(`/me/drive/items/${fileId}/content`)
        .get();
      return response;
    } catch (error) {
      console.error('Error getting file:', error);
      throw error;
    }
  }
} 