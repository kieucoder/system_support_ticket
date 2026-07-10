import os
import re

# Mapping of Font Awesome class names to Bootstrap Icon class names
ICON_MAPPING = {
    # Brand / Navigation Icons
    r'fa-solid fa-house': 'bi bi-house',
    r'fa-house': 'bi bi-house',
    r'fa-solid fa-gauge-high': 'bi bi-speedometer2',
    r'fa-gauge-high': 'bi bi-speedometer2',
    r'fa-solid fa-ticket-perforated': 'bi bi-ticket-perforated',
    r'fa-ticket-perforated': 'bi bi-ticket-perforated',
    r'fa-solid fa-ticket': 'bi bi-ticket-perforated',
    r'fa-ticket': 'bi bi-ticket-perforated',
    r'fa-solid fa-comments': 'bi bi-chat-dots',
    r'fa-comments': 'bi bi-chat-dots',
    r'fa-solid fa-comment-dots': 'bi bi-chat-dots',
    r'fa-comment-dots': 'bi bi-chat-dots',
    r'fa-solid fa-calendar-days': 'bi bi-calendar-event',
    r'fa-calendar-days': 'bi bi-calendar-event',
    r'fa-solid fa-star': 'bi bi-star-fill',
    r'fa-star': 'bi bi-star-fill',
    r'fa-regular fa-star': 'bi bi-star',
    r'fa-solid fa-user-circle': 'bi bi-person-circle',
    r'fa-user-circle': 'bi bi-person-circle',
    r'fa-solid fa-user': 'bi bi-person-circle',
    r'fa-user': 'bi bi-person-circle',
    r'fa-regular fa-user': 'bi bi-person-circle',
    r'fa-solid fa-users': 'bi bi-people',
    r'fa-users': 'bi bi-people',
    r'fa-solid fa-gears': 'bi bi-gear',
    r'fa-gears': 'bi bi-gear',
    r'fa-solid fa-gear': 'bi bi-gear',
    r'fa-gear': 'bi bi-gear',
    r'fa-solid fa-cog': 'bi bi-gear',
    r'fa-cog': 'bi bi-gear',
    r'fa-solid fa-chart-line': 'bi bi-graph-up-arrow',
    r'fa-chart-line': 'bi bi-graph-up-arrow',
    r'fa-solid fa-chart-simple': 'bi bi-graph-up-arrow',
    r'fa-chart-simple': 'bi bi-graph-up-arrow',
    r'fa-solid fa-right-from-bracket': 'bi bi-box-arrow-right',
    r'fa-right-from-bracket': 'bi bi-box-arrow-right',
    
    # Common Utilities
    r'fa-solid fa-phone': 'bi bi-telephone-fill',
    r'fa-phone': 'bi bi-telephone-fill',
    r'fa-solid fa-envelope': 'bi bi-envelope-fill',
    r'fa-envelope': 'bi bi-envelope-fill',
    r'fa-solid fa-clock': 'bi bi-clock-fill',
    r'fa-clock': 'bi bi-clock-fill',
    r'fa-solid fa-circle-question': 'bi bi-question-circle',
    r'fa-circle-question': 'bi bi-question-circle',
    r'fa-question-circle': 'bi bi-question-circle',
    r'fa-solid fa-headset': 'bi bi-headset',
    r'fa-headset': 'bi bi-headset',
    r'fa-solid fa-paperclip': 'bi bi-paperclip',
    r'fa-paperclip': 'bi bi-paperclip',
    r'fa-solid fa-upload': 'bi bi-upload',
    r'fa-upload': 'bi bi-upload',
    r'fa-solid fa-chevron-right': 'bi bi-chevron-right',
    r'fa-chevron-right': 'bi bi-chevron-right',
    r'fa-solid fa-chevron-left': 'bi bi-chevron-left',
    r'fa-chevron-left': 'bi bi-chevron-left',
    r'fa-solid fa-chevron-down': 'bi bi-chevron-down',
    r'fa-chevron-down': 'bi bi-chevron-down',
    r'fa-solid fa-search': 'bi bi-search',
    r'fa-search': 'bi bi-search',
    r'fa-solid fa-pencil': 'bi bi-pencil',
    r'fa-pencil': 'bi bi-pencil',
    r'fa-solid fa-trash': 'bi bi-trash',
    r'fa-trash': 'bi bi-trash',
    r'fa-solid fa-plus': 'bi bi-plus-lg',
    r'fa-plus': 'bi bi-plus-lg',
    r'fa-solid fa-check': 'bi bi-check-lg',
    r'fa-check': 'bi bi-check-lg',
    r'fa-solid fa-times': 'bi bi-x-lg',
    r'fa-times': 'bi bi-x-lg',
    r'fa-solid fa-xmark': 'bi bi-x-lg',
    r'fa-xmark': 'bi bi-x-lg',
    r'fa-solid fa-bell': 'bi bi-bell',
    r'fa-bell': 'bi bi-bell',
    r'fa-solid fa-robot': 'bi bi-robot',
    r'fa-robot': 'bi bi-robot',
    r'fa-solid fa-book': 'bi bi-book',
    r'fa-book': 'bi bi-book',
    r'fa-solid fa-grid': 'bi bi-grid',
    r'fa-grid': 'bi bi-grid',
    r'fa-solid fa-cpu': 'bi bi-cpu',
    r'fa-cpu': 'bi bi-cpu',
    r'fa-solid fa-key': 'bi bi-key-fill',
    r'fa-key': 'bi bi-key-fill',
    r'fa-solid fa-lock': 'bi bi-lock-fill',
    r'fa-lock': 'bi bi-lock-fill',
    r'fa-solid fa-building': 'bi bi-building',
    r'fa-building': 'bi bi-building',
    r'fa-solid fa-map-marker': 'bi bi-geo-alt-fill',
    r'fa-map-marker': 'bi bi-geo-alt-fill',
    r'fa-solid fa-location-dot': 'bi bi-geo-alt-fill',
    r'fa-location-dot': 'bi bi-geo-alt-fill',
    r'fa-solid fa-shield': 'bi bi-shield-lock-fill',
    r'fa-shield': 'bi bi-shield-lock-fill',
    r'fa-solid fa-sliders': 'bi bi-sliders',
    r'fa-sliders': 'bi bi-sliders',
    r'fa-solid fa-wrench': 'bi bi-wrench',
    r'fa-wrench': 'bi bi-wrench',
    r'fa-solid fa-circle-exclamation': 'bi bi-exclamation-circle-fill',
    r'fa-circle-exclamation': 'bi bi-exclamation-circle-fill',
    r'fa-solid fa-circle-info': 'bi bi-info-circle-fill',
    r'fa-circle-info': 'bi bi-info-circle-fill',
    r'fa-solid fa-circle-check': 'bi bi-check-circle-fill',
    r'fa-circle-check': 'bi bi-check-circle-fill',
    r'fa-solid fa-file': 'bi bi-file-earmark-text',
    r'fa-file': 'bi bi-file-earmark-text',
    r'fa-solid fa-paper-plane': 'bi bi-send-fill',
    r'fa-paper-plane': 'bi bi-send-fill',
}

def process_file(filepath):
    print(f"Processing: {filepath}")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    # 1. First run exact replacements for matches in class tags
    for fa_class, bi_class in ICON_MAPPING.items():
        # Match class="..." containing the Font Awesome string
        # e.g., class="fa-solid fa-house me-2" or class="me-2 fa-solid fa-house"
        pattern = r'\b' + re.escape(fa_class) + r'\b'
        content = re.sub(pattern, bi_class, content)

    # 2. Match any remaining Font Awesome classes that might be standalone or variations
    # such as 'fa fa-something' or 'fa-regular fa-something' and clean up syntax.
    # Replace general font-awesome syntax within class tags
    content = content.replace('fa-solid fa-', 'bi bi-')
    content = content.replace('fa-regular fa-', 'bi bi-')
    content = content.replace('fa-brands fa-', 'bi bi-')
    content = content.replace('fa fa-', 'bi bi-')

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  --> Updated successfully!")
    else:
        print(f"  --> No changes needed.")

def main():
    root_dir = r"d:\SupportTech"
    exclude_dirs = {'.git', '.gemini', 'node_modules', 'scratch'}
    
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Exclude directories in-place
        dirnames[:] = [d for d in dirnames if d not in exclude_dirs]
        
        for filename in filenames:
            if filename.endswith('.html'):
                filepath = os.path.join(dirpath, filename)
                process_file(filepath)

if __name__ == '__main__':
    main()
