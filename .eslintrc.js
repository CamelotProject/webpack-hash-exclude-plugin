module.exports = {
    'env': {
        'browser': true,
        'es6': true
    },
    'extends': [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended'
    ],
    'globals': {
        'Atomics': 'readonly',
        'SharedArrayBuffer': 'readonly'
    },
    'parser': '@typescript-eslint/parser',
    'parserOptions': {
        'ecmaFeatures': {
            'jsx': true
        },
        'ecmaVersion': 2019,
        'sourceType': 'module'
    },
    'plugins': [
        '@typescript-eslint'
    ],
    'rules': {
        "comma-dangle": ["error", "always-multiline"],
        'indent': [
            'error',
            4,
            { "SwitchCase": 1 }
        ],
        'linebreak-style': [
            'error',
            'unix'
        ],
        "object-curly-spacing": [
            "error",
            "always"
        ],
        "prefer-arrow-callback": "error",
        'quotes': [
            'error',
            'single'
        ],
        'semi': [
            'error',
            'always'
        ]
    },
    "settings": {
        "propWrapperFunctions": [
            "forbidExtraProps",
            {"property": "freeze", "object": "Object"}
        ],
        "linkComponents": [
            "Hyperlink",
            {"name": "Link", "linkAttribute": "to"}
        ]
    }
};
