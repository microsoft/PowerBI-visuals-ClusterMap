#Essex PowerBI Visual Template
Use this project as a starting point for developing PowerBI visuals.

###Private Dependencies
This project contains scripts developed to allow private modules to be installed outside the `node_modules` folder. This
functionality is meant to allow developers to minimize the number of dependencies on external projects by being able to
release private modules as part of the base project while maintaining modularity. Once private modules are configured in
the `package.json` file, the modules will be downloaded to the `lib` folder and all their dependencies will be installed
to the `node_modules` folder within the root folder.

###Getting Started
* Fork this repo
* Configure project's private dependencies, if any.
    * Add desired modules to `package.json` under the `privateSubmodules` field.
    * The format is the same as the `dependencies` field with the exception that the module version must be exact.
    * Add private registry info/credentials to the `.npmrc` file (do not commit the `.npmrc` file unless the registry is meant to be public)
* Run `npm install` on the project folder.
* Configure your visual's build options (name, build id, icon, etc) in the `pbiviz.json` file.
* Use the `capabilities.json` file in the root folder to configure the data fields/options of your visual.
* In the `src` folder, the file `VisualMain.ts` contains a starting point for the visual's code.
* In the `style` folder, the file `visual.css` serves as entry point for all CSS that will be included in the visual. 

###Debugging
* Install ssl certificate by running `npm run install-certificate` and following the steps from:
https://github.com/Microsoft/PowerBI-visuals/blob/master/tools/CertificateSetup.md
* Enable Developers tools in PowerBi: https://github.com/Microsoft/PowerBI-visuals/blob/master/tools/DebugVisualSetup.md
* Run `npm start` to start development.

###Building
* Run `npm run package` to package the visual.

###Testing
TODO: Add testing framework.

###Linting
TODO: Add linting framework

##Documentation
TODO: Add JSDoc/TypeDoc framework and workarounds.


