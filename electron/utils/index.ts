import { PDFDocument } from "pdf-lib";
import xlsx from "node-xlsx";
import fs from "fs";
import path from "path";
import wins from "../wins";

export async function mergePdf(filePath: string, savedPath: string) {
  const files = fs.readdirSync(filePath, { encoding: "utf-8" });
  const fileList: any[] = [];
  const listExcelFilename = files.find((filename) => {
    if (filename.startsWith("发票清单")) {
      console.log(filename);
      return true;
    }
  });
  console.log(listExcelFilename);
  if (!listExcelFilename) {
    throw new Error("没有发票清单excel文件");
  }

  const workSheetsFromFile = xlsx.parse(
    path.resolve(filePath, listExcelFilename)
  );
  workSheetsFromFile[0].data.forEach((row, index) => {
    if (index === 0) {
      return;
    }

    // 取发票号码
    const code = row[0];
    for (let i = 0; i < files.length; i++) {
      const filename = files[i];
      if (filename.includes(code)) {
        fileList.push({ path: path.resolve(filePath, filename) });
        break;
      }
    }
  });

  const doc = await PDFDocument.create();

  const pr = (94 / fileList.length) >> 0;
  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    const { path, name } = file;
    const pdfBuffer = fs.readFileSync(path);
    const pdf = await PDFDocument.load(pdfBuffer);
    const copiedPages = await doc.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => {
      doc.addPage(page);
      doc.addPage(page);
    });
    setMainWinProgressBar(pr * (i + 1));
  }
  const buf = await doc.save();
  fs.writeFile(savedPath, buf, { flag: "w" }, (err) => {
    console.log("wrote the file successfully");
  });
  // fs.open(savedPath, 'w', function (err, fd) {
  //     fs.write(fd, buf, 0, buf.length, null, function (err) {
  //         fs.close(fd, function () {
  //             console.log('wrote the file successfully')
  //         })
  //     })
  // })
}

export function setMainWinProgressBar(p: number = 0) {
  if (wins.mainwin) {
    wins.mainwin.setProgressBar(p);
  }
}
