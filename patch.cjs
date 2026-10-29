const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  'import { useState, useEffect, useLayoutEffect, FormEvent } from "react";',
  'import { useState, useEffect, useLayoutEffect, FormEvent, useRef } from "react";\nimport { ServiceNavigation } from "govuk-frontend";'
);
fs.writeFileSync('src/App.tsx', code);
