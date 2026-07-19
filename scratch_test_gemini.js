const fs = require('fs');
const path = require('path');

const searchDirs = [
    process.env.APPDATA ? path.join(process.env.APPDATA, 'Code', 'User', 'History') : null,
    process.env.APPDATA ? path.join(process.env.APPDATA, 'Code - Insiders', 'User', 'History') : null,
    process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'Documents', 'Visual Studio 2022', 'Backup Files') : null,
    process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'Documents', 'Visual Studio 2019', 'Backup Files') : null,
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Microsoft', 'VisualStudio', 'BackupFiles') : null,
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Microsoft', 'VisualStudio') : null
].filter(Boolean);

console.log("Searching for files containing 'ChatTrucTuyen' in backups...");
const found = [];

function walk(dir) {
    if (!fs.existsSync(dir)) return;
    let list;
    try {
        list = fs.readdirSync(dir);
    } catch (e) {
        return;
    }
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        let stat;
        try {
            stat = fs.statSync(fullPath);
        } catch (e) {
            return;
        }
        if (stat.isDirectory()) {
            walk(fullPath);
        } else {
            if (file.endsWith('.cs') || file.endsWith('.json') || file.endsWith('.txt') || file.length === 40) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    if (content.includes('ChatTrucTuyen') && content.includes('CustomersController')) {
                        console.log(`Found match: ${fullPath} (size: ${content.length} chars)`);
                        found.push({ path: fullPath, size: content.length });
                    }
                } catch (e) {}
            }
        }
    });
}

searchDirs.forEach(dir => {
    console.log(`Searching in: ${dir}`);
    walk(dir);
});

if (found.length === 0) {
    console.log("No backup files found.");
} else {
    console.log(`Done. Found ${found.length} candidate files.`);
}
