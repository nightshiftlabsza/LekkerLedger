
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const results = JSON.parse(fs.readFileSync('all_lint_errors.json', 'utf8'));

results.forEach(file => {
  if (file.warningCount > 0 || file.errorCount > 0) {
    console.log(`\n${file.filePath}`);
    file.messages.forEach(m => console.log(`  ${m.line}:${m.column} [${m.severity === 2 ? 'ERROR' : 'WARN'}] [${m.ruleId}] ${m.message}`));
  }
});
