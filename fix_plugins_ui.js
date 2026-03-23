const fs = require('fs');
const path = require('path');

const pluginsDir = path.join(__dirname, 'backend-laravel/public/plugins');
const vuePlugins = ['booking', 'events', 'restaurant', 'salon', 'lms', 'forum', 'jobboard', 'realestate', 'membership']; // lucky-draw already done

for (let p of vuePlugins) {
    const bundlePath = path.join(pluginsDir, p, 'bundle.js');
    if (!fs.existsSync(bundlePath)) continue;
    
    let content = fs.readFileSync(bundlePath, 'utf8');
    
    // Replace <button class="...-btn-primary" to use "btn-primary btn-sm"
    content = content.replace(/class="[a-z]{2}-btn-primary"/g, 'class="btn-primary btn-sm"');
    
    // Replace <button class="...-btn-del" to use "btn-ghost btn-sm" with Xoá text (if empty)
    content = content.replace(/class="[a-z]{2}-btn-del"\s?(.*?)><\/button>/g, 'class="btn-ghost btn-sm" style="color:var(--plugin-red)" $1>Xoá</button>');
    content = content.replace(/class="[a-z]{2}-btn-del"/g, 'class="btn-ghost btn-sm" style="color:var(--plugin-red)"');
    
    // Replace empty <button @click="openEdit(...)"></button> with Sửa text
    content = content.replace(/<button\s+@click="openEdit\((.*?)\)"\s*><\/button>/g, '<button class="btn-ghost btn-sm" style="color:var(--plugin-blue)" @click="openEdit($1)">Sửa</button>');
    
    // Replace "← Quay lại" btn-back
    content = content.replace(/class="[a-z]{2}-btn-back"/g, 'class="btn-ghost btn-sm"');

    // Replace the drawing button in lms/forum if any similar pattern exists
    // (We only replaced lucky-draw explicitly, but let's do safe generalized regex if needed)
    
    // Also fix tabs if they use { '...-tab-active': tab === '...'}
    // To match our standard: :class="tab==='...' ? 'btn-primary' : 'btn-ghost btn-sm'"
    content = content.replace(/:class="\{\'[a-z]{2}-tab-active\':\s*tab\s*===\s*'([A-Za-z0-9_]+)'\}"/g, ':class="tab===\'$1\' ? \'btn-primary\' : \'btn-ghost btn-sm\'"');

    // Replace modal save/cancel buttons
    // <button @click="showModal=false">Huỷ</button> -> <button class="btn-cancel" ...
    content = content.replace(/<button\s+@click="showModal=false">\s*Huỷ\s*<\/button>/g, '<button class="btn-cancel" @click="showModal=false">Huỷ</button>');
    
    // Replace old modal save logic which had class "...-btn-primary" -> actually it already updated to btn-primary!
    // But let's change btn-primary in modals to btn-save
    // We can just rely on .btn-save for the modal actions
    content = content.replace(/<div class="[a-z]{2}-modal-actions">/g, '<div class="modal-actions">');
    // Inside modal-actions, replace btn-primary with btn-save
    // (A little risky to do regex generically without AST, but we can do a literal replace)
    content = content.replace(/<div class="modal-actions"><button class="btn-primary btn-sm" @click="save">Lưu<\/button>/g, '<div class="modal-actions"><button class="btn-save" @click="save">Lưu</button>');

    fs.writeFileSync(bundlePath, content, 'utf8');
    console.log('Fixed UI in: ' + p);
}
