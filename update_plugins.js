const fs = require('fs');
const path = require('path');

function updateHelpers(file) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('export function useI18n')) {
      content += `\nexport function useI18n() {\n  const bridge = window.__APP_BRIDGE__\n  return {\n    t: bridge?.t || ((key, fallback) => fallback || key)\n  }\n}\n`;
      fs.writeFileSync(file, content);
      console.log('Updated ' + file);
    }
  }
}

updateHelpers('plugins/warehouse/src/helpers.js');
updateHelpers('plugins/accounting/src/helpers.js');

const copies = [
  ['frontend/src/components/SupplierForm.vue', 'plugins/warehouse/src/components/SupplierForm.vue'],
  ['frontend/src/components/SupplierManager.vue', 'plugins/warehouse/src/components/SupplierManager.vue'],
  ['frontend/src/components/PurchaseOrderForm.vue', 'plugins/warehouse/src/components/PurchaseOrderForm.vue'],
  ['frontend/src/components/PurchaseOrderDetail.vue', 'plugins/warehouse/src/components/PurchaseOrderDetail.vue'],
  ['frontend/src/components/PurchaseOrderManager.vue', 'plugins/warehouse/src/components/PurchaseOrderManager.vue'],
  ['frontend/src/components/StockReceiptForm.vue', 'plugins/warehouse/src/components/StockReceiptForm.vue'],
  ['frontend/src/components/StockReceiptDetail.vue', 'plugins/warehouse/src/components/StockReceiptDetail.vue'],
  ['frontend/src/components/StockReceiptManager.vue', 'plugins/warehouse/src/components/StockReceiptManager.vue'],
  ['frontend/src/components/PaymentVoucherForm.vue', 'plugins/accounting/src/components/PaymentVoucherForm.vue'],
  ['frontend/src/components/PaymentVoucherManager.vue', 'plugins/accounting/src/components/PaymentVoucherManager.vue'],
];

copies.forEach(([src, dest]) => {
  if (fs.existsSync(src)) {
    let content = fs.readFileSync(src, 'utf8');
    // Replace composables with ../helpers.js
    content = content.replace(/['"]\.\.\/composables\/useI18n\.js['"]/g, "'../helpers.js'");
    content = content.replace(/['"]\.\.\/composables\/useApi\.js['"]/g, "'../helpers.js'");
    content = content.replace(/['"]\.\.\/composables\/useToast\.js['"]/g, "'../helpers.js'");
    
    fs.writeFileSync(dest, content);
    console.log('Copied and patched ' + dest);
  } else {
    console.log('Missing ' + src);
  }
});
