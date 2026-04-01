module.exports = function (config) {
  config.set({
    "mutator": "javascript",
    "packageManager": "npm",
    "reporters": ["html", "progress", "clear-text"],
    "testRunner": "jest",
    "coverageAnalysis": "off",
    "devMode": false,
    "files": [
      "buggy.js",
      "__tests__/server.test.js"
    ],
    "mutators": [
      "arithmetic",
      "booleanSubstitution",
      "conditionalsBoundary",
      "equalityOperator",
      "logicalOperator",
      "removeConditionals",
      "removeParameter",
      "removeReturnStatement",
      "reverseConditional",
      "updateOperator"
    ]
  });
};