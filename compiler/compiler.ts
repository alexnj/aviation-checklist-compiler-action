import * as fs from 'fs';
import * as path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { JsonFormat } from '../efis-editor/src/model/formats/json-format';
import { FormatId } from '../efis-editor/src/model/formats/format-id';
import {
  FORMAT_REGISTRY,
  serializeChecklistFile,
} from '../efis-editor/src/model/formats/format-registry';
import {
  PdfFormat,
  PdfRenderingOptions,
} from './pdf-format';

FORMAT_REGISTRY.register(PdfFormat, FormatId.PDF4, '4-col printable PDF', {
  supportsImport: false,
  extension: '.pdf',
});

const RELEASE_URL_PREFIX = '../../releases/download/latest/';

// Polyfill for window.crypto and window.crypto.subtle for Node.js
import { randomBytes, webcrypto } from 'crypto';

type KeyUsage =
  | 'encrypt'
  | 'decrypt'
  | 'sign'
  | 'verify'
  | 'deriveKey'
  | 'deriveBits'
  | 'wrapKey'
  | 'unwrapKey';

if (typeof global.window === 'undefined') {
  (global as any).window = {
    crypto: {
      getRandomValues: (arr: Uint8Array) => randomBytes(arr.length),
      subtle: {
        importKey: async (
          format: any,
          keyData: BufferSource,
          algorithm: any,
          extractable: boolean,
          keyUsages: KeyUsage[]
        ): Promise<webcrypto.CryptoKey> => {
          if (format === 'raw' || format === 'pkcs8' || format === 'spki') {
            return webcrypto.subtle.importKey(
              format,
              keyData,
              algorithm,
              extractable,
              keyUsages as any
            );
          }
          return webcrypto.subtle.importKey(
            format,
            keyData as any,
            algorithm,
            extractable,
            keyUsages as any
          );
        },
        encrypt: async (
          algorithm: any,
          key: webcrypto.CryptoKey,
          data: BufferSource
        ): Promise<ArrayBuffer> => {
          return webcrypto.subtle.encrypt(algorithm, key, data);
        },
        decrypt: async (
          algorithm: any,
          key: webcrypto.CryptoKey,
          data: BufferSource
        ): Promise<ArrayBuffer> => {
          return webcrypto.subtle.decrypt(algorithm, key, data);
        },
      },
    },
  };
}
// End polyfill

async function convertFile(
  inputFile: string,
  outputDir: string,
  formatsToProcess: ReturnType<typeof FORMAT_REGISTRY.getSupportedOutputFormats>,
  pdfOptions: Partial<PdfRenderingOptions>
): Promise<Record<string, string>> {
  try {
    console.log(`Converting ${inputFile}`);
    const parsedInputPath = path.parse(inputFile);
    const inputContent = fs.readFileSync(inputFile, 'utf-8');
    const inputFileObject = new File([inputContent], parsedInputPath.base);
    const jsonFormat = new JsonFormat(FormatId.JSON, 'Raw data');
    const checklistFile = await jsonFormat.toProto(inputFileObject);
    const links: Record<string, string> = {};

    for (const { id, name, extension } of formatsToProcess) {
      const outputFileName =
        parsedInputPath.name +
        `.${id}` +
        ('.' + id.toString() === extension ? '' : extension);
      const outputFile = path.join(outputDir, outputFileName);
      const writtenFile = await serializeChecklistFile(
        checklistFile,
        id,
        pdfOptions
      );
      console.log(`Saving ${name} as ${outputFile}`);
      fs.writeFileSync(
        outputFile,
        Buffer.from(await writtenFile.arrayBuffer())
      );
      const downloadUrl =
        RELEASE_URL_PREFIX + outputFile.split('/').slice(2).join('.');
      links[id] = `[${id}](${downloadUrl})`;
    }
    return links;
  } catch (error) {
    console.error(
      `An error occurred during conversion of ${inputFile}:`,
      error
    );
    return {};
  }
}

function findJsonFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const fileStat = fs.lstatSync(filePath);
    if (fileStat.isDirectory()) {
      findJsonFiles(filePath, fileList);
    } else if (path.extname(file) === '.json') {
      fileList.push(filePath);
    }
  });
  return fileList;
}

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option('checklistsDir', {
      description: 'Directory containing checklist JSON files',
      type: 'string',
      default: 'checklists',
    })
    .option('outputRootDir', {
      description: 'Root directory for output files',
      type: 'string',
      default: 'output',
    })
    .option('outputMdFile', {
      description: 'Path to the output Markdown file',
      type: 'string',
      default: 'output.md',
    })
    .option('formats', {
      description: 'Comma-separated list of format IDs to generate',
      type: 'string',
    })
    .option('pdfOutputGroupHeading', {
      description: 'PDF: Whether to output group headings',
      type: 'boolean',
    })
    .option('pdfMaxIndentedTextHeight', {
      description: 'PDF: Maximum height for indented text items',
      type: 'number',
    })
    .option('pdfColorHeading', {
      description: 'PDF: Color for headings',
      type: 'string',
    })
    .option('pdfColorEmergency', {
      description: 'PDF: Color for emergency items',
      type: 'string',
    })
    .option('pdfColorAbnormal', {
      description: 'PDF: Color for abnormal items',
      type: 'string',
    })
    .option('pdfFontSize', {
      description: 'PDF: Font size for text',
      type: 'number',
    }).argv;

  const { checklistsDir, outputRootDir, outputMdFile, formats } = argv;

  const pdfOptions: Partial<PdfRenderingOptions> = {};
  if (argv.pdfOutputGroupHeading !== undefined) {
    pdfOptions.outputGroupHeading = argv.pdfOutputGroupHeading;
  }
  if (argv.pdfMaxIndentedTextHeight !== undefined) {
    pdfOptions.maxIndentedTextHeight = argv.pdfMaxIndentedTextHeight;
  }
  if (argv.pdfColorHeading) {
    pdfOptions.colorHeading = argv.pdfColorHeading.replace(/'/g, '');
  }
  if (argv.pdfColorEmergency) {
    pdfOptions.colorEmergency = argv.pdfColorEmergency.replace(/'/g, '');
  }
  if (argv.pdfColorAbnormal) {
    pdfOptions.colorAbnormal = argv.pdfColorAbnormal.replace(/'/g, '');
  }
  if (argv.pdfFontSize) {
    pdfOptions.fontSize = argv.pdfFontSize;
  }

  const requestedFormats = formats ? (formats as string).split(',') : null;
  let outputFormats = FORMAT_REGISTRY.getSupportedOutputFormats().filter(
    ({ id }) => !['json', 'pdf'].includes(id)
  );

  if (requestedFormats) {
    outputFormats = outputFormats.filter(({ id }) =>
      requestedFormats.includes(id)
    );
  }
  outputFormats.sort((a, b) => a.name.localeCompare(b.name));

  const header =
    '| Checklist | ' + outputFormats.map((f) => f.name).join(' | ') + ' |';
  const separator =
    '| --- | ' + outputFormats.map(() => '---').join(' | ') + ' |';
  const tableRows = [header, separator];

  const jsonFiles = findJsonFiles(checklistsDir);
  for (const inputFile of jsonFiles) {
    const dirname = path.dirname(inputFile);
    const outputDir = path.join(outputRootDir, dirname);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const links = await convertFile(
      inputFile,
      outputDir,
      outputFormats,
      pdfOptions
    );
    const checklistName = path.basename(inputFile);
    const rowCells = [checklistName];
    for (const format of outputFormats) {
      rowCells.push(links[format.id] || ' ');
    }
    tableRows.push(`| ${rowCells.join(' | ')} |`);
  }

  fs.writeFileSync(outputMdFile, tableRows.join('\n'));
  console.log(`Generated ${outputMdFile}`);
}

main();
