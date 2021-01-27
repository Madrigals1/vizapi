const puppeteer = require('puppeteer');
const fs = require('fs');

const {
  log, error, getUniquePath, htmlEscape: he,
} = require('../../utils');

const { IS_DOCKER, STATIC_FOLDER } = require('../../constants');

const createStaticFolder = () => {
  if (!fs.existsSync(STATIC_FOLDER)) fs.mkdirSync(STATIC_FOLDER, null);
};

const dictToHtml = (tableDict) => {
  // We only use first row of table to determine list of possible columns
  const firstRow = tableDict[0];
  const columns = Object.keys(firstRow);

  return `
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Title</title>
    <style>
      #table-container {
        padding: 8px;
      }
      table {
        font-family: arial, sans-serif;
        border-collapse: collapse;
        width: 100%;
      }
      td, th {
        border: 1px solid #dddddd;
        text-align: left;
        padding: 8px;
      }
      tr:nth-child(even) {
        background-color: #dddddd;
      }
    </style>
  </head>
  <body>
    
    <div id="table-container">
      <table>
        <tr>${columns.map((column) => `<th>${he(column)}</th>`).join('')}</tr>
        ${tableDict.map((row) => (
    `<tr>${columns.map((column) => `<td>${he(row[column])}</td>`).join('')}</tr>`
  )).join('')}
      </table>
    </div>
    
  </body>
</html>
  `;
};

const createTable = async (tableDict) => {
  // HTML version of table
  const content = dictToHtml(tableDict);

  // Generate unique path
  const uniquePath = getUniquePath({ prefix: 'table', extension: 'png' });

  try {
    // Set options for Puppeteer
    const options = IS_DOCKER ? { args: ['--no-sandbox'] } : {};

    const browser = await puppeteer.launch(options);
    const page = await browser.newPage();
    await page.setViewport({
      width: 960,
      height: 760,
      deviceScaleFactor: 1,
    });
    await page.setContent(content);
    await page.waitForSelector('#table-container');
    const table = await page.$('#table-container');
    await table.screenshot({ path: uniquePath.absolute });
    await browser.close();
    log(`Image was created at path ${uniquePath.absolute}`);
    return uniquePath.link;
  } catch (err) {
    error(`Image was NOT created at path ${uniquePath.absolute}, error: ${err.error}`);
    return false;
  }
};

module.exports = { createTable, createStaticFolder };
