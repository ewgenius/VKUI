const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const pkg = require('../package.json');

try {
  const templatePath = path.resolve('.github/ISSUE_TEMPLATE/bug_report.yaml');
  const template = yaml.load(fs.readFileSync(templatePath));

  const version = template.body.find((section) => section.id === 'version');
  console.log(version.attributes.options);

  if (version.attributes.options[0] !== pkg.version) {
    version.attributes.options = [
      pkg.version,
      ...version.attributes.options
    ];
  }

  console.log(version.attributes.options);

  const updated = yaml.dump(template);
  fs.writeFileSync(templatePath, updated);
} catch (e) {
  console.log(e);
}
