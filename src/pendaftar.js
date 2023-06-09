import { GoogleSpreadsheet } from "google-spreadsheet";
import puppeteer from "puppeteer";
import { creds } from "../config/cred-secret.js";

function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
 }


export async function scrapePendaftar ({url,
    sekolahID,
    type}) {

    if (!url) {
        throw new Error("Please provide URL as a first argument");
    }

    const BASE_URL = encodeURI(`${url}/${sekolahID}`)
    const startTimer = new Date();
    
    const title = `${(startTimer.toJSON().slice(0, 10))} ${startTimer.getHours()} ${startTimer.getMinutes()} ${startTimer.getSeconds()}`;

    let currPage = 1;
    let pageCount = 0;
    let dataCount = 0;

    const browser = await puppeteer.launch({
        headless: "new", 
        ignoreHTTPSErrors: true,
        defaultViewport: null
    });
    
    const page = await browser.newPage();

    try {
        console.log('> Connecting to google spreadsheet..')
        const doc = new GoogleSpreadsheet(creds.spreadsheet_id)
        await doc.useServiceAccountAuth(creds)
        await doc.loadInfo()
        console.log('> Done!\n')
        
        console.log('> Creating new sheet..')
        const sheet = await doc.addSheet({title: title, headerValues: [
            'Nomor Pendaftaran',
            'Nama Pendaftar',
            'Pilihan 1',
            'Pilihan 2',
            'Skor',
        ] })
        console.log('> Done!\n')

        console.log('> Opening url\n', BASE_URL)
    
        await page.goto(BASE_URL, {
            waitUntil: ['domcontentloaded', 'networkidle0', 'networkidle2']
        });
        
        // Set screen size
        await page.setViewport({width: 1920, height: 1300});

        // Select options
        const node = await page.waitForSelector('select#type', {timeout: 1000, visible: true});
        node.select(type);
            
        await page.waitForResponse(async response => {
            const httpResponse = await response.json();
            pageCount = httpResponse.result.paginator.pageCount;
    
            return response.url().includes(`/registrant?page=${currPage}`) && response.status() === 200;
        });
    
        for(let i = currPage; i <= pageCount; i++) {
    
            await delay(2000);
            console.log('> Scrapping table data...\n');

            const result = await page.$$eval('tbody tr', rows => {
                return Array.from(rows, row => {
                  const columns = row.querySelectorAll('td');
                  return Array.from(columns, column => column.innerText);
                });
              });

            console.log(`> Writing "${result.length}" data into spreadsheet...`)
            await sheet.addRows(result)
            console.log('> Done!\n')

            dataCount += result.length;
    
            console.log('>Taking screenshot..', currPage);
            
            await page.screenshot({path: `screenshots/${title}-page-${currPage}.jpeg`, fullPage: true, type: 'jpeg', quality: 80});
            console.log('> Done!\n')
    
            // 
            const element = await page.$('li.c-page-link:not(.disabled) > .c-page-link-next')
    
            if(element) {
                currPage++;
                console.log(`> Table pagination trigger, paginate to "${currPage}" data into spreadsheet...`)
                await element.click();
            }
        }
    } catch(err) {
        throw new Error(err);
    } finally {
        console.log(`END> Stopped in page: ${currPage}.`)
        console.log(`END> Done writing ${dataCount} data into spreadsheet!`)
        console.log(`END> Program exited with ${(new Date() - startTimer) / 1000} sec...`)
        browser.close()
    }
}