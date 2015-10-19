import fs from 'fs';
import mkdirp from 'mkdirp';
import got from 'got';
import cheerio from 'cheerio';
import slug from 'slug';
import elegantSpinner from 'elegant-spinner';
import logUpdate from 'log-update';
import Bottleneck from 'bottleneck';

let frame = elegantSpinner();

const BASE_URL = 'http://www.darklegacycomics.com';

let blacklisted = [61, 186, 209];

async function fetch(path) {
  try {
    let { body } = await got(`${BASE_URL}/archive`);
    let $ = cheerio.load(body);

    let selector = $('.archive .title a');
    let count = (selector.length - blacklisted.length);

    var limiter = new Bottleneck(20, 250);

    let downloadCount = 0;
    let errors = [];

    setInterval(() => {
      let log = [`Downloaded ${downloadCount} of ${count} ${frame()}`];

      if (errors.length > 0) {
        errors.forEach(e => log.push(`Comic #${e.idx + 1} ${e.title} failed to download (${e.err.statusCode})`));
      }

      logUpdate(log.join('\n'));

      if (downloadCount === (count - errors.length)) {
        console.log(`Finished downloading`);

        process.exit(0);
      }
    }, 50);

    selector.each((idx, element) => {
      if (blacklisted.indexOf(idx + 1) > -1) {
        return;
      }

      var title = $(element).text();

      limiter.submit((cb) => {
        let stream = got.stream(`${BASE_URL}/comics/${idx + 1}.jpg`);
        stream.on('error', err => {
          errors.push({err, idx, title});
        });

        let writeStream = fs.createWriteStream(`${path}/${idx + 1}-${slug(title)}.jpg`);
        writeStream.on('finish', () => {
          downloadCount = downloadCount + 1;

          cb();
        });
        writeStream.on('error', err => {
          console.log(err);
        });

        stream.pipe(writeStream);
      });
    })
  } catch (e) {
    throw e;
  }
}

export default function (path) {
  if (!path) {
    throw new Error('`path` is not defined. Use with darklegacycomics <path>.');
  }

  mkdirp(path, err => {
    if (err) {
      throw err;
    }

    fetch(path);
  });
};
