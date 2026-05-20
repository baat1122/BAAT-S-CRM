const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let count = 0;
walkDir(path.join(__dirname, 'src', 'app'), function(filePath) {
  if (filePath.endsWith('.tsx') && !filePath.includes('pdf')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace classNames like max-w-4xl mx-auto with w-full
    // e.g. "max-w-4xl mx-auto space-y-6" -> "w-full space-y-6"
    // "space-y-6 max-w-5xl mx-auto" -> "space-y-6 w-full"
    
    // Find all max-w-* accompanied by mx-auto
    const regex = /max-w-(?:sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl)\s+mx-auto/g;
    const regex2 = /mx-auto\s+max-w-(?:sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl)/g;
    
    let newContent = content.replace(regex, 'w-full').replace(regex2, 'w-full');
    
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      count++;
      console.log(`Updated ${filePath}`);
    }
  }
});

console.log(`Updated ${count} files.`);
