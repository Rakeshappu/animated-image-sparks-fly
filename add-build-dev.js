const fs = require('fs');
const path = require('path');

const packageJsonPath = path.resolve(__dirname, 'package.json');
const packageJson = require(packageJsonPath);

// Add the build:dev script if it doesn't exist
if (!packageJson.scripts['build:dev']) {
  packageJson.scripts['build:dev'] = 'vite build --mode development';
  
  // Write the updated package.json
  fs.writeFileSync(
    packageJsonPath, 
    JSON.stringify(packageJson, null, 2) + '\n',
    'utf8'
  );
  
  console.log('Added build:dev script to package.json');
} else {
  console.log('build:dev script already exists in package.json');
}