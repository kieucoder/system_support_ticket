const fs = require('fs');
const path = require('path');

const ICON_MAPPING = {
    'bi bi-house': 'fa-solid fa-house',
    'bi bi-speedometer2': 'fa-solid fa-gauge-high',
    'bi bi-ticket-perforated': 'fa-solid fa-ticket',
    'bi bi-chat-dots': 'fa-solid fa-comments',
    'bi bi-calendar-event': 'fa-solid fa-calendar-days',
    'bi bi-star-fill': 'fa-solid fa-star',
    'bi bi-star': 'fa-regular fa-star',
    'bi bi-person-circle': 'fa-solid fa-user',
    'bi bi-people': 'fa-solid fa-users',
    'bi bi-gear': 'fa-solid fa-gears',
    'bi bi-graph-up-arrow': 'fa-solid fa-chart-line',
    'bi bi-box-arrow-right': 'fa-solid fa-right-from-bracket',
    'bi bi-telephone-fill': 'fa-solid fa-phone',
    'bi bi-envelope-fill': 'fa-solid fa-envelope',
    'bi bi-clock-fill': 'fa-solid fa-clock',
    'bi bi-question-circle': 'fa-solid fa-circle-question',
    'bi bi-headset': 'fa-solid fa-headset',
    'bi bi-paperclip': 'fa-solid fa-paperclip',
    'bi bi-upload': 'fa-solid fa-upload',
    'bi bi-chevron-right': 'fa-solid fa-chevron-right',
    'bi bi-chevron-left': 'fa-solid fa-chevron-left',
    'bi bi-chevron-down': 'fa-solid fa-chevron-down',
    'bi bi-search': 'fa-solid fa-search',
    'bi bi-pencil': 'fa-solid fa-pencil',
    'bi bi-trash': 'fa-solid fa-trash',
    'bi bi-plus-lg': 'fa-solid fa-plus',
    'bi bi-check-lg': 'fa-solid fa-check',
    'bi bi-x-lg': 'fa-solid fa-times',
    'bi bi-bell': 'fa-solid fa-bell',
    'bi bi-robot': 'fa-solid fa-robot',
    'bi bi-book': 'fa-solid fa-book',
    'bi bi-grid': 'fa-solid fa-grid',
    'bi bi-cpu': 'fa-solid fa-cpu',
    'bi bi-key-fill': 'fa-solid fa-key',
    'bi bi-lock-fill': 'fa-solid fa-lock',
    'bi bi-building': 'fa-solid fa-building',
    'bi bi-geo-alt-fill': 'fa-solid fa-map-marker',
    'bi bi-shield-lock-fill': 'fa-solid fa-shield',
    'bi bi-sliders': 'fa-solid fa-sliders',
    'bi bi-wrench': 'fa-solid fa-wrench',
    'bi bi-exclamation-circle-fill': 'fa-solid fa-circle-exclamation',
    'bi bi-info-circle-fill': 'fa-solid fa-circle-info',
    'bi bi-check-circle-fill': 'fa-solid fa-circle-check',
    'bi bi-file-earmark-text': 'fa-solid fa-file',
    'bi bi-send-fill': 'fa-solid fa-paper-plane'
};

function processFile(filepath) {
    console.log(`Processing: ${filepath}`);
    let content = fs.readFileSync(filepath, 'utf8');
    const originalContent = content;

    for (const [biClass, faClass] of Object.entries(ICON_MAPPING)) {
        const regex = new RegExp('\\b' + escapeRegExp(biClass) + '\\b', 'g');
        content = content.replace(regex, faClass);
    }

    if (content !== originalContent) {
        fs.writeFileSync(filepath, content, 'utf8');
        console.log(`  --> Restored successfully!`);
    } else {
        console.log(`  --> No changes needed.`);
    }
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function walkDir(dir, exclude) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!exclude.includes(file)) {
                walkDir(fullPath, exclude);
            }
        } else if (file.endsWith('.html')) {
            processFile(fullPath);
        }
    }
}

function main() {
    const rootDir = 'd:\\SupportTech';
    const exclude = ['.git', '.gemini', 'node_modules', 'scratch'];
    walkDir(rootDir, exclude);
}

main();
