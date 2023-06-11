import { GoogleDriveService } from "../services/google-drive-service.js";
import * as path from 'path'
import * as fs from 'fs'

export async function uploadImage(folderName, filename) {
    const googleDriveService = new GoogleDriveService();

    const finalPath =  path.resolve('screenshots', filename);

    if (!fs.existsSync(finalPath)) {
        throw new Error(` File "${finalPath}" not found!`);
    }

    try {
        const folder = await googleDriveService.searchFolder(folderName).catch((err) => {throw new Error(err)})

        if(folder) {
            await googleDriveService.saveFile(filename, finalPath, 'image/jpg', folder.id)
        }
        
        console.info(`> File ${finalPath} uploaded successfully!\n`);

    } catch(e) {
        console.error(e)
    } finally {
        // Delete the file on the server
        if (!fs.existsSync(finalPath)) {fs.unlinkSync(finalPath)};
    }
}