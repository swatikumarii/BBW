'use strict';

// Please check all available configurations and rules
// at https://www.npmjs.com/package/isml-linter.

var config = {
    enableCache: true,
    rules: {
        // Line by line rules;
        'no-br': {},
        'no-git-conflict': {},
        'no-import-package': {},
        'no-inline-style': {
            level: 'warning'
        },
        'no-isscript': {
            level: 'warning'
        },
        'no-space-only-lines': {},
        'no-tabs': {},
        'no-trailing-spaces': {},

        // Tree rules;
        indent: {
            standAloneClosingChars: {
                quote: 'any',
                nonSelfClosingTag: 'never'
            }
        },
        'no-redundant-context': {},
        'max-depth': {
            level: 'warning'
        },
        'no-hardcode': {
            except: [
                '(',
                ')',
                '[',
                ']',
                '"',
                "'",
                '/',
                '+',
                '-',
                '*',
                ':',
                ',',
                '.'
            ],
            allowHtmlEntities: true
        },
        'no-require-in-loop': {},
        'one-element-per-line': {
            except: ['iscomment', 'non-tag']
        }
    }
};

module.exports = config;
