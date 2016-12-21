[![CircleCI](https://circleci.com/gh/Microsoft/PowerBI-visuals-ClusterMap/tree/master.svg?style=svg)](https://circleci.com/gh/Microsoft/PowerBI-visuals-ClusterMap/tree/master)

# Cluster Map Powerbi Custom Visual
![Alt text](assets/screenshot.png?raw=true "Cluster Map")

## Debugging

* Install ssl certificate by running `npm run install-certificate` and following the steps from: [https://github.com/Microsoft/PowerBI-visuals/blob/master/tools/CertificateSetup.md](https://github.com/Microsoft/PowerBI-visuals/blob/master/tools/CertificateSetup.md)
* Enable Developer Tools in PowerBI: [https://github.com/Microsoft/PowerBI-visuals/blob/master/tools/DebugVisualSetup.md](https://github.com/Microsoft/PowerBI-visuals/blob/master/tools/DebugVisualSetup.md)
* Run `npm start` to start development.

## Building

* Run `npm run package` to package the visual.
* `.pbiviz` file will be generated in the `dist` folder

## Testing

* Run `npm test`