const postcss = require("postcss");
const test = require("ava");

const plugin = require("./");

const run = (t, input, output, opts = {}) => postcss([ plugin(opts) ])
    .process(input, { from: undefined })
    .then(result => {
        t.deepEqual(result.css, output);
        t.deepEqual(result.warnings().length, 0);
    });

testDefaultExcludes();
testOptions();
testNoImportantComments();

function testDefaultExcludes() {
    test("should not exclude normal selectors and declarations", t => {
        return run(t,
            ".foo { color: #000; }",
            ".foo { color: #000 !important; }",
        );
    });

    test("should not exclude normal atrules", t => {
        return run(t,
            "@media screen and (width: 480px) { body { color: red; }}",
            "@media screen and (width: 480px) { body { color: red !important; }}",
        );
    });

    test("should exclude CSS variables", t => {
        return run(t,
            ".foo { --color: blue; color: red; }",
            ".foo { --color: blue; color: red !important; }",
        );
    });

    test("should ignore keyframe atrules", t => {
        return run(t,
            "@keyframes shift { 0% { left: -60px; opacity: 0; }}",
            "@keyframes shift { 0% { left: -60px; opacity: 0; }}",
        );
    });

    test("should ignore keyframes atrules with prefix", t => {
        return run(t,
            "@-webkit-keyframes shift { 0% { left: -60px; opacity: 0; }}",
            "@-webkit-keyframes shift { 0% { left: -60px; opacity: 0; }}",
        );
    });

    test("should ignore animation related declarations", t => {
        return run(t,
            ".foo { animation-name: rotate; animation-duration: 0.7s; animation-direction: reverse; color: red; }",
            ".foo { animation-name: rotate; animation-duration: 0.7s; animation-direction: reverse; color: red !important; }",
        );
    });

    test("should ignore animation declarations", t => {
        return run(t,
            ".foo { animation: 3s ease-in 1s 2 reverse both paused slidein; color: red; }",
            ".foo { animation: 3s ease-in 1s 2 reverse both paused slidein; color: red !important; }",
        );
    });
}

function testOptions() {
    test("should exclude with string option", t => {
        return run(t,
            "@media screen { body { color: red; }} @an-atrule { foo: bar; }",
            "@media screen { body { color: red; }} @an-atrule { foo: bar !important; }",
            { excludeAtRules: "media" },
        );
    });

    test("should exclude with regexp option", t => {
        return run(t,
            ".foo { background-color: red; color: #000; height: 100px; }",
            ".foo { background-color: red; color: #000; height: 100px !important; }",
            { excludeDeclarations: /color/ },
        );
    });

    test("should exclude with array option", t => {
        return run(t,
            ".foo { --height: 100px; --width: 100px; --color: #000; }",
            ".foo { --height: 100px; --width: 100px; --color: #000 !important; }",
            { excludeCSSVariables: ["--height", "--width"] },
        );
    });

    test("should exclude with function option", t => {
        return run(t,
            ".foo { color: #000; } .bar { color: #000; }",
            ".foo { color: #000; } .bar { color: #000 !important; }",
            { excludeSelectors: sel => sel === ".foo" },
        );
    });

    test("should disable default declarations excludes with disableDefaultExcludes options", t => {
        return run(t,
            ".foo { animation: 3s ease-in 1s 2 reverse both paused slidein !important; color: red; }",
            ".foo { animation: 3s ease-in 1s 2 reverse both paused slidein !important; color: red !important; }",
            { disableDefaultExcludes: true },
        );
    });

    test("should disable default atrules excludes with disableDefaultExcludes options", t => {
        return run(t,
            "@keyframes shift { 0% { left: -60px !important; opacity: 0 !important; }}",
            "@keyframes shift { 0% { left: -60px !important; opacity: 0 !important; }}",
            { disableDefaultExcludes: true },
        );
    });

    test("should disable default css variables excludes with disableDefaultExcludes options", t => {
        return run(t,
            ".foo { --color: red; }",
            ".foo { --color: red !important; }",
            { disableDefaultExcludes: true },
        );
    });

    test("should keep comments with keepComments options", t => {
        return run(t,
            ".foo { /* no important */ color: #000; }" +
            ".bar { color: #000; /* no important */}",
            ".foo { /* no important */ color: #000; }" +
            ".bar { color: #000; /* no important */}",
            { keepComments: true },
        );
    });
}

function testNoImportantComments() {
    test("set `no important` inside rules", t => {
        return run(t,
            ".foo { /* no important */ color: #000; } .bar { color: #000; }",
            ".foo { color: #000; } .bar { color: #000 !important; }",
        );
    });

    test("set `no !important` inside normal atrules", t => {
        return run(t,
            "@media screen and (width: 80px) {/* no !important */body {color: red;}}" +
            "@media screen and (width: 120px) {body {color: blue;}}",
            "@media screen and (width: 80px) {body {color: red;}}" +
            "@media screen and (width: 120px) {body {color: blue !important;}}",
        );
    });

    test("set `no important` behind declaration", t => {
        return run(t,
            ".foo { height: 100px; /* no important */ color: #000; }",
            ".foo { height: 100px; color: #000 !important; }",
        );
    });
}
