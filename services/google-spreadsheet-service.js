import { GoogleSpreadsheet } from "google-spreadsheet";
import { creds } from "../config/cred-secret.js";

export class GoogleSpreadsheetService {
    spreadSheetService;

    constructor() {
        this.spreadSheetService = this.createService();
    }

    createService() {
        try {
            return new GoogleSpreadsheet(creds.spreadsheet_id);
        } catch(e) {
            console.error(e)
        }
    }

    async createWorksheet(title, spreadsheet) {
        try {
            console.log(`> Connecting to google spreadsheet.. @${startTime.toString()}`);
            await this.spreadSheetService.useServiceAccountAuth(creds);
            await this.spreadSheetService.loadInfo();

            console.log("> Creating new sheet..");
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