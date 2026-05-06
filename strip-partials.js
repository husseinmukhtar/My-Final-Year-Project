const fs = require('fs');
const path = require('path');

const dir = 'c:/xampp/htdocs/orphanage-management-system/node_backend/views';

function processDirectory(directory) {
    const files = fs.readdirSync(directory);
    
    files.forEach(file => {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            if (file !== 'layouts' && file !== 'partials') {
                processDirectory(fullPath);
            }
        } else if (file.endsWith('.ejs')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;

            // Remove partials includes
            content = content.replace(/<%-\s*include\(['"][^'"]*(header|footer|sidebar)[^'"]*['"](,\s*\{[^}]*\})?\)\s*%>/gi, '');
            
            if (content !== original) {
                fs.writeFileSync(fullPath, content.trim() + '\n');
                console.log('Removed partials from', fullPath);
            }
        }
    });
}

processDirectory(dir);
console.log('Done stripping partials');
