module.exports = {
    // Write all your JEST configurations here.    
    collectCoverage: true,
    collectCoverageFrom: [
        "./**/*.js",
        "!**/coverage/**",
    ],
    coverageReporters: [
        "text",
        "html"
    ],
};
      