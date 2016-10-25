"use strict";

const fs = require('fs');
const path = require('path');

const fileTools = {
    /**
     * Checks is a file (or a folder) exists at the given path.
     *
     * @method pathExists
     * @param {String} filePath - The path to the file to check.
     * @returns {boolean}
     */
    pathExists: function(filePath) {
        try {
            fs.accessSync(filePath, fs.F_OK);
            return true;
        } catch (err) {}
        return false;
    },

    /**
     * Iterates through the contents of the specified folder and invokes the callback `onEntry` for every entry found.
     *
     * @method findEntriesInFolder
     * @param {String} folder - The path to the folder to iterate.
     * @param {Function} onEntry - A callback with signature (entryPath, entryName) => {}
     */
    findEntriesInFolder: function(folder, onEntry) {
        if(onEntry && fileTools.pathExists(folder) && fs.lstatSync(folder).isDirectory()) {
            fs.readdirSync(folder).forEach(entry => {
                onEntry(path.join(folder, entry), entry);
            });
        }
    },

    /**
     * Deletes a folder, its files and folders recursively.
     *
     * @method deleteFolder
     * @param {String} folderPath - The path to the folder to delete.
     */
    deleteFolder: function(folderPath) {
        if(fileTools.pathExists(folderPath)) {
            fileTools.findEntriesInFolder(folderPath, entry => {
                if(fs.lstatSync(entry).isDirectory()) { // recurse
                    fileTools.deleteFolder(entry);
                } else { // delete file
                    fs.unlinkSync(entry);
                }
            });
            fs.rmdirSync(folderPath);
        }
    },

    /**
     * Creates the folder structure specified in the provided path.
     *
     * @method createFilePath
     * @param {String} filePath - The path to create.
     */
    createFilePath: function(filePath) {
        const folderPath = path.dirname(filePath);
        if (!fileTools.pathExists(folderPath)) {
            fileTools.createFilePath(folderPath);
            fs.mkdirSync(folderPath);
        }
    }
};

module.exports = fileTools;
