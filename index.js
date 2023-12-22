"use strict";

const DEFAULT_EXCLUDE_RULES = /* @__PURE__ */ new Set([
    "animation",
    "animation-name",
    "animation-duration",
    "animation-timing-function",
    "animation-delay",
    "animation-iteration-count",
    "animation-direction",
    "animation-fill-mode",
    "animation-play-state"
]);

const DEFAULT_EXCLUDE_AT_RULES = /* @__PURE__ */ new Set([
    "keyframes",
    "font-face"
]);

const isNoImportantText = (text) => /no !?important/i.test(text);
const isNoImportantNode = (node) => !!node && node.type === "comment" && isNoImportantText(node.text);

const stripVendorPrefix = name => name.replace(/^(-\w+?-)/i, "");

/**
 *
 * @param {object=} options
 * @param {(string[]|string|RegExp|((rule: string) => boolean))=} options.excludeSelectors - default empty (default exclusions still applies unless `options.disableDefaultExcludes = true`)
 * @param {(string[]|string|RegExp|((atRule: string) => boolean))=} options.excludeAtRules - default empty (default exclusions still applies unless `options.disableDefaultExcludes = true`)
 * @param {(string[]|string|RegExp|((decl: string) => boolean))=} options.excludeDeclarations - default empty (default exclusions still applies unless `options.disableDefaultExcludes = true`)
 * @param {(string[]|string|RegExp|((var: string) => boolean))=} options.excludeCSSVariables - default exclude all CSS Variables
 * @param {(string[]|string|RegExp|((path: string) => boolean))=} options.excludePaths - default empty
 * @param {boolean=} options.disableDefaultExcludes - default `false`
 * @param {boolean=} options.keepComments - default `false`
 */
const plugin = (options = {}) => {
    const legacyExcludeSelectors = createLegacyExcludes(options.selectors);
    const legacyExcludeAtRules = createLegacyExcludes(options.atrules);
    const legacyExcludeDecls = createLegacyExcludes(options.decls);

    const shouldDefaultExcludes = !(options.disableDefaultExcludes || options.clearDefaultDecls);
    const keepComments = options.keepComments || options.keepcomments;

    const excludeSelectors = createExcludes(options.excludeSelectors);
    const excludeAtRules = createExcludes(options.excludeAtRules);
    const excludeDecls = createExcludes(options.excludeDeclarations);
    const excludeCSSVariables = createExcludes(options.excludeCSSVariables, shouldDefaultExcludes);
    const excludePath = createExcludes(options.excludePaths || options.paths);

    // transform css
    return {
        postcssPlugin: "postcss-safe-important",
        Once (css, { result }) {
            if (excludePath(result.opts.from)) return;

            css.walkDecls(decl => {
                // handle decl comment
                if (isNoImportantNode(decl.next())) return;

                // check declaration
                const rule = stripVendorPrefix(decl.prop);
                if (shouldDefaultExcludes && DEFAULT_EXCLUDE_RULES.has(rule)) return;
                if (excludeDecls(rule)) return;
                if (legacyExcludeDecls(rule)) return;

                // check variable
                if (typeof decl.prop === "string" && decl.prop.startsWith("--")) {
                    if (excludeCSSVariables(decl.prop)) return;
                }

                for (let node = decl.parent; node.type !== "root"; node = node.parent) {
                    // check selector
                    if (node.type === "rule") {
                        const selector = stripVendorPrefix(node.selector);
                        if (excludeSelectors(selector)) return;
                        if (legacyExcludeSelectors(selector)) return;
                        // handle selector comment
                        if(isNoImportantNode(node.first)) return;
                    }
                    // check atrule
                    if (node.type === "atrule") {
                        const atRule = stripVendorPrefix(node.name);
                        if (shouldDefaultExcludes && DEFAULT_EXCLUDE_AT_RULES.has(atRule)) return;
                        if (excludeAtRules(atRule)) return;
                        if (legacyExcludeAtRules(atRule)) return;
                        // handle atrule comment
                        if(isNoImportantNode(node.first)) return;
                    }
                }

                // add important
                decl.important = true;
            });

            // clean comments
            if (!keepComments) {
                css.walkComments(comment => {
                    if (isNoImportantText(comment.text)) {
                        comment.remove();
                    }
                });
            }
        }
    };
};
plugin.postcss = true;
module.exports = plugin;

function createExcludes(excludes, defaultExclude = false) {
    if (!excludes) {
        return () => defaultExclude;
    }

    if (typeof excludes === "function") {
        return excludes;
    }

    // handle RegExp rule
    if (typeof excludes.test === "function") {
        return rule => excludes.test(rule);
    }

    // handle single rules
    if (typeof excludes === "string") {
        excludes = [excludes];
    }

    const excludeRules = new Set();

    if (Array.isArray(excludes)) {
        for (const e of excludes) {
            if (typeof e === "string") {
                excludeRules.add(e);
            }
        }
    }

    return (rule) => excludeRules.has(rule);
}

function createLegacyExcludes(legacyExcludes) {
    const excludeRules = new Set();

    // handle legacy function rule
    if (typeof legacyExcludes === "function") {
        legacyExcludes = legacyExcludes();
    }

    // handle legacy single rule
    if (typeof legacyExcludes === "string") {
        legacyExcludes = [legacyExcludes];
    }

    // handle legacy array rules
    if (Array.isArray(legacyExcludes)) {
        for (const e of legacyExcludes) {
            if (typeof e === "string") {
                excludeRules.add(e);
            }
        }
    }

    return (rule) => excludeRules.has(rule);
}
