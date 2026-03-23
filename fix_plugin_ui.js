const fs = require('fs');
const path = require('path');

const pluginsDir = path.join(__dirname, 'backend-laravel/public/plugins');
const plugins = ['booking', 'events', 'restaurant', 'salon', 'lms', 'forum', 'jobboard', 'realestate', 'membership', 'lucky-draw'];

for (const p of plugins) {
    const bundlePath = path.join(pluginsDir, p, 'bundle.js');
    if (!fs.existsSync(bundlePath)) {
        console.log(`Skip: ${p}`);
        continue;
    }
    
    let content = fs.readFileSync(bundlePath, 'utf8');
    let original = content;

    console.log(`Processing: ${p}`);

    // Replace primary buttons
    content = content.replace(/class="[a-z]{2}-btn-primary"/g, 'class="btn-primary btn-sm"');
    
    // Fix empty Edit buttons: <button @click="openEdit(s)"></button>
    content = content.replace(/<button\s+@click="([a-zA-Z]+\(.*?\))"\s*><\/button>/g, '<button class="btn-ghost btn-sm" style="color:var(--plugin-blue)" @click="$1">Sửa</button>');
    
    // Fix "Xoá" buttons
    // Specifically looking for empty delete buttons: <button class="bk-btn-del" @click="remove(s.id)"></button>
    content = content.replace(/<button\s+class="[a-z]{2}-btn-del"\s+@click="([a-zA-Z]+\(.*?\))"\s*><\/button>/g, '<button class="btn-ghost btn-sm" style="color:var(--plugin-red)" @click="$1">Xoá</button>');
    
    // Fix any remaining delete buttons (if they had text inside)
    content = content.replace(/class="[a-z]{2}-btn-del"/g, 'class="btn-ghost btn-sm" style="color:var(--plugin-red)"');

    // Replace "← Quay lại"
    content = content.replace(/class="[a-z]{2}-btn-back"/g, 'class="btn-ghost btn-sm" style="margin-bottom:15px"');

    // Replace tab active classes via Vue :class bindings
    content = content.replace(/:class="\{'([a-z]{2}-tab-active)':(\s*tab\s*===\s*'[^']+')\}"/g, ':class="$2 ? \'btn-primary\' : \'btn-ghost\'"');

    // Modals: Change `[a-z]{2}-modal-actions` to `modal-actions`
    content = content.replace(/class="[a-z]{2}-modal-actions"/g, 'class="modal-actions"');
    
    // Modals: Change `[a-z]{2}-modal` to `modal` and `[a-z]{2}-modal-overlay` to `modal-overlay`
    // Usually defined as `<div class="bk-modal-overlay"...><div class="bk-modal">`
    content = content.replace(/class="[a-z]{2}-modal-overlay(?:\s+modal-overlay)?"/g, 'class="modal-overlay"');
    content = content.replace(/class="[a-z]{2}-modal(?:\s+modal)?"/g, 'class="modal"');

    // Inputs: Change `[a-z]{2}-form-row` to `form-row` and `[a-z]{2}-check` to `form-group`
    content = content.replace(/class="[a-z]{2}-form-row"/g, 'class="form-row"');
    
    // Modal action buttons
    // If it was already converted to btn-primary during the first replace, it might be.
    // Try to catch Cancel buttons
    content = content.replace(/<button\s+@click="showModal=false"\s*>Huỷ<\/button>/g, '<button class="btn-cancel" @click="showModal=false">Huỷ</button>');
    
    // Try to catch the save button in modals:
    // It might currently look like `<button class="btn-primary btn-sm" @click="save">Lưu</button>`
    content = content.replace(/<button\s+class="btn-primary btn-sm"\s+@click="(?:save|submit[^"]*)"\s*>Lưu<\/button>/g, '<button class="btn-save" @click="save">Lưu</button>');

    if (content !== original) {
        fs.writeFileSync(bundlePath, content, 'utf8');
        console.log(`Fixed UI in: ${p}`);
    } else {
        console.log(`No changes made to: ${p}`);
    }
}
