# Perfect Freehand Tutorial (Script)

[Starter File](https://stackblitz.com/edit/js-vtm7xh)
[Easing Functions](https://gist.github.com/steveruizok/c331cd1fb30563aec51f7223e25d0afd)

Hey, this is Steve Ruiz, author of the perfect-freehand library for JavaScript.

Perfect-freehand makes it easy to create freehand lines like this one. The library can use real pressure to adjust the width of the line, or it can simulate pressure, too. And there are plenty of ways to customize how a line looks and feels.

The library is free to use, MIT licensed, and you can find the full source code and docs on Github. Check the link in the video description.

In this tutorial, I'll show you how to use perfect-freehand, what its different options are, and how you might use in a project.

Let's get started!

## Setup

To begin, let's take a look at our starter project.

If you'd like to follow along, you can find a link to the project in the video description.

In our HTML, we have an SVG element... with some inline styles that make it take up the whole window.

```html
<svg
  id="svg"
  style="position: fixed; top: 0; left: 0; width: 100%; height: 100%;"
></svg>
```

We also have a JSON file that contains an array of points—all x and y positions—the same kind we would record from a user drawing with their mouse or trackpad.

```json
{
  "points": [
    [47.671875, 179.84375],
    [48.1171875, 179.8515625]
    //...
  ]
}
```

In our JavaScript file, we're importing those points.

```js
import points from './sample.json'
```

And using them to create a string of SVG path data.

```js
const pathData = ['M', points[0], 'L', points.slice(1)].join(' ')
```

Next, we're creating an SVG path element...

```js
const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
```

...and assigning it this path data—along with some other basic attributes: fill, stroke, stroke width.

```js
path.setAttribute('d', pathData)
path.setAttribute('fill', 'none')
path.setAttribute('stroke', 'black')
path.setAttribute('stroke-width', '2')
```

Finally, we're appending the path element to the page's SVG element.

```js
document.getElementById('svg').appendChild(path)
```

And in the browser, we see the path: a line that connects all of our input points.

```js
import points from './sample.json'

const pathData = ['M', points[0], 'L', points.slice(1)].join(' ')

const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')

path.setAttribute('d', pathData)
path.setAttribute('fill', 'none')
path.setAttribute('stroke', 'black')
path.setAttribute('stroke-width', '4')

document.getElementById('svg').appendChild(path)
```

Not bad!

Well, maybe a little bad.

### Standard Improvements

If we wanted to improve this, we would normally do something like this. First, we'd simplify the points.

```js
import { simplify } from './helpers'

points = simplify(points)
```

Next, we could apply a low pass filter to the points.

```js
import { simplify } from './helpers'

points = lowPass(simplify(points))
```

And finally, instead of creating path data that connects each point by a line, we'd create path data that connects each point by a curve.

```js
const pathData = points
  .slice(1)
  .reduce(
    (acc, point, i, arr) => {
      const next = arr[i + 1]
      if (!next) return acc
      acc.push(point, [(point[0] + next[0]) / 2, (point[1] + next[1]) / 2])
      return acc
    },
    ['M', points[0], 'Q']
  )
  .join(' ')
```

Now that's much better than what we had before, but it's still not quite perfect. For one, this kind of "simplify-and-curve" approach can only be applied _after_ a line is completed.

Let's add perfect-freehand and see what it can do.

## Adding Perfect-Freehand

We'll start by installing the `perfect-freehand` library as a dependency.

In a regular project, you'd do this with `npm install perfect-freehand` or `yarn add perfect-freehand`.

Next, we'll import get the library's default export, `getStroke`.

And let's create a stroke by passing our `currentPoints` array into the `getStroke` function.

```js
const stroke = getStroke(sample.points)
```

And let's also base our path data off of this stroke instead.

```js
const stroke = getStroke(currentPoints)

const [first, ...rest] = stroke
```

Well look at that: our line has changed from a line to a polygon.

The `getStroke` function takes in an array of points, usually points that describe a line, and returns a new array of points. These new points describe a polygon that surrounds the original line.

> Tip: This is exactly how the `stroke` attribute works in SVG, but there's one big difference: our polygon can have a variable width, adjusting its size based on pressure.

Now that we have a polygon, we can make a few adjustments to our code.

First, let's close the path by adding a "Z" to the path data.

```js
const pathData = ['M', first, 'L', rest, 'Z'].join(' ')
```

And then let's get rid of our stroke, and give the line a fill instead.

```js
path.setAttribute('d', pathData)
path.setAttribute('fill', 'black')
```

### Size

Now that we have the stroke turned off, our line is looking a little thin. To increase the line's thickness, we can pass an options object as the second parameter to `getStroke`...

And here we can define our line's thickness under the property `size`.

```js
const stroke = getStroke(sample.points, {
  size: 16,
})
```

That looks better!

### Thinning

You might notice that the polygon isn't even: some parts are thinner and some parts are thicker. This is the effect of pressure.

More pressure will cause the line to become thicker and less pressure will cause the line to become thinner.

We can adjust the rate of this thinning in the stroke's options.

```js
const stroke = getStroke(sample.points, {
  size: 16,
  thinning: 0.5,
})
```

The `thinning` option takes a number between -1 and 1. At 0, pressure will have no effect on the width of the line. When positive, pressure will have a positive effect on the width of the line; and when negative, pressure will have a negative effect on the width of the line.

```js
const stroke = getStroke(sample.points, {
  size: 16,
  thinning: 0.9,
})
```

```js
const stroke = getStroke(sample.points, {
  size: 16,
  thinning: -0.9,
})
```

### Easing

For even finer control over the effect of thinning, we can pass an easing function that will adjust the pressure along a curve. For a list of easing functions, check the links in the video description.

```js
const stroke = getStroke(sample.points, {
  size: 16,
  thinning: -0.9,
  easing: (t) => 1 - Math.cos((t * Math.PI) / 2),
})
```

### Streamline

Often the input points recorded for a line are 'noisy', or full of irregularities. To fix this, the perfect-freehand algorithm applies a "low pass" filter that moves the points closer to a perfect curve. We can control the strength of this filter through the `streamline` option.

At zero, the stroke will use the actual input points. As the number goes up, the line will become more evened out.

```js
const stroke = getStroke(sample.points, {
  size: 16,
  thinning: 0.5,
  streamline: 0,
})
```

```js
const stroke = getStroke(sample.points, {
  size: 16,
  thinning: 0.5,
  streamline: 1,
})
```

### Smoothing

Likewise, we can also control the density of points along the edges of our polygon using the `smoothing` option. At zero, the polygon will contain many points, and may appear jagged or bumpy. At higher values, the polygon will contain fewer points and lose definition.

```js
const stroke = getStroke(sample.points, {
  size: 16,
  thinning: 0.5,
  streamline: 0.5,
  smoothing: 0,
})
```

```js
const stroke = getStroke(sample.points, {
  size: 16,
  thinning: 0.5,
  streamline: 0.5,
  smoothing: 1,
})
```

In our demo, a smoother line looks more geometric. But there are lots of reasons why you might want to keep smoothing as high as possible, especially if you're storing points in some sort of state. To fix the low-poly look, we can update our SVG path.

Curves can be a little verbose, so let's bring in a snippet to help us out.

```js
const pathData = stroke
  .reduce(
    (acc, [x0, y0], i, arr) => {
      if (i === arr.length - 1) return acc
      const [x1, y1] = arr[i + 1]
      return acc.concat(` ${x0},${y0} ${(x0 + x1) / 2},${(y0 + y1) / 2}`)
    },
    ['M ', `${stroke[0][0]},${stroke[0][1]}`, ' Q']
  )
  .concat('Z')
  .join('')
```

Wow! That looks much better.

And the higher smoothing actually makes it look better, too.

<!-- ----------------- ScratchPad ------------------ -->

## Setup

For this tutorial, we're going to start from a little drawing app where a user can draw lines on the page. If you want to follow along, you can find a link to this project in the video description.

Before we begin, let's take a quick tour of the project.

In the project's HTML, we just have an `svg` element.

...and in our CSS we're styling this element so that it takes up the whole window.

In our javascript file...

And we have two variables, `currentPath` and `currentPoints`.

We're getting a reference to the `svg` element...

...and we're setting three event listeners: one for when the user starts pointing on the svg element, one for when the user moves their pointer over the svg element, and one for when the user stops pointing.

When the user starts pointing, we get the event's point and save that to the `currentPoints` array. Next, we create a new path element and set its properties, using our point for its path data. Then we append the path element to the svg element, and finally we capture the pointer id.

When the user moves their pointer over the SVG, we first check if we've already captured the event's pointer id. If that's true, then we again get the event's `point` and push it to our `currentPoints` array, and then use the `currentPoints` array to set the `currentPath`'s path data.

Finally, when we the user stops pointing, we release the pointer capture.

And that's all it takes to make a drawing app!
