# Perfect Freehand Tutorial (Script)

Hey, this is Steve Ruiz, author of the perfect-freehand library for JavaScript.

Perfect-freehand makes it easy to create freehand lines like this one. The library can use real pressure to adjust the width of the line, or it can simulate pressure, too. And there are plenty of ways to customize how a line looks and feels.

The library is free to use, MIT licensed, and you can find the full source code and docs on Github. Check the link in the video description.

In this tutorial, I'll show you how to use perfect-freehand in a project.

Let's get started!

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

## Setup

Here's our starter project.

In our HTML, we have an SVG element...

With some inline styles that make it take up the whole window.

In our JavaScript, we're importing a JSON file that contains an array of points, all x and y positions, the same kind we would record from a user drawing with their mouse or trackpad.

We turn those points into a string of SVG path data.

And then we create an SVG path element and assign it this path data... along with some other basic attributes: fill, stroke, stroke width.

Finally, we appending it to the page's SVG element.

And in the browser, we see the path: a line that connects all of our input points.

```js
import sample from './sample.json'

const stroke = getStroke(sample.points)

const [first, ...rest] = sample.points

const pathData = ['M', first, 'L', rest].join(' ')

const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')

path.setAttribute('d', pathData)
path.setAttribute('fill', 'none')
path.setAttribute('stroke', 'black')
path.setAttribute('stroke-width', '3')

document.getElementById('svg').appendChild(path)
```

Not bad! Well, actually a little bad.

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

Now that we have the stroke turned off, we can see that the polygon isn't even: some parts are thinner and some parts are thicker. This is the effect of pressure: more pressure will cause the line to become thicker and less pressure will cause the line to become thinner.

We can adjust the rate of this thinning by passing an options object to `getStroke`.

```js
const stroke = getStroke(sample.points, {
  thinning: 0.9,
})
```

The `thinning` option takes a number between -1 and 1. At 0, pressure has no effect on the width of the line. At 1, lower pressures will cause the line to become thinner; and at -1, lower pressures will cause the line to get thicker.
