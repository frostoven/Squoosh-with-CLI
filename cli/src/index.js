#!/usr/bin/env node

import { program } from 'commander/esm.mjs';
import JSON5 from 'json5';
import path from 'path';
import { promises as fsp } from 'fs';
import fs from 'fs';
import { cpus } from 'os';
import ora from 'ora';
import kleur from 'kleur';
import EventEmitter from 'events';
import { fileURLToPath } from 'url';

import { ImagePool, preprocessors, encoders } from '@frostoven/libsquoosh';
// import { ImagePool, preprocessors, encoders } from '../../libsquoosh/build/index.js';

let cliVersion;
let libVersion;
try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const packageJson = JSON.parse(
    fs.readFileSync(`${__dirname}/../package.json`).toString(),
  );
  const libJson = JSON.parse(
    fs
      .readFileSync(
        `${__dirname}/../node_modules/@frostoven/libsquoosh/package.json`,
      )
      .toString(),
  );
  cliVersion = 'v' + packageJson.version;
  libVersion = 'v' + libJson.version;
} catch (_) {
  cliVersion = 'Version: unknown';
  libVersion = 'Version: unknown';
}

const coreCount = cpus().length;
const prettyLogLimit = 16;
EventEmitter.defaultMaxListeners = 64;

process.on('unhandledRejection', (reason, promise) => {
  console.error(`Unhandled Rejection:`, promise, '\nTrace:', { reason });
});

function clamp(v, min, max) {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

const suffix = ['B', 'KB', 'MB'];

function prettyPrintSize(size) {
  const base = Math.floor(Math.log2(size) / 10);
  const index = clamp(base, 0, 2);
  return (size / 2 ** (10 * index)).toFixed(2) + suffix[index];
}

// Shows a fancy output. Used only for small file counts, larger counts glitch
// and create unreadable outputs.
function prettyProgressTracker(results) {
  const spinner = ora();
  const tracker = {};
  tracker.spinner = spinner;
  tracker.progressOffset = 0;
  tracker.totalOffset = 0;
  let status = '';
  tracker.setStatus = (text) => {
    status = text || '';
    update();
  };
  let progress = '';
  tracker.setProgress = (done, total) => {
    spinner.prefixText = kleur.dim(`${done}/${total}`);
    const completeness =
      (tracker.progressOffset + done) / (tracker.totalOffset + total);
    progress = kleur.cyan(
      `▐${'▨'.repeat((completeness * 10) | 0).padEnd(10, '╌')}▌ `,
    );
    update();
  };

  function update() {
    spinner.text = progress + kleur.bold(status) + getResultsText();
  }

  tracker.finish = (text) => {
    spinner.succeed(kleur.bold(text) + getResultsText());
  };

  function getResultsText() {
    let out = '';
    for (const result of results.values()) {
      out += `\n ${kleur.cyan(result.file)}: ${prettyPrintSize(result.size)}`;
      for (const { outputFile, size: outputSize, infoText } of result.outputs) {
        out += `\n  ${kleur.dim('└')} ${kleur.cyan(
          outputFile.padEnd(5),
        )} → ${prettyPrintSize(outputSize)}`;
        const percent = ((outputSize / result.size) * 100).toPrecision(3);
        out += ` (${kleur[outputSize > result.size ? 'red' : 'green'](
          percent + '%',
        )})`;
        if (infoText) out += kleur.yellow(infoText);
      }
    }
    return out || '\n';
  }

  spinner.start();
  return tracker;
}

// Generates plain and boring output. Used when processing large amounts of
// files.
function plainProgressTracker() {
  return {
    setStatus: (status) => console.log(kleur.bold('Status:'), status),
    setProgress: (current, total, file) => {
      if (file) {
        console.log('Progress:', `${current}/${total} (${file})`);
      } else {
        console.log('Working...');
      }
    },
    finish: () => console.log('Processing complete.'),
  };
}

async function getInputFiles(paths) {
  const validFiles = [];

  // Reading from STDIN more than once doesn't make sense, so only check the first arg.
  if (paths[0] === '-') {
    paths[0] = '/dev/stdin';
  }

  for (const inputPath of paths) {
    const files = (await fsp.lstat(inputPath)).isDirectory()
      ? (await fsp.readdir(inputPath, { withFileTypes: true }))
          .filter((dirent) => dirent.isFile())
          .map((dirent) => path.join(inputPath, dirent.name))
      : [inputPath];
    for (const file of files) {
      try {
        await fsp.stat(file);
      } catch (err) {
        if (err.code === 'ENOENT') {
          console.warn(
            `Warning: Input file does not exist: ${path.resolve(file)}`,
          );
          continue;
        } else {
          throw err;
        }
      }

      validFiles.push(file);
    }
  }

  return validFiles;
}

async function processAllFiles(allFiles, maxConcurrentFiles) {
  try {
    allFiles = await getInputFiles(allFiles);
  } catch (error) {
    console.error('->', error);
    return process.exit(1);
  }

  const results = new Map();

  if (
    allFiles.length < prettyLogLimit &&
    allFiles.length < maxConcurrentFiles
  ) {
    const progress = prettyProgressTracker(results);
    return await processBatch(allFiles, progress, maxConcurrentFiles, results);
  } else {
    const progress = plainProgressTracker(results);
    console.log(
      kleur.bold(`Will process at most ${maxConcurrentFiles} files at a time`),
    );

    const iterations = Math.ceil(allFiles.length / maxConcurrentFiles);
    for (let i = 0; i < iterations; i++) {
      const offsetStart = i * maxConcurrentFiles;
      const offsetEnd = offsetStart + maxConcurrentFiles;
      const fileBatch = allFiles.slice(offsetStart, offsetEnd);
      console.log(
        `Processing batch ${i + 1} of ${iterations} ` +
          `(images ${offsetStart + 1} through ${
            offsetStart + fileBatch.length
          })`,
      );
      await processBatch(fileBatch, progress, maxConcurrentFiles, results);
      results.clear();
      console.log();
    }
  }
}

async function processBatch(files, progressTracker, threadCount, results) {
  const imagePool = new ImagePool(threadCount);
  progressTracker.setStatus('Decoding');

  progressTracker.totalOffset = files.length;
  progressTracker.setProgress(0, files.length);

  let decoded = 0;
  let decodedFiles = await Promise.all(
    files.map(async (file) => {
      const buffer = await fsp.readFile(file);
      const image = imagePool.ingestImage(buffer);
      const decodedImage = await image.decoded;
      results.set(image, {
        file,
        size: decodedImage.size,
        outputs: [],
      });
      progressTracker.setProgress(++decoded, files.length, file);
      return image;
    }),
  );

  const preprocessOptions = {};

  for (const preprocessorName of Object.keys(preprocessors)) {
    if (!program.opts()[preprocessorName]) {
      continue;
    }
    preprocessOptions[preprocessorName] = JSON5.parse(
      program.opts()[preprocessorName],
    );
  }

  for (const image of decodedFiles) {
    image.preprocess(preprocessOptions);
  }

  await Promise.all(decodedFiles.map((image) => image.decoded));

  progressTracker.progressOffset = decoded;
  progressTracker.setStatus(
    'Encoding ' + kleur.dim(`(${imagePool.workerPool.numWorkers} threads)`),
  );
  progressTracker.setProgress(0, files.length);

  const jobs = [];
  let jobsStarted = 0;
  let jobsFinished = 0;
  for (const image of decodedFiles) {
    const originalFile = results.get(image).file;

    const encodeOptions = {
      optimizerButteraugliTarget: Number(
        program.opts().optimizerButteraugliTarget,
      ),
      maxOptimizerRounds: Number(program.opts().maxOptimizerRounds),
    };
    for (const encName of Object.keys(encoders)) {
      if (!program.opts()[encName]) {
        continue;
      }
      const encParam = program.opts()[encName];
      const encConfig =
        encParam.toLowerCase() === 'auto' ? 'auto' : JSON5.parse(encParam);
      encodeOptions[encName] = encConfig;
    }
    jobsStarted++;
    const job = image.encode(encodeOptions).then(async () => {
      jobsFinished++;
      const outputPath = path.join(
        program.opts().outputDir,
        path.basename(originalFile, path.extname(originalFile)) +
          program.opts().suffix,
      );
      for (const output of Object.values(image.encodedWith)) {
        let outputFile = `${outputPath}.${(await output).extension}`;
        if (program.opts().stdout) {
          outputFile = '/dev/stdout';
        }
        await fsp.writeFile(outputFile, (await output).binary);
        results
          .get(image)
          .outputs.push(Object.assign(await output, { outputFile }));
      }
      progressTracker.setProgress(jobsFinished, jobsStarted, originalFile);
    });
    jobs.push(job);
  }

  // update the progress to account for multi-format
  progressTracker.setProgress(jobsFinished, jobsStarted);
  // Wait for all jobs to finish
  await Promise.all(jobs);
  await imagePool.close();
  progressTracker.finish('Squoosh results:');
}

program
  .name('squoosh-cli')
  .usage('<files...> or - to read from STDIN')
  .arguments('<files...>')
  .option('-d, --output-dir <dir>', 'Output directory', '.')
  .option('-s, --suffix <suffix>', 'Append suffix to output files', '')
  .option('--stdout', 'Write single file to STDOUT instead of --output-dir')
  .option(
    '-c, --max-concurrent-files <count>',
    'Amount of files to process at once (defaults to CPU cores)',
    coreCount,
  )
  .option(
    '--max-optimizer-rounds <rounds>',
    'Maximum number of compressions to use for auto optimizations',
    '6',
  )
  .option(
    '--optimizer-butteraugli-target <butteraugli distance>',
    'Target Butteraugli distance for auto optimizer',
    '1.4',
  )
  .action((files) => {
    const outputDir = program.opts().outputDir;
    const maxConcurrentFiles = parseInt(program.opts().maxConcurrentFiles);

    // Maybe write to STDOUT. Otherwise an output dir.
    if (program.opts().stdout) {
      if (files.length != 1) {
        console.error(
          '--stdout option only make sense with a single input file.',
        );
      }
      processAllFiles(files, maxConcurrentFiles);
    } else {
      fs.mkdir(outputDir, { recursive: true }, async (error) => {
        if (error) {
          console.error(error);
          return process.exit(1);
        }
        await processAllFiles(files, maxConcurrentFiles);
      });
    }
  });

// Create a CLI option for each supported preprocessor
for (const [key, value] of Object.entries(preprocessors)) {
  program.option(`--${key} [config]`, value.description);
}
// Create a CLI option for each supported encoder
for (const [key, value] of Object.entries(encoders)) {
  program.option(
    `--${key} [config]`,
    `Use ${value.name} to generate a .${value.extension} file with the given configuration`,
  );
}

program.version(
  `CLI version:        ${cliVersion}\n` +
    `libSquoosh version: ${libVersion}\n` +
    `Node version:       ${process.version}`,
);
program.parse(process.argv);
