import { GoogleSpreadsheet } from "google-spreadsheet";
import puppeteer from "puppeteer";
import { creds } from "./config/cred-secret.js";
import { uploadImage } from "./utils/upload.js";
import { delay } from "./utils/helper.js";

const STUDENT_NAME = "ZHIZIAN SHABBYANNA MALTIM";

const HEADER_VALUES = [
  "No",
  "Nomor Pendaftaran",
  "Nama Pendaftar",
  "Pilihan 1",
  "Pilihan 2",
  "Skor",
]

export async function run({
  url,
  sekolahID = "69857937",
  type = "prestasi-rapor"
}) {
  if (!url) {
    throw new Error("Please provide URL as a first argument");
  }

  const BASE_URL = encodeURI(`${url}/${sekolahID}`);
  const startTimer = new Date();

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
    console.log("> Connecting to google spreadsheet..");
    const doc = new GoogleSpreadsheet(creds.spreadsheet_id);
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();
    console.log("> Done!\n");

    console.log("> Creating new sheet..");
    const sheet = await doc.addSheet({
      title,
      headerValues: HEADER_VALUES
    });
    console.log("> Done!\n");

    console.log(`> Opening url... ${BASE_URL}\n`);

    await page.goto(BASE_URL, {
      waitUntil: ["domcontentloaded", "networkidle0", "networkidle2"],
    });

    // Set screen size
    await page.setViewport({ width: 1920, height: 1300 });

    // Select options
    const node = await page.waitForSelector("select#type", {
      timeout: 1000,
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
      console.log("> Scrapping table data...\n");

      const dataSource = await page.$$eval("tbody tr", (rows) => {
        return Array.from(rows, (row) => {
          const columns = row.querySelectorAll("td");
          return Array.from(columns, (column) => column.innerText);
        });
      });

      result = [...result, ...dataSource];

      dataCount += result.length;

      console.log(`> Taking screenshot.. "screenshots/${title}-page-${currPage}.jpeg"`);

      await page.screenshot({
        path: `screenshots/${title}-page-${currPage}.jpeg`,
        fullPage: true,
        type: "jpeg",
        quality: 80,
      });

      // UPLOAD file to GDRIVE
      await uploadImage(`${title}-page-${currPage}.jpeg`)
      console.log("> Done!\n");

      const element = await page.$(
        "li.c-page-link:not(.disabled) > .c-page-link-next"
      );

      if (element) {
        currPage++;
        console.log(
          `> Table pagination trigger, paginate to "${currPage}" data into spreadsheet...\n`
        );
        await element.click();
      }
    }

    console.log(`> Sorting result data...`);
    result.sort((a, b) => parseFloat(b[5]) - parseFloat(a[5]));
    console.log("> Done!\n");

    console.log(`> Writing "${result.length}" data into spreadsheet...`);
    await sheet.addRows(result);
    console.log("> Done!\n");

    console.log(
      "====================== COLLECTING RESULT ===================================="
    );
    console.log(
      `Automatically generated at ${new Date()
        .toJSON()
        .slice(0, 19)} by: rmdhn.syahrul@gmail.com\n`
    );
    const noUrut = result.findIndex((a) => a[2] === STUDENT_NAME);
    console.log(
      `> Hasil Seleksi(SEMENTARA)`)
    console.log(
      `> NAMA SISWA = ${STUDENT_NAME}`)
    console.log(`Berada di urutan ke-${noUrut + 1} dari ${result.length} siswa\n`
    );
  } catch (err) {
    throw new Error(err);
  } finally {
    console.log(
      "=============================================================================\n"
    );
    console.log(`END> Stopped in page: ${currPage}.`);
    console.log(`END> Done writing ${dataCount} data into spreadsheet!`);
    console.log(
      `END> Program exited with ${(new Date() - startTimer) / 1000} sec...`
    );
    console.log(
      "================================ END OF FILE ================================\n"
    );
    browser.close();
  }
};
