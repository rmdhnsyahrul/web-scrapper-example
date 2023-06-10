import { google } from 'googleapis';
import * as fs from 'fs'

export class GoogleDriveService {
    driveClient;

    constructor() {
        this.driveClient = this.createDriveClient();
    }

    createDriveClient() {    
        const auth = new google.auth.GoogleAuth({
            keyFile: 'config/google-secret-key.json',
            scopes: ['https://www.googleapis.com/auth/drive'],
        });

        return google.drive({
          version: 'v3',
          auth
        });
    }

    createFolder(folderName) {
        return this.driveClient.files.create({
            resource: {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            },
            fields: 'id, name',
        });
    }
    
    searchFolder(folderName) {
        return new Promise((resolve, reject) => {
            this.driveClient.files.list(
            {
                q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}'`,
                fields: 'files(id, name)',
            },
            (err, res) => {
                if (err) {
                return reject(err);
                }

                return resolve(res.data.files ? res.data.files[0] : null);
            },
            );
        });
    }

    saveFile(fileName, filePath, fileMimeType, folderId) {
        return this.driveClient.files.create({
            requestBody: {
            name: fileName,
            mimeType: fileMimeType,
            parents: folderId ? [folderId] : [],
            },
            media: {
            mimeType: fileMimeType,
            body: fs.createReadStream(filePath),
            },
        });
    }
}