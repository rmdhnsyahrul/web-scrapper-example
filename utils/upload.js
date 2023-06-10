import { GoogleDriveService } from "../services/google-drive-service.js";
import * as path from 'path'
import * as fs from 'fs'

export async function uploadImage(filename) {
    const googleDriveService = new GoogleDriveService();

    const finalPath =  path.resolve('screenshots', filename);

    const folderName = 'PPDB SMA 2023';

    if (!fs.existsSync(finalPath)) {
        throw new Error(` File "${finalPath}" not found!`);
    }

    const folder = await googleDriveService.searchFolder(folderName).catch((err) => {throw new Error(err)})
    
    await googleDriveService.saveFile(filename, finalPath, 'image/jpg', folder.id).catch(err => {throw new Error(err)})
    
    console.info(`File ${finalPath} uploaded successfully!\n`);

    // Delete the file on the server
    fs.unlinkSync(finalPath);

}