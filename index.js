import schedule from 'node-schedule'
import { scrapePendaftar } from './src/pendaftar.js';

// const url = process.argv[2]
// https://ppdb.disdik.jabarprov.go.id/wilayah_ppdb/cadisdik/KOTA%20BOGOR/info-pendaftar/69857937

const [
    url,
    sekolahID = '69857937',
    type = 'prestasi-rapor'
] = process.argv.slice(2)

function main () {
    schedule.scheduleJob('59 8,13,19,23 * * *', function() {
        scrapePendaftar({url, sekolahID, type})
    });
}

main();