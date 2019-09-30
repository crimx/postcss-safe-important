'use strict';

var postcss = require('postcss');

/**
 * @param {*} rules
 * @param {Set} excludeSet
 */
function addExcludeItems(rules, excludeSet) {
    if (!rules) return;

    // handle function
    if (typeof rules === 'function') {
        rules = rules();
    }

    // handle single rule
    if (typeof rules === 'string') {
        rules = [rules];
    }

    // handle array or anything iterable
    Array.from(rules).forEach(r => {
        if (typeof r === 'string') {
            excludeSet.add(r);
        }
    });
}

/**
 * @param {string} path
 * @param {*} excludePaths
 */
function isExcludePath(path, excludePaths) {
    if (!excludePaths || !path) return false;

    // handle single rule
    if (typeof excludePaths === 'string') {
        return path === excludePaths;
    }

    // handle RegExp
    if (typeof excludePaths.test === 'function') {
        return Boolean(excludePaths.test(path));
    }

    // handle function
    if (typeof excludePaths === 'function') {
        return Boolean(excludePaths(path));
    }

    return false;
}

module.exports = postcss.plugin('postcss-safe-important', options => {
    options = options || { clearDefaultDecls: false }; // default options

    var excludeRules = new Set();
    var excludeAtRules = new Set(['keyframes', 'font-face']);
    var excludeDecls = new Set();

    if (!options.clearDefaultDecls) {
        addExcludeItems([
            'animation',
            'animation-name',
            'animation-duration',
            'animation-timing-function',
            'animation-delay',
            'animation-iteration-count',
            'animation-direction',
            'animation-fill-mode',
            'animation-play-state'
        ], excludeDecls);
    }

    addExcludeItems(options.selectors, excludeRules);
    addExcludeItems(options.atrules, excludeAtRules);
    addExcludeItems(options.decls, excludeDecls);

    // transform css
    return (css, result) => {
        if (isExcludePath(result.opts.from, options.paths)) return;

        const commentChecker = /no !?important/i;
        const stripPrefix = name => name.replace(/^(-\w+?-)/i, '');

        css.walkDecls(decl => {
            // check declation
            if (excludeDecls.has(stripPrefix(decl.prop))) return;

            for (let node = decl.parent; node.type !== 'root'; node = node.parent) {
                // check selector
                if (node.type === 'rule') {
                    if (excludeRules.has(stripPrefix(node.selector))) return;
                    // handle selector comment
                    if (node.first && node.first.type === 'comment') {
                        if (commentChecker.test(node.first.text)) return;
                    }
                }
                // check atrule
                if (node.type === 'atrule') {
                    if (excludeAtRules.has(stripPrefix(node.name))) return;
                    // handle atrule comment
                    if (node.first && node.first.type === 'comment') {
                        if (commentChecker.test(node.first.text)) return;
                    }
                }
            }

            // handle decl comment
            let nextNode = decl.next();
            if (nextNode && nextNode.type === 'comment') {
                if (commentChecker.test(nextNode.text)) return;
            }

            // add important
            decl.important = true;
        });

        // clean comments
        if (!options.keepcomments) {
            css.walkComments(comment => {
                if (commentChecker.test(comment.text)) {
                    comment.remove();
                }
            });
        }
    };
});
