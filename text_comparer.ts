import fs from 'node:fs';

const [firstFile, secondFile] = process.argv.slice(2);

if (!firstFile || !secondFile) {
  console.error('Verwendung: node text_comparer.ts <datei-1> <datei-2>');
  process.exit(2);
}

function readLines(file: string): string[] {
  return fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');
}

try {
  const firstLines = readLines(firstFile);
  const secondLines = readLines(secondFile);
  const lineCount = Math.max(firstLines.length, secondLines.length);

  for (let index = 0; index < lineCount; index++) {
    if (firstLines[index].trim() !== secondLines[index].trim()) {
      console.error(`Dateien unterscheiden sich in Zeile ${index + 1}:`);
      console.error(`< ${firstLines[index].trim() ?? '(Dateiende)'}`);
      console.error(`> ${secondLines[index].trim() ?? '(Dateiende)'}`);
      process.exit(1);
    }
  }

  console.log('Dateien sind identisch.');
}
catch (error: unknown) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(2);
}
