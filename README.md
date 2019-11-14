# lottie-web-parser

Utility functions for parsing color & text information from [lottie-web](https://github.com/airbnb/lottie-web) JSONs. 

## Motivation

[lottie-web](https://github.com/airbnb/lottie-web) is a great way of rendering After Effects animations natively on the Web. These animations are exported from After Effects as JSON files that hold all animation data: layers, shapes, colors, keyframes etc.

At [Flixier](https://flixier.com) we wanted to build an editor for these lottie animations, so you can customize yours as you please. Demo below:

<img src="https://raw.githubusercontent.com/iampava/lottie-web-parser/master/src/assets/flixier_demo.gif">

The hardest part was understanding the JSON format and parsing/modifying it in such a way that 

1) it's still valid
2) it produces the result we want.


## Features

* determine if the lottie has text information or not
* find and replace all shape colors (fill or stroke), including those that have the color specified as an [JavaScript expression](https://helpx.adobe.com/after-effects/using/expression-basics.html)
* parse texts

## Installation

```bash
$ npm install lottie-web-parser
```

Then, import this package into your app (you might need a build tool like [webpack](https://webpack.js.org/) if wanting to run in the browser.

## API


### hasTextLayers(animaitonData): boolean

Checks if the animation data passed as argument has text information or not.

```javascript
import LottieWebParser from 'lottie-web-parser';
import animationData from './data.js';

LottieWebParser.hasTextLayers();
```

### parseColors(animationData): Array<{ name: string, path: string, color: number[] }>

Parses the animationData and returns an array of color information, including the name of the shape/layer.

```javascript
import LottieWebParser from 'lottie-web-parser';
import animationData from './data.js';

let colorInfo = LottieWebParser.parseColors(animationData);
console.log(colorInfo);
```

### replaceColor(rgba, path, animationData)

Params:
* rgba: Array<number>
* path: string
* animationData: JSON object

Modifies the animationData in place, by replacing the color value found at that path.

```javascript
import LottieWebParser from 'lottie-web-parser';
import animationData from './data.js';

let colorInfo = LottieWebParser.parseColors(animationData);
LottieWebParser.replaceColor([255, 0, 0, 1], colorInfo[0].path, animationData);
```

### parseTexts(animationData) : Array<{name: string, text: string, font: string, path: string}>

Parses the animationData and returns an array of text information.

```javascript
import LottieWebParser from 'lottie-web-parser';
import animationData from './data.js';

if (LottieWebParser.hasTextLayers(animationData)) {
    let textInfo = LottieWebParser.parseTexts(animationData);
    console.log(textInfo);
}
```

<hr/>

<p align="center"> Made with ❤ by <a href="https://iampava.com"> Pava for <a href="https://flixier.com">Flixier </a></p>

PS: special thanks to [sonaye/lottie-editor](https://github.com/sonaye/lottie-editor), whose code was the foundation of this package.