const fs = require('fs');
const config = require('./config.json');

const rows = require('./temp/sequence.json');

function getPixelPosition(pixelID) {
    const y = Math.floor(pixelID / config.general.width);
    const x = pixelID % config.general.width;

    return { x, y };
}
function getHexColor(value) {
    const hex = value.toString(16).padStart(2, '0');

    return '#' + hex + hex + hex;
}

const animations= {};
let lastFrame = 0;
async function generateAnimation(pixelID) {
    const position = getPixelPosition(pixelID);
    const pixel = rows[position.y][position.x];
    let frames = Object.keys(pixel);
    frames.splice(frames.length-1, 1);

    if (lastFrame === 0) {
        lastFrame = frames[frames.length - 1];
    }

    let animation = `@keyframes pixel_${pixelID} {\n`;
    let firstColor;
    for (let i = 0; i < frames.length; i++) {
        const framePos = (frames[i] / lastFrame) * 100;
        const color = getHexColor(pixel[frames[i]]);

        if (i === 0) {
            firstColor = color;
        }

        animation += `\t${framePos}%\t{background-color:${color};}\n`;
    }

    animation += `}\n${config.render.pixelContainer} #row_${position.y} #pixel_${pixelID} {animation-name: pixel_${pixelID}}`;
    animations[pixelID] = animation;
}

if (fs.existsSync('./out')) {
    fs.rmdirSync('./out', { recursive: true });
}
fs.mkdirSync('./out');

const pixelCount = config.general.width * config.general.height;
const generators = [];
for (let i = 0; i < pixelCount; i++) {
    generators.push(generateAnimation(i));
}

Promise.all(generators).then(() => {
    let finalCSS = '';

    for (let i = 0; i < pixelCount; i++) {
        finalCSS += '\n' + animations[i];
    }

    fs.writeFileSync(`./out/rendered.css`, finalCSS);

    let html = fs.readFileSync(`./template.html`, { encoding: 'utf8' });
    html = html.split('###PIXELSIZE###').join(config.render.pixelSize);
    html = html.split('###ROWWIDTH###').join(config.render.pixelSize * config.general.width);

    html = html.split('###DURATION###').join(lastFrame / config.render.framerate);
    html = html.split('###CONTAINER###').join(config.render.pixelContainer);

    html = html.split('###WIDTH###').join(config.general.width);
    html = html.split('###HEIGHT###').join(config.general.height);
    fs.writeFileSync(`./out/index.html`, html);
})
