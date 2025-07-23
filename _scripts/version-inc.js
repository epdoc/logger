const fs = require('node:fs');

const FILENAME = 'package.json';

/**
 * @fileoverview Script to increment the version number in package.json. Will
 * increment the rightmost number that is found in the version.
 * @author [James Pravetz]
 */

fs.readFile(FILENAME, function (err, content) {
  if (err) {
    throw err;
  }
  const pkg = JSON.parse(content);
  fs.writeFile(FILENAME + '~', JSON.stringify(pkg, null, 2), function (err) {
    if (err) {
      throw err;
    }
    const version = pkg.version;
    const p = version.match(/^(.+)([^\d]+)(\d+)$/);
    if (p && p.length > 3) {
      const patch = parseInt(p[3], 10) + 1;
      pkg.version = [p[1], patch].join(p[2]);
      fs.writeFile(FILENAME, JSON.stringify(pkg, null, 2), function (err) {
        if (err) {
          throw err;
        }
        console.log(`Incremented package version ${version} -> ${pkg.version}`);
      });
    } else {
      console.log(`Invalid version number found in ${FILENAME}`);
    }
  });
});
