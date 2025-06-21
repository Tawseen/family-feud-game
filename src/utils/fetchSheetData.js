// src/utils/fetchSheetData.js
import Papa from "papaparse";

export default async function fetchSheetData(url) {
  const res = await fetch(url);
  const csvText = await res.text();

  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => reject(error),
    });
  });
}
