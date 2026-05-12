const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // We'll replace any shadow class inside a string that belongs to a button.
    // Since proper parsing is hard, let's just find "className=" inside <button...>
    // Actually, we can use a regex to find all <button ...>...</button> or <button ... />
    // and then replace shadow classes inside them.
    let modified = content;
    
    // Regex to match anything from <button to >
    // It's not perfect but works for most cases
    const buttonRegex = /<button[\s\S]*?>/g;
    modified = modified.replace(buttonRegex, (match) => {
        // Strip out shadow classes
        // shadow-sm, shadow-md, shadow-lg, shadow-xl, shadow-2xl, shadow-none, shadow-inner
        // hover:shadow-sm, hover:shadow-md, hover:shadow-lg, hover:shadow-xl, hover:shadow-2xl
        // drop-shadow-md, etc.
        // shadow-[anything]
        return match.replace(/\b(?:hover:|focus:|active:|group-hover:)?(?:drop-)?shadow(?:-[a-zA-Z0-9/\[\]\.-]+)?\b/g, '');
    });

    if (content !== modified) {
        fs.writeFileSync(filePath, modified);
        console.log('Updated ' + filePath);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            processFile(fullPath);
        }
    }
}

walkDir('apps/desktop/src/renderer');
