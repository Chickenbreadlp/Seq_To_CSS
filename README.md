# Seq to CSS
Seq to CSS (or Sequence to CSS) is a set of NodeJS Applications that can convert a sequence of Images into a CSS Animation.  
Each Image is converted to black and white and then scaled to the set resolution in the config file. Each pixel in the image will represent a single div Element in the final generated HTML and CSS files.

## Usage
### Prerequisites
To use this tool, you have to have `Node.js 12.10` or newer installed.

### Generate your own CSS
Place your Image sequence in the `in` Folder and then specify the `prefix`, `suffix` and `fileExtension` according to your sequence in the `config.json`.  
Now run `npm run scanSeq` to convert the Image sequence into an internal JSON-Structure more suitable for converting into a bunch of CSS animations.  
As a last step, run `npm run render` to generate the final `index.html` and `rendered.css` which can be viewed in a Browser of your choice.

## Notes
The generated CSS files can quickly become very large and browsers will have trouble running them.

As an example I generated the entirety of the so called `Bad Apple` animation into a 160x120 CSS animation with a framerate of 5fps.  
Chrome skipped over the first few seconds of the animation and was laggy throughout but started it basically immediately. Firefox meanwhile took forever to start the animation, but was decently fluid at it. 
