'use strict';

var postcss = require('postcss');

module.exports = postcss.plugin('postcss-reverse-props', options => {
    options = options || {};
    // default options
    var excludeRules = new Set();
    var excludeAtRules = new Set(['keyframes']);
    var excludeDecls = new Set([
        'animation',
        'animation-name',
        'animation-duration',
        'animation-timing-function',
        'animation-delay',
        'animation-iteration-count',
        'animation-direction',
        'animation-fill-mode',
        'animation-play-state'
    ]);

    // handle user options
    function addOpts(rules, set) {
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
        if (rules.forEach) {
            rules.forEach(r => {
                if (typeof r === 'string') {
                    set.add(r);
                }
            });
        }
    }
    addOpts(options.selectors, excludeRules);
    addOpts(options.atrules, excludeAtRules);
    addOpts(options.decls, excludeDecls);

    // transform css
    return css => {
        const commentChecker = /no !?important/i;
        const stripPrefix = name => name.replace(/^(-\w+?-)/i, '');

        css.walkDecls(decl => {
            // check declation
            if (excludeDecls.has(stripPrefix(decl.prop))) return;

            for (let node = decl.parent;
              node.type !== 'root'; node = node.parent) {
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
