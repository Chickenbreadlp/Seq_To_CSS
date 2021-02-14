const fs = require('fs');
const config = require('./config.json');
const Jimp = require('jimp');

const idList = [];
const filePrefix = config.scan.prefix;
const fileSuffix = `${config.scan.suffix}.${config.scan.filetype}`;

async function resizeFrame(id) {
    await Jimp.read(`./in/${filePrefix}${id}${fileSuffix}`)
        .then(frame => {
            return frame.resize(config.general.width, config.general.height)
                .greyscale()
                .write(`./temp/frames/${filePrefix}${id}${fileSuffix}`)
        })
        .catch(err => {
            console.error(err);
        });
}

const seqBuffer = [];
for (let i = 0; i < config.general.height; i++) {
    seqBuffer.push([]);
}

async function scanRow(rowID, frameID, frameIndex, frame) {
    let rowBuffer = seqBuffer[rowID];
    if (frameIndex === 0) {
        for (let i = 0; i < config.general.width; i++) {
            rowBuffer.push({
                last: -1
            })
        }
    }

    frame.scan(0, rowID, frame.bitmap.width, 1, function(x, y, idx) {
        let value = this.bitmap.data[idx]; // Red
        value += this.bitmap.data[idx + 1]; // Green
        value += this.bitmap.data[idx + 2]; // Blue
        value /= 3;

        let pixelArr;
        if (frameIndex === 0) {
            rowBuffer[x] = {
                0: value,
                last: 0
            };
        }
        else if (frameIndex === idList.length - 1) {
            pixelArr = rowBuffer[x];

            if (pixelArr[pixelArr.last] !== value && pixelArr.last !== frameID - 1) {
                pixelArr[frameID - 1] = pixelArr[pixelArr.last];
            }
            pixelArr[frameID] = value;
            pixelArr.last = frameID;
        }
        else {
            pixelArr = rowBuffer[x];

            if (pixelArr[pixelArr.last] !== value) {
                if (pixelArr.last !== frameID - 1) {
                    pixelArr[frameID - 1] = pixelArr[pixelArr.last];
                }
                pixelArr[frameID] = value;
                pixelArr.last = frameID;
            }
        }
    });
}
async function scanFrame(frameIndex) {
    const frameID = idList[frameIndex];
    const frameNum = Number(frameID);
    console.log('Processing Image #' + frameID);

    await Jimp.read(`./temp/frames/${filePrefix}${frameID}${fileSuffix}`)
        .then(frame => {
            const rowScans = [];
            for (let i = 0; i < config.general.height; i++) {
                rowScans.push(scanRow(i, frameNum, frameIndex, frame));
            }
            return Promise.all(rowScans);
        })
        .catch(err => {
            console.error(err);
        });

    if (frameIndex + 1 < idList.length) {
        await scanFrame(frameIndex + 1);
    }
}

console.log('Preparing Environment');
if (fs.existsSync('./temp')) {
    fs.rmdirSync('./temp', { recursive: true });
}
fs.mkdirSync('./temp');
fs.mkdirSync('./temp/frames');

console.log('Scanning Input Directory');
const inDir = fs.readdirSync('./in');
for (const fileName of inDir) {
    if (fileName.startsWith(filePrefix) && fileName.endsWith(fileSuffix)) {
        const id = fileName.substring(config.scan.prefix.length, fileName.length - fileSuffix.length);
        if (!isNaN(id)) {
            idList.push(id);
        }
    }
}

if (idList.length > 1) {
    console.log('Resizing all Frames');
    const framePromise = [];
    for (const id of idList) {
        framePromise.push(resizeFrame(id));
    }

    Promise.all(framePromise).then(async () => {
        await scanFrame(0);

        fs.rmdirSync('./temp/frames', {recursive: true});
        fs.writeFileSync(`./temp/sequence.json`, JSON.stringify(seqBuffer));
    });
}
