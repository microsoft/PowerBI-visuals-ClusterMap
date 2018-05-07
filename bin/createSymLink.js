/**
 * Copyright (c) 2016 Uncharted Software Inc.
 * http://www.uncharted.software/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const fs = require('fs');
const fileTools = require('./fileTools.js');
const path = require('path');

/**
 * Finds the contents at the given path and creates symlinks to them in `node_modules`.
 *
 * @method createSymLinks
 * @param {String} modPath - The absolute path to the folder containing the objects to be linked.
 * @returns {Promise}
 */
function createSymLinks(modPath) {
    const promises = [];
    const modulesPath = path.resolve(__dirname, '../node_modules/');
    if (!fileTools.pathExists(modulesPath)) {
        fileTools.createFilePath(modulesPath);
    }

    fileTools.findEntriesInFolder(modPath, (fullEntry, entry) => {
        const linkType = fs.lstatSync(fullEntry).isDirectory() ? 'dir' : 'file';
        const linkPath = path.join(modulesPath, entry);
        const relativeSourcePath = path.relative(modulesPath, fullEntry);

        promises.push(new Promise( resolve => {
            fs.symlink(relativeSourcePath, linkPath, linkType, resolve);
        }));
    });
    return Promise.all(promises);
}

return createSymLinks(path.resolve(__dirname, '../lib/'));
