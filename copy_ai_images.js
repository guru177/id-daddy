const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\e71592b4-2a3e-4d01-aba2-515beba4fb6c';
const destDir = 'c:\\Users\\ASUS\\Pictures\\id-daddy\\test_data\\images';

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(srcDir);

for (let i = 1; i <= 20; i++) {
    const prefix = `student_${i}_`;
    const matchedFile = files.find(f => f.startsWith(prefix) && f.endsWith('.png'));
    if (matchedFile) {
        fs.copyFileSync(path.join(srcDir, matchedFile), path.join(destDir, `${i}.png`));
        console.log(`Copied ${matchedFile} to ${i}.png`);
    } else {
        console.log(`Could not find image for student_${i}`);
    }
}
