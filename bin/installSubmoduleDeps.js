"use strict";

const fs = require('fs');
const fileTools = require('./fileTools.js');
const path = require('path');
const cp = require('child_process');

/**
 * Iterates through the given object and retrieves the modules and their versions in "npm install" format.
 *
 * @method getDependenciesArgs
 * @param {Object} deps - An object containing the dependencies and their versions.
 */
function getDependenciesArgs(deps) {
    if (deps) {
        let args = '';
        for (let dep in deps) {
            if (deps.hasOwnProperty(dep)) {
                /* make sure the dependency has not been installed in the private modules */
                const modulePath = path.join('./lib/', dep);
                /* if the module was downloaded, assume it is the correct version */
                if (!fileTools.pathExists(modulePath)) {
                    args += dep + '@' + '"' + deps[dep] + '" ';
                }
            }
        }
        if (args.length) {
            return args;
        }
    }
    return null;
}

/**
 * Reads the package.json file at the given path and returns its needed "npm install" arguments.
 *
 * @method getInstallArgs
 * @param {String} packagePath - The path to the package.json file to read.
 */
function getInstallArgs(packagePath) {
    const moduleInfo = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    let args = '';
    const installArgs = getDependenciesArgs(moduleInfo.dependencies);
    if (installArgs) {
        args += installArgs;
    }

    /* skip deDependencies */
    //const installArgsDev = getDependenciesArgs(moduleInfo.devDependencies);
    //if (installArgsDev) {
    //    args += installArgsDev;
    //}

    return args;
}

/**
 * Finds the dependencies of the module at the given path recursively (inspects all sub-folders as well) and returns a
 * string with all the dependencies found in an "npm install" format.
 *
 * @method findDependencies
 * @param {String} modPath - The folder at which the search for dependencies will begin.
 * @returns {string}
 */
function findDependencies(modPath) {
    let installArgs = '';
    if(fileTools.pathExists(modPath) && fs.lstatSync(modPath).isDirectory()) {
        // try to find a package.json in the current directory //
        const packagePath = path.join(modPath, 'package.json');
        if (fileTools.pathExists(packagePath)) {
            installArgs += getInstallArgs(packagePath);
        }

        // find sub folders recursively and install dependencies if needed //
        fileTools.findEntriesInFolder(modPath, entry => {
            if(fs.lstatSync(entry).isDirectory()) {
                installArgs += findDependencies(entry);
            }
        });
    }
    return installArgs;
}

/**
 * Finds the contents at the given path and if a symlink to them has been created in `node_modules` deletes it.
 *
 * @method cleanSymLinks
 * @param {String} modPath - The absolute path to the folder containing the objects to be linked.
 * @returns {Promise}
 */
function cleanSymLinks(modPath) {
    const promises = [];
    const modulesPath = path.resolve(__dirname, '../node_modules/');
    if (fileTools.pathExists(modulesPath)) {
        fileTools.findEntriesInFolder(modPath, (fullEntry, entry) => {
            const linkPath = path.join(modulesPath, entry);
            try {
                const stats = fs.lstatSync(linkPath);
                if (stats.isSymbolicLink()) {
                    promises.push(new Promise(resolve => {
                        fs.unlink(linkPath, resolve);
                    }));
                }
            } catch (err) {}
        });
    }
    return Promise.all(promises);
}

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

/**
 * Runs "npm install" at the current working directory with the given arguments.
 *
 * @method npmInstall
 * @param {String} args - A string containing the arguments to append to the command.
 * @returns Promise
 */
function npmInstall(args) {
    return new Promise(resolve => cp.exec('npm install ' + args, {env: process.env, stdio: 'inherit'}, resolve));
}

/**
 * Script's main function.
 *
 * @method main
 */
function main() {
    const libPath = path.resolve(__dirname, '../lib/');
    cleanSymLinks(libPath).then(() => {
        const installArgs = findDependencies(libPath);
        if (installArgs.length) {
            npmInstall(installArgs).then(() => {
                createSymLinks(libPath);
                return Promise.resolve(true);
            });
        } else {
            createSymLinks(libPath);
        }

        return Promise.resolve(true);
    });
}

// run the script
main();
