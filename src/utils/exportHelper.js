const ExcelJS     = require('exceljs');
const PDFDocument = require('pdfkit');
const { createObjectCsvWriter } = require('csv-writer');
const path        = require('path');
const fs          = require('fs');
const { v4: uuidv4 } = require('uuid');

const tmpDir = path.join(process.cwd(), 'uploads', 'exports');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const toExcel = async (columns, rows, sheetName = 'Sheet1') => {
  const wb   = new ExcelJS.Workbook();
  const ws   = wb.addWorksheet(sheetName);
  ws.columns = columns.map((c) => ({ header: c.label, key: c.key, width: 20 }));
  rows.forEach((r) => ws.addRow(r));

  const filePath = path.join(tmpDir, `${uuidv4()}.xlsx`);
  await wb.xlsx.writeFile(filePath);
  return filePath;
};

const toCsv = async (columns, rows) => {
  const filePath = path.join(tmpDir, `${uuidv4()}.csv`);
  const writer   = createObjectCsvWriter({
    path:   filePath,
    header: columns.map((c) => ({ id: c.key, title: c.label })),
  });
  await writer.writeRecords(rows);
  return filePath;
};

const toPdf = (title, columns, rows) => {
  return new Promise((resolve) => {
    const filePath = path.join(tmpDir, `${uuidv4()}.pdf`);
    const doc      = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    const stream   = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(16).text(title, { align: 'center' });
    doc.moveDown();

    const colW  = (doc.page.width - 80) / columns.length;
    let y       = doc.y;

    // header row
    doc.fontSize(9).font('Helvetica-Bold');
    columns.forEach((c, i) => doc.text(c.label, 40 + i * colW, y, { width: colW - 4 }));
    y += 20;
    doc.moveTo(40, y).lineTo(doc.page.width - 40, y).stroke();
    y += 4;

    doc.font('Helvetica').fontSize(8);
    rows.forEach((row) => {
      if (y > doc.page.height - 60) { doc.addPage(); y = 40; }
      columns.forEach((c, i) => {
        const val = row[c.key] != null ? String(row[c.key]) : '';
        doc.text(val, 40 + i * colW, y, { width: colW - 4, lineBreak: false });
      });
      y += 16;
    });

    doc.end();
    stream.on('finish', () => resolve(filePath));
  });
};

module.exports = { toExcel, toCsv, toPdf };
