const fs = require('fs');
const path = require('path');

const ICON_MAPPING = {
    // Brand / Navigation Icons
    'fa-solid fa-house': 'bi bi-house',
    'fa-house': 'bi bi-house',
    'fa-solid fa-gauge-high': 'bi bi-speedometer2',
    'fa-gauge-high': 'bi bi-speedometer2',
    'fa-solid fa-ticket-perforated': 'bi bi-ticket-perforated',
    'fa-ticket-perforated': 'bi bi-ticket-perforated',
    'fa-solid fa-ticket': 'bi bi-ticket-perforated',
    'fa-ticket': 'bi bi-ticket-perforated',
    'fa-solid fa-comments': 'bi bi-chat-dots',
    'fa-comments': 'bi bi-chat-dots',
    'fa-solid fa-comment-dots': 'bi bi-chat-dots',
    'fa-comment-dots': 'bi bi-chat-dots',
    'fa-solid fa-calendar-days': 'bi bi-calendar-event',
    'fa-calendar-days': 'bi bi-calendar-event',
    'fa-solid fa-star': 'bi bi-star-fill',
    'fa-star': 'bi bi-star-fill',
    'fa-regular fa-star': 'bi bi-star',
    'fa-solid fa-user-circle': 'bi bi-person-circle',
    'fa-user-circle': 'bi bi-person-circle',
    'fa-solid fa-user': 'bi bi-person-circle',
    'fa-user': 'bi bi-person-circle',
    'fa-regular fa-user': 'bi bi-person-circle',
    'fa-solid fa-users': 'bi bi-people',
    'fa-users': 'bi bi-people',
    'fa-solid fa-gears': 'bi bi-gear',
    'fa-gears': 'bi bi-gear',
    'fa-solid fa-gear': 'bi bi-gear',
    'fa-gear': 'bi bi-gear',
    'fa-solid fa-cog': 'bi bi-gear',
    'fa-cog': 'bi bi-gear',
    'fa-solid fa-chart-line': 'bi bi-graph-up-arrow',
    'fa-chart-line': 'bi bi-graph-up-arrow',
    'fa-solid fa-chart-simple': 'bi bi-graph-up-arrow',
    'fa-chart-simple': 'bi bi-graph-up-arrow',
    'fa-solid fa-right-from-bracket': 'bi bi-box-arrow-right',
    'fa-right-from-bracket': 'bi bi-box-arrow-right',
    
    // Common Utilities
    'fa-solid fa-phone': 'bi bi-telephone-fill',
    'fa-phone': 'bi bi-telephone-fill',
    'fa-solid fa-envelope': 'bi bi-envelope-fill',
    'fa-envelope': 'bi bi-envelope-fill',
    'fa-solid fa-clock': 'bi bi-clock-fill',
    'fa-clock': 'bi bi-clock-fill',
    'fa-solid fa-circle-question': 'bi bi-question-circle',
    'fa-circle-question': 'bi bi-question-circle',
    'fa-question-circle': 'bi bi-question-circle',
    'fa-solid fa-headset': 'bi bi-headset',
    'fa-headset': 'bi bi-headset',
    'fa-solid fa-paperclip': 'bi bi-paperclip',
    'fa-paperclip': 'bi bi-paperclip',
    'fa-solid fa-upload': 'bi bi-upload',
    'fa-upload': 'bi bi-upload',
    'fa-solid fa-chevron-right': 'bi bi-chevron-right',
    'fa-chevron-right': 'bi bi-chevron-right',
    'fa-solid fa-chevron-left': 'bi bi-chevron-left',
    'fa-chevron-left': 'bi bi-chevron-left',
    'fa-solid fa-chevron-down': 'bi bi-chevron-down',
    'fa-chevron-down': 'bi bi-chevron-down',
    'fa-solid fa-search': 'bi bi-search',
    'fa-search': 'bi bi-search',
    'fa-solid fa-pencil': 'bi bi-pencil',
    'fa-pencil': 'bi bi-pencil',
    'fa-solid fa-trash': 'bi bi-trash',
    'fa-trash': 'bi bi-trash',
    'fa-solid fa-plus': 'bi bi-plus-lg',
    'fa-plus': 'bi bi-plus-lg',
    'fa-solid fa-check': 'bi bi-check-lg',
    'fa-check': 'bi bi-check-lg',
    'fa-solid fa-times': 'bi bi-x-lg',
    'fa-times': 'bi bi-x-lg',
    'fa-solid fa-xmark': 'bi bi-x-lg',
    'fa-xmark': 'bi bi-x-lg',
    'fa-solid fa-bell': 'bi bi-bell',
    'fa-bell': 'bi bi-bell',
    'fa-solid fa-robot': 'bi bi-robot',
    'fa-robot': 'bi bi-robot',
    'fa-solid fa-book': 'bi bi-book',
    'fa-book': 'bi bi-book',
    'fa-solid fa-grid': 'bi bi-grid',
    'fa-grid': 'bi bi-grid',
    'fa-solid fa-cpu': 'bi bi-cpu',
    'fa-cpu': 'bi bi-cpu',
    'fa-solid fa-key': 'bi bi-key-fill',
    'fa-key': 'bi bi-key-fill',
    'fa-solid fa-lock': 'bi bi-lock-fill',
    'fa-lock': 'bi bi-lock-fill',
    'fa-solid fa-building': 'bi bi-building',
    'fa-building': 'bi bi-building',
    'fa-solid fa-map-marker': 'bi bi-geo-alt-fill',
    'fa-map-marker': 'bi bi-geo-alt-fill',
    'fa-solid fa-location-dot': 'bi bi-geo-alt-fill',
    'fa-location-dot': 'bi bi-geo-alt-fill',
    'fa-solid fa-shield': 'bi bi-shield-lock-fill',
    'fa-shield': 'bi bi-shield-lock-fill',
    'fa-solid fa-sliders': 'bi bi-sliders',
    'fa-sliders': 'bi bi-sliders',
    'fa-solid fa-wrench': 'bi bi-wrench',
    'fa-wrench': 'bi bi-wrench',
    'fa-solid fa-circle-exclamation': 'bi bi-exclamation-circle-fill',
    'fa-circle-exclamation': 'bi bi-exclamation-circle-fill',
    'fa-solid fa-circle-info': 'bi bi-info-circle-fill',
    'fa-circle-info': 'bi bi-info-circle-fill',
    'fa-solid fa-circle-check': 'bi bi-check-circle-fill',
    'fa-circle-check': 'bi bi-check-circle-fill',
    'fa-solid fa-file': 'bi bi-file-earmark-text',
    'fa-file': 'bi bi-file-earmark-text',
    'fa-solid fa-paper-plane': 'bi bi-send-fill',
    'fa-paper-plane': 'bi bi-send-fill'
};

function processFile(filepath) {
    console.log(`Processing: ${filepath}`);
    let content = fs.readFileSync(filepath, 'utf8');
    const originalContent = content;

    // 1. First run exact replacements for mapping dictionary
    for (const [faClass, biClass] of Object.entries(ICON_MAPPING)) {
        const regex = new RegExp('\\b' + escapeRegExp(faClass) + '\\b', 'g');
        content = content.replace(regex, biClass);
    }

    // 2. Perform global replacements for other common variations
    content = content.replace(/\bfa-solid fa-/g, 'bi bi-');
    content = content.replace(/\bfa-regular fa-/g, 'bi bi-');
    content = content.replace(/\bfa-brands fa-/g, 'bi bi-');
    content = content.replace(/\bfa fa-/g, 'bi bi-');

    if (content !== originalContent) {
        fs.writeFileSync(filepath, content, 'utf8');
        console.log(`  --> Updated successfully!`);
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
