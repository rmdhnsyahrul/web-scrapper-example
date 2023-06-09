import puppeteer from "puppeteer";

module.exports = () => puppeteer.launch({
    headless: "new", 
    ignoreHTTPSErrors: true,
    defaultViewport: null
})