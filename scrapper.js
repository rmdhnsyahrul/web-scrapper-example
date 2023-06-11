import schedule from "node-schedule";
import { run } from "./index.js";

// const url = process.argv[2]
// https://ppdb.disdik.jabarprov.go.id/wilayah_ppdb/cadisdik/KOTA%20BOGOR/info-pendaftar/69857937

const [
  sekolahID = "69857937", 
  spreadsheetID = "1z7crXhGWk8OqphREPBw0TcDn9GDki2qJpd_5NLe9abk", 
  driveFolderName="PPDB_DEPOK-SMA_11", type = "prestasi-rapor"
] = process.argv.slice(2);

function main() {
  schedule.scheduleJob("0 */3 * * *", function () {
    run({ sekolahID, spreadsheetID, driveFolderName, type });
  });
}

main();
