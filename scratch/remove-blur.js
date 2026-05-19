const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      filelist = walkSync(dirFile, filelist);
    } catch (err) {
      if (err.code === 'ENOTDIR' || err.code === 'EBADF') filelist.push(dirFile);
    }
  });
  return filelist;
};

const files = walkSync('C:\\Users\\ASUS\\Pictures\\id-daddy\\apps\\desktop\\src\\renderer')
  .filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

let totalChanges = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Remove backdrop-blur-* classes and ensure we only remove the class, not surrounding useful spaces
  content = content.replace(/ backdrop-blur-(sm|md|lg|xl|2xl|3xl|none)/g, '');
  content = content.replace(/backdrop-blur-(sm|md|lg|xl|2xl|3xl|none) /g, '');
  content = content.replace(/ backdrop-blur-\[[^\]]+\]/g, '');
  content = content.replace(/backdrop-blur-\[[^\]]+\] /g, '');

  // Fix backgrounds that relied on blur for readability
  // E.g., modals with bg-black/40 might need bg-black/60 to be dark enough
  content = content.replace(/bg-black\/40/g, 'bg-black/60');
  content = content.replace(/bg-gray-900\/40/g, 'bg-gray-900/60');
  content = content.replace(/bg-black\/30/g, 'bg-black/50');
  content = content.replace(/bg-black\/20/g, 'bg-black/40');
  content = content.replace(/bg-black\/10/g, 'bg-black/30');
  content = content.replace(/bg-black\/5/g, 'bg-black/20');
  
  // White overlays relying on blur (like in DesignerView bg-white/50 backdrop-blur-xl)
  content = content.replace(/bg-white\/50/g, 'bg-white/95');
  content = content.replace(/bg-white\/40/g, 'bg-white/95');
  content = content.replace(/bg-white\/20/g, 'bg-white/90');

  // bg-gray-900/10 -> bg-gray-900/30 (hover overlays)
  content = content.replace(/bg-gray-900\/10/g, 'bg-gray-900/30');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    totalChanges++;
    console.log('Updated: ' + path.basename(file));
  }
});

console.log('Total files updated: ' + totalChanges);
