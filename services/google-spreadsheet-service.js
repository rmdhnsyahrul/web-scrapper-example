import { GoogleSpreadsheet } from "google-spreadsheet";
import { creds } from "../config/cred-secret.js";

export class GoogleSpreadsheetService {
    spreadSheetService;

    constructor(sheetID) {
        this.spreadSheetService = this.createService(sheetID);
    }

    createService(sheetID) {
        try {
            console.log(`> SHEET ID "${sheetID}"`)
            return new GoogleSpreadsheet(sheetID);
        } catch(e) {
            console.error(e)
        }
    }

    async createWorksheet(title, spreadsheet) {
        try {
            console.log(`> Connecting to google spreadsheet..`);
            await this.spreadSheetService.useServiceAccountAuth(creds);
            await this.spreadSheetService.loadInfo();

            console.log(`> Creating new sheet..`);
            const sheet = await this.spreadSheetService.addSheet({
                title,
                headerValues: [
                    "No",
                    "Nomor Pendaftaran",
                    "Nama Pendaftar",
                    "Pilihan 1",
                    "Pilihan 2",
                    "Skor",
                ]
            });
            const result = await sheet.addRows(spreadsheet)
            return result
        } catch(e) {
            console.error(e);
        } finally {
            console.log("> Done!\n");
        }
    }

}