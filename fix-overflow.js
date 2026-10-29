const fs = require("fs");
let css = fs.readFileSync("src/styles/homepage.css", "utf8");

// The test shows overflow at 320px
// The nav width is 290 at 320, padding in container might push it out
