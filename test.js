import postcss from 'postcss';
import test    from 'ava';

import plugin from './';

function run(t, input, output, opts = { }) {
    return postcss([ plugin(opts) ]).process(input)
        .then( result => {
            t.same(result.css, output);
            t.same(result.warnings().length, 0);
        });
}

/* Write tests here

test('does something', t => {
    return run(t, 'a{ }', 'a{ }', { });
});

*/


/*
.foo { color: #000; }
------------------------------
.foo { color: #000 !important; }
*/
test('normal selectors', t => {
    return run(t,
        '.foo { color: #000; }',
        '.foo { color: #000 !important; }');
});


/*
@media screen and (width: 480px) {
    body {
        color: red;
    }
}
--------------------------------------
@media screen and (width: 480px) {
    body {
        color: red; !important;
    }
}
*/
test('normal atrules', t => {
    return run(t,
        '@media screen and (width: 480px) { body { color: red; }}',
        '@media screen and (width: 480px) { body { color: red !important; }}');
});


/*
@keyframes shift {
    0% {
        left: -60px;
        opacity: 0;
    }
}
--------------------------------------
@keyframes shift {
    0% {
        left: -60px;
        opacity: 0;
    }
}
*/
test('keyframe atrules', t => {
    return run(t,
        '@keyframes shift { 0% { left: -60px; opacity: 0; }}',
        '@keyframes shift { 0% { left: -60px; opacity: 0; }}');
});


/*
@-webkit-keyframes shift {
    0% {
        left: -60px;
        opacity: 0;
    }
}
--------------------------------------
@-webkit-keyframes shift {
    0% {
        left: -60px;
        opacity: 0;
    }
}
*/
test('keyframes atrules with prefix', t => {
    return run(t,
        '@-webkit-keyframes shift { 0% { left: -60px; opacity: 0; }}',
        '@-webkit-keyframes shift { 0% { left: -60px; opacity: 0; }}');
});


// /*
// .foo {
//     /* no important */
//     color: #000; }
// .bar {
//     color: #000; }
// ------------------------------
// .foo {
//     color: #000; }
// .bar {
//     color: #000 !important; }
// */
test('set `no important` inside rules', t => {
    return run(t,
        '.foo { /* no important */ color: #000; } .bar { color: #000; }',
        '.foo { color: #000; } .bar { color: #000 !important; }');
});


// /*
// @media screen and (width: 80px) {
//     /* no !important */
//     body {
//         color: red;
//     }
// }
// @media screen and (width: 120px) {
//     body {
//         color: blue;
//     }
// }
// --------------------------------------
// @media screen and (width: 80px) {
//     body {
//         color: red;
//     }
// }
// @media screen and (width: 120px) {
//     body {
//         color: blue; !important;
//     }
// }
// */
test('set `no !important` inside normal atrules', t => {
    return run(t,
    '@media screen and (width: 80px) {/* no !important */body {color: red;}}' +
    '@media screen and (width: 120px) {body {color: blue;}}',
    '@media screen and (width: 80px) {body {color: red;}}' +
    '@media screen and (width: 120px) {body {color: blue !important;}}');
});


// /*
// .foo {
//     height: 100px; /* no important */
//     color: #000; }
// ------------------------------
// .foo {
//     height: 100px;
//     color: #000 !important; }
// */
test('set `no important` behide declaration', t => {
    return run(t,
        '.foo { height: 100px; /* no important */ color: #000; }',
        '.foo { height: 100px; color: #000 !important; }');
});

/*
.foo {
    height: 100px;
    width: 100px;
    color: #000; }
------------------------------
.foo {
    height: 100px;
    width: 100px;
    color: #000 !important; }
*/
test('set exculde decls with array options', t => {
    return run(t,
        '.foo {height: 100px;width: 100px;color: #000; }',
        '.foo {height: 100px;width: 100px;color: #000 !important; }',
        { decls: ['height', 'width'] });
});

/*
.foo {
    color: #000; }
#bar {
    color: #fff;}
------------------------------
.foo {
    color: #000 !important; }
#bar {
    color: #fff;}
*/
test('set single exculde rule with options', t => {
    return run(t,
        '.foo {color: #000; } #bar {color: #fff;}',
        '.foo {color: #000 !important; } #bar {color: #fff;}',
        { selectors: '#bar' });
});


/*
@media screen and (width: 480px) {
    body {
        color: red;
    }
}
@an-atrule {
  foo: bar;
  baz: bar;
}
------------------------------
@media screen and (width: 480px) {
    body {
        color: red;
    }
}
@an-atrule {
  foo: bar !important;
  baz: bar !important;
}
*/
test('set single exculde atrules with function options', t => {
    return run(t,
        '@media screen and (width: 480px) {body {color: red;}}' +
        '@an-atrule {foo: bar;' +
        'baz: bar;}',
        '@media screen and (width: 480px) {body {color: red;}}' +
        '@an-atrule {foo: bar !important;' +
        'baz: bar !important;}',
        { atrules: () => 'media' });
});


// /*
// .foo {
//     /* no important */
//     color: #000; }
// .bar {
//     color: #000; /* no !important */}
// ------------------------------
// .foo {
//     /* no important */
//     color: #000; }
// .bar {
//     color: #000; /* no !important */}
// */
test('keepcomments options', t => {
    return run(t,
        '.foo { /* no important */ color: #000; }' +
        '.bar { color: #000; /* no important */}',
        '.foo { /* no important */ color: #000; }' +
        '.bar { color: #000; /* no important */}',
        { keepcomments: true });
});
