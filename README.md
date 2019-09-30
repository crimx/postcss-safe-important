# PostCSS Safe Important

[![Build Status][ci-img]][ci]
[![Npm Downloads Total][dt-img]][npm]
![Node Version][node-img]
[![Npm][npm-img]][npm]

[PostCSS] plugin that adds `!important` to style declarations safely.

[PostCSS]:  https://github.com/postcss/postcss
[ci-img]:   https://travis-ci.org/crimx/postcss-safe-important.svg
[ci]:       https://travis-ci.org/crimx/postcss-safe-important
[npm-img]:  https://img.shields.io/npm/v/postcss-safe-important.svg
[npm]:      https://www.npmjs.com/package/postcss-safe-important
[dt-img]:   https://img.shields.io/npm/dt/postcss-safe-important.svg
[node-img]: https://img.shields.io/npm/dm/postcss-safe-important.svg

## Why would I need it?

> It's 2019 and you should probably look at shadow dom and web components first.

Quoted from [Cleanslate](http://cleanslatecss.com/#Why-would-I-need-it)

> When there are existing CSS styles on a page, and you want to prevent those styles cascading into some part of the page. This is not a stylesheet to use when developing your own website (for that, try [Eric Meyer’s classic “Reset CSS”](http://meyerweb.com/eric/tools/css/reset/) or the [“HTML5 Doctors’ adaptation”](http://html5doctor.com/html-5-reset-stylesheet).
>
> The stylesheet can be useful when distributing content (e.g. a widget, or syndicated news) to third-party websites. The CSS rules in the host site may be unknown and unpredictable, or may change in future without notice, or there may be so many websites you need to distribute to that it is impractical to write specific CSS that overrides the styles in each one. In such situations, the Cleanslate stylesheet will aggressively reset your portion of the content (and nothing else) back to some reasonable default values that you can then build from.
>
> ### Why not just use an iframe?
>
> Third-party content is often distributed in iframes. Because JavaScript within an iframe can be prevented from accessing the host page, iframes are particularly useful when the host site has security concerns and does not explicitly trust the third-party content.
>
> However, iframes have some drawbacks:
>
> - You cannot display content outside of the box of the iframe.
> - It is tricky to resize the iframe to match the size of its contents.
> - Your content will be unable to interact with the host page, even if it is trusted.
> - Search engines like Google will not see the content on the host page. Content that is syndicated from a partner website can avoid this by being directly included in the host page.


Whether you work with extreme CSS reset stylesheet like Cleanslate or simply just want to give maximum weight for all your declarations, don't do it manually! Use [postcss-safe-important] to keep your source styles clean and portable.

## Safe?

Adding `!important` to every declarations might break your style. For example, [declarations in a keyframe that are qualified with `!important` are ignored](https://developer.mozilla.org/en-US/docs/Web/CSS/@keyframes#!important_in_a_keyframe).

[postcss-safe-important] will skip [unnecessary declarations](#default-exclutions). You can also set your own exclusions through options or comments (see examples below).

[postcss-safe-important]: https://github.com/Crimx/postcss-safe-important


```css
/* Input example */
.foo {
    width: 100px;
    color: #000; /* no !important */ }

.bar {
    /* no important */
    color: ##fff;
    width: 100px; }
```

```css
/* Output example */
.foo {
    width: 100px !important;
    color: #000; }

.bar {
    color: ##fff;
    width: 100px; }
```

## Usage

```
$ npm install postcss-safe-important --save-dev
```

```js
var safeImportant = require('postcss-safe-important');

postcss([ safeImportant({
    // options
    selectors: '#bar', // you can pass a string
    decls: ['height', 'width'], // or iterable
    atrules: () => 'media', // even a function
    paths: p => p.startsWith(path.resolve(__dirname, '../node_modules')), // rule out paths
    keepcomments: false // all the `no important` comments will be erased
}) ]);
```

## Comments

You can use either `/* no !important */` or `/* no important */` to indicate no changing.

If the comment is right inside a rule(be the first child node of the rule), the whole rule will not change.

```css
/* Input example */
.foo {
    /* no important */
    width: 100px;
    color: #000; }

.bar { /* no !important */
    width: 100px;
    color: #000; }
```

```css
/* Output example */
.foo {
    width: 100px;
    color: #000; }

.bar {
    width: 100px;
    color: #000; }
```

If the comment is right behind(or below) a declaration, then only the declaration will remain the same.

```css
/* Input example */
.foo {
    width: 100px;
    color: #000; /* no important */}
```

```css
/* Output example */
.foo {
    width: 100px !important;
    color: #000; }
```

## Options

### Exclutions

- `selectors`: excluded selectors
- `decls`: excluded declarations
- `atrules`: excluded atrules(e.g. `@font-face`)

You can pass either a **string**, an **iterable**, or a **function** that returns string/array.

### Excluded paths

- `paths`: a string(exact match), a RegExp(`test` is called) or a function that returns truthy or falsy value.

If you want styles in node_modules left untouched, let's say your postcss config file is at project root:

```js
var safeImportant = require('postcss-safe-important');
var path = require('path')

postcss([ safeImportant({
    paths: p => p.startsWith(path.resolve(__dirname, './node_modules'))
}) ]);
```

### Keep `/* no important */` comments

- `keepcomments`: **bool**, default `false`.

### Clear Default Declarations

- `clearDefaultDecls`: **bool**, default `false`.

## Default Exclutions

### Atrules

- keyframes
- font-face

### Declarations

- animation
- animation-name
- animation-duration
- animation-timing-function
- animation-delay
- animation-iteration-count
- animation-direction
- animation-fill-mode
- animation-play-state

## [Change Log](CHANGELOG.md)

See [PostCSS] docs for examples for your environment.

## [License](LICENSE)

MIT
