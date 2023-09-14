#!/opt/homebrew/bin/npx ts-node
import { exec } from 'child_process';
import * as cliProgress from 'cli-progress';
import * as fs from 'fs';
import { PassThrough, pipeline, Transform } from 'stream';
import * as zlib from 'zlib';

function getLineCount(filename: string, isGzipped: boolean): Promise<number> {
  return new Promise((resolve) => {
    exec(
      isGzipped ? `gunzip -c ${filename} | wc -l` : `wc -l ${filename}`,
      (err, stdout) => {
        if (err) {
          console.error(err);
          process.exit(1);
        }
        const lineCount = parseInt(stdout.trim().split(' ')[0]);
        if (lineCount < 1) {
          console.error(`Unable to get line count of ${filename}`);
          process.exit(1);
        }
        resolve(lineCount);
      }
    );
  });
}

class SQLCleaningStream extends Transform {
  private lastLineData = '';

  private commentLines: string[] = [];
  private skipSection = false;

  constructor(private progress: cliProgress.SingleBar) {
    super();
  }

  private transformLine(line: string) {
    this.progress.increment();
    if (
      line.startsWith('--') ||
      (line === '' && this.commentLines.length > 0)
    ) {
      if (this.skipSection) {
        this.skipSection = false;
      }
      this.commentLines.push(line);
      return;
    }

    if (this.skipSection) {
      return;
    }

    if (
      line.startsWith('CREATE EXTENSION ') ||
      line.startsWith('CREATE SCHEMA ') ||
      line.startsWith('COMMENT ON EXTENSION ') ||
      line.startsWith('CREATE TABLE airbyte.') ||
      line.startsWith('COPY public.logs ') ||
      line.startsWith('COPY public.spatial_ref_sys ') ||
      line.startsWith('COPY tiger.') ||
      line.startsWith('COPY airbyte.') ||
      line.startsWith('GRANT ALL ON SCHEMA ') ||
      line.startsWith('GRANT SELECT ON TABLE ') ||
      line.startsWith('REVOKE ALL ON SCHEMA ') ||
      line.startsWith('REVOKE ALL ON TABLE ') ||
      line.startsWith('ALTER DEFAULT PRIVILEGES FOR ROLE ')
    ) {
      this.skipSection = true;
      this.commentLines = [];
    } else {
      if (this.commentLines.length) {
        this.push(this.commentLines.join('\n') + '\n');
        this.commentLines = [];
      }
      this.push(line + '\n');
    }
  }

  _transform(chunk: unknown, _encoding: unknown, cb: any) {
    if (!(chunk instanceof Buffer)) {
      cb(new Error('Invalid chunk'));
      return;
    }

    const data = this.lastLineData + chunk.toString();

    const lines = data.split('\n');
    this.lastLineData = lines.splice(lines.length - 1, 1)[0];

    lines.forEach(this.transformLine.bind(this));
    cb();
  }

  _flush(cb: any) {
    if (this.lastLineData) {
      this.transformLine(this.lastLineData);
    }
    this.lastLineData = '';
    cb();
  }
}

async function main() {
  const filename = process.argv[2];
  const isGzipped = filename?.endsWith('.sql.gz');

  if (process.argv.length !== 3 || (!isGzipped && !filename.endsWith('.sql'))) {
    console.log(`Usage: ${process.argv[0]} *.sql.gz|*.sql`);
    process.exit(1);
  }

  const baseFilename = filename.replace(/\.sql(\.gz)?$/, '');
  const destFilename = `${baseFilename}.clean.sql`;

  if (fs.existsSync(destFilename)) {
    console.log(`${destFilename} already exists, please delete it`);
    process.exit(1);
  }

  const progress = new cliProgress.SingleBar(
    { etaBuffer: 10000, autopadding: true },
    cliProgress.Presets.shades_classic
  );

  progress.start(1, 0);
  const lineCount = await getLineCount(filename, isGzipped);
  progress.setTotal(lineCount);

  pipeline(
    fs.createReadStream(filename),
    filename.endsWith('.gz') ? zlib.createGunzip() : new PassThrough(),
    new SQLCleaningStream(progress),
    fs.createWriteStream(destFilename),
    (err: any) => {
      if (err) {
        console.log('\nERROR', err);
      } else {
        console.log(
          `\nSuccess, now run:\n  psql -h localhost -U kenchi -W kenchi < ${destFilename}`
        );
      }
      // TODO: close streams?
      process.exit(0);
    }
  );
}
main();
