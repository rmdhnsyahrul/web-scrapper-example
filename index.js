import puppeteer from "puppeteer";
import { uploadImage } from "./utils/upload.js";
import { delay } from "./utils/helper.js";
import { GoogleSpreadsheetService } from "./services/google-spreadsheet-service.js";

const STUDENT_NAME = "ZHIZIAN SHABBYANNA MALTIM";
const _URL = "https://ppdb.disdik.jabarprov.go.id/wilayah_ppdb/cadisdik/KOTA%20BOGOR/info-pendaftar";

export async function run({
  sekolahID,
  spreadsheetID,
  driveFolderName,
  type = "prestasi-rapor"
}) {
  if (!sekolahID) {
    throw new Error("Please provide sekolahID as a first argument");
  } else if(!spreadsheetID) {
    throw new Error("Please provide spreadsheetID as a second argument");
  } else if(!driveFolderName) {
    throw new Error("Please provide driveFolderName as a third argument");
  }
  
  const startTimer = new Date();

  const spreadSheetService = new GoogleSpreadsheetService(spreadsheetID);

  const BASE_URL = encodeURI(`${_URL}/${sekolahID}`);

  const title = `${startTimer
    .toJSON()
    .slice(
      0,
      10
    )}_${startTimer.getHours()}-${startTimer.getMinutes()}-${startTimer.getSeconds()}`;

  let currPage = 1;
  let pageCount = 0;
  let dataCount = 0;

  const browser = await puppeteer.launch({
    headless: "new",
    ignoreHTTPSErrors: true,
    defaultViewport: null,
  });

  const page = await browser.newPage();

  try {
    console.log(`> Folder Name "${driveFolderName}"`)
    console.log(`> Opening url... ${BASE_URL}\n`);

    await page.goto(BASE_URL, {
      waitUntil: ["domcontentloaded", "networkidle0", "networkidle2"],
    });

    // Set screen size
    await page.setViewport({ width: 1920, height: 1300 });

    const pageTitle = await page.$eval('.container .row h3', (node) => {
      return node.textContent;
    });

    // Select options
    const node = await page.waitForSelector("select#type", {
      timeout: 3000,
      visible: true,
    });
    node.select(type);

    await page.waitForResponse(async (response) => {
      const httpResponse = await response.json();
      pageCount = httpResponse.result.paginator.pageCount;

      return (
        response.url().includes(`/registrant?page=${currPage}`) &&
        response.status() === 200
      );
    });

    let result = [];

    for (let i = currPage; i <= pageCount; i++) {
      await delay(2000);
      console.log("> Scrapping table data..");

      const dataSource = await page.$$eval("tbody tr", (rows) => {
        return Array.from(rows, (row) => {
          const columns = row.querySelectorAll("td");
          return Array.from(columns, (column) => column.innerText);
        });
      });

      result = [...result, ...dataSource];

      dataCount += dataSource.length;

      console.log(`> Taking screenshot.. "${title}-page-${currPage}.jpeg"`);
      await page.screenshot({
        path: `screenshots/${title}-page-${currPage}.jpeg`,
        fullPage: true,
        type: "jpeg",
        quality: 80,
      });
      console.log(`> Done!\n`)

      console.log(`> Uploading "${title}-page-${currPage}.jpeg" into google drive..`)
      await uploadImage(driveFolderName, `${title}-page-${currPage}.jpeg`)
      console.log("> Done!\n");

      const element = await page.$(
        "li.c-page-link:not(.disabled) > .c-page-link-next"
      );

      if (element) {
        currPage++;
        console.log(
          `> Table pagination trigger, redirecting to page "${currPage}"..\n`
        );
        await element.click();
      }
    }

    console.log(`> Sorting result data...`);
    result.sort((a, b) => parseFloat(b[5]) - parseFloat(a[5]));
    console.log("> Done!\n");

    console.log(`> Writing "${result.length}" data into spreadsheet...`);
    await spreadSheetService.createWorksheet(title, result);
    console.log("> Done!\n");

    console.log(
      "================================== SUMMARY ==================================\n"
    );
    console.log(`${pageTitle}\n`)
    const noUrut = result.findIndex((a) => a[2] === STUDENT_NAME);
    console.log(`> Hasil Seleksi(SEMENTARA)`)
    console.log(`> ${STUDENT_NAME} Berada di urutan ke-${noUrut + 1} dari ${result.length} siswa\n`
    );
  } catch (err) {
    throw new Error(err);
  } finally {
    console.log(
      "=============================================================================\n"
    );
    console.log(`END> Done writing data into spreadsheet!`);
    console.log(`END> TOTAL: ${dataCount}`);
    console.log(`END> START PAGE: 1`);
    console.log(`END> END PAGE: ${currPage}`);
    console.log(
      `END> Program exited with ${(new Date() - startTimer) / 1000} sec...\n`
    );
    console.log(
      `Automatically generated at ${startTimer.toString()}`
    );
    console.log(
      `Author: rmdhn.syahrul@gmail.com\n`
    );
    console.log(
      "================================ END OF FILE ================================\n"
    );
    browser.close();
  }
};
