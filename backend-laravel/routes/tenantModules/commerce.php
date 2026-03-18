<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\OrdersController;
use App\Http\Controllers\Tenant\CartController;
use App\Http\Controllers\Tenant\PromotionsController;
use App\Http\Controllers\Tenant\ShopCustomersController;
use App\Http\Controllers\Tenant\CouponsController;
use App\Http\Controllers\Tenant\TaxController;
use App\Http\Controllers\Tenant\AccountingController;
use App\Http\Controllers\Tenant\InvoiceController;

// Orders
Route::get('/orders', [OrdersController::class, 'index'])->middleware('permission:orders.view');
Route::get('/orders/stats', [OrdersController::class, 'stats'])->middleware('permission:orders.view');
Route::post('/orders', [OrdersController::class, 'store'])->middleware('permission:orders.create');
Route::get('/orders/{id}', [OrdersController::class, 'show'])->middleware('permission:orders.view');
Route::put('/orders/{id}', [OrdersController::class, 'update'])->middleware('permission:orders.edit');
Route::delete('/orders/{id}', [OrdersController::class, 'destroy'])->middleware('permission:orders.delete');
Route::get('/orders/{id}/details', [OrdersController::class, 'getDetails'])->middleware('permission:orders.view');
Route::get('/orders/{id}/totals', [OrdersController::class, 'getTotals'])->middleware('permission:orders.view');
Route::get('/orders/{id}/history', [OrdersController::class, 'getHistory'])->middleware('permission:orders.view');
Route::put('/orders/{id}/status', [OrdersController::class, 'updateStatus'])->middleware('permission:orders.edit');
Route::get('/order-statuses', [OrdersController::class, 'getOrderStatuses'])->middleware('permission:orders.view');
Route::get('/payment-statuses', [OrdersController::class, 'getPaymentStatuses'])->middleware('permission:orders.view');

// Cart (no permission needed — internal use)
Route::get('/cart', [CartController::class, 'index']);
Route::post('/cart/items', [CartController::class, 'addItem']);
Route::put('/cart/items/{productId}', [CartController::class, 'updateItem']);
Route::delete('/cart/items/{productId}', [CartController::class, 'removeItem']);

// Promotions
Route::get('/promotions', [PromotionsController::class, 'index'])->middleware('permission:promotions.view');
Route::post('/promotions', [PromotionsController::class, 'store'])->middleware('permission:promotions.create');
Route::put('/promotions/{id}', [PromotionsController::class, 'update'])->middleware('permission:promotions.edit');
Route::delete('/promotions/{id}', [PromotionsController::class, 'destroy'])->middleware('permission:promotions.delete');

// Shop Customers
Route::get('/shop-customers', [ShopCustomersController::class, 'index'])->middleware('permission:customers.view');
Route::post('/shop-customers', [ShopCustomersController::class, 'store'])->middleware('permission:customers.edit');
Route::get('/shop-customers/{id}', [ShopCustomersController::class, 'show'])->middleware('permission:customers.view');
Route::put('/shop-customers/{id}', [ShopCustomersController::class, 'update'])->middleware('permission:customers.edit');
Route::delete('/shop-customers/{id}', [ShopCustomersController::class, 'destroy'])->middleware('permission:customers.delete');
Route::get('/shop-customers/{customerId}/addresses', [ShopCustomersController::class, 'listAddresses'])->middleware('permission:customers.view');
Route::post('/shop-customers/{customerId}/addresses', [ShopCustomersController::class, 'addAddress'])->middleware('permission:customers.edit');
Route::put('/shop-customers/{customerId}/addresses/{id}', [ShopCustomersController::class, 'updateAddress'])->middleware('permission:customers.edit');
Route::delete('/shop-customers/{customerId}/addresses/{id}', [ShopCustomersController::class, 'deleteAddress'])->middleware('permission:customers.delete');

// Coupons
Route::get('/coupons', [CouponsController::class, 'index'])->middleware('permission:promotions.view');
Route::post('/coupons', [CouponsController::class, 'store'])->middleware('permission:promotions.create');
Route::put('/coupons/{id}', [CouponsController::class, 'update'])->middleware('permission:promotions.edit');
Route::delete('/coupons/{id}', [CouponsController::class, 'destroy'])->middleware('permission:promotions.delete');
Route::post('/coupons/validate', [CouponsController::class, 'validate'])->middleware('permission:promotions.view');

// Tax Rates
Route::get('/tax-rates', [TaxController::class, 'index'])->middleware('permission:settings.view');
Route::post('/tax-rates', [TaxController::class, 'store'])->middleware('permission:settings.manage');
Route::get('/tax-rates/{id}', [TaxController::class, 'show'])->middleware('permission:settings.view');
Route::put('/tax-rates/{id}', [TaxController::class, 'update'])->middleware('permission:settings.manage');
Route::delete('/tax-rates/{id}', [TaxController::class, 'destroy'])->middleware('permission:settings.manage');
Route::get('/tax-config', [TaxController::class, 'getConfig'])->middleware('permission:settings.view');
Route::put('/tax-config', [TaxController::class, 'updateConfig'])->middleware('permission:settings.manage');
Route::post('/tax-preview', [TaxController::class, 'preview']); // Storefront use — no auth needed

// Accounting
Route::get('/accounting/summary', [AccountingController::class, 'summary'])->middleware('permission:orders.view');
Route::get('/accounting/monthly', [AccountingController::class, 'monthly'])->middleware('permission:orders.view');
Route::get('/accounting/tax-report', [AccountingController::class, 'taxReport'])->middleware('permission:orders.view');
Route::get('/accounting/profit-loss', [AccountingController::class, 'profitLoss'])->middleware('permission:orders.view');
Route::get('/accounting/balance-sheet', [AccountingController::class, 'balanceSheet'])->middleware('permission:orders.view');
Route::get('/accounting/entries', [AccountingController::class, 'index'])->middleware('permission:orders.view');
Route::post('/accounting/entries', [AccountingController::class, 'store'])->middleware('permission:settings.manage');
Route::put('/accounting/entries/{id}', [AccountingController::class, 'update'])->middleware('permission:settings.manage');
Route::delete('/accounting/entries/{id}', [AccountingController::class, 'destroy'])->middleware('permission:settings.manage');

// Invoices
Route::get('/invoices', [InvoiceController::class, 'index'])->middleware('permission:orders.view');
Route::post('/invoices', [InvoiceController::class, 'store'])->middleware('permission:orders.edit');
Route::get('/invoices/{id}', [InvoiceController::class, 'show'])->middleware('permission:orders.view');
Route::get('/invoices/{id}/preview', [InvoiceController::class, 'preview'])->middleware('permission:orders.view');
Route::put('/invoices/{id}/status', [InvoiceController::class, 'updateStatus'])->middleware('permission:orders.edit');
Route::post('/invoices/{id}/send-email', [InvoiceController::class, 'sendEmail'])->middleware('permission:orders.edit');
Route::post('/invoices/from-order/{orderId}', [InvoiceController::class, 'createFromOrder'])->middleware('permission:orders.edit');
Route::delete('/invoices/{id}', [InvoiceController::class, 'destroy'])->middleware('permission:orders.edit');
Route::get('/invoices/{id}/pdf', [InvoiceController::class, 'exportPdf'])->middleware('permission:orders.view');

// Export CSV & Excel
Route::get('/accounting/export-entries', [AccountingController::class, 'exportEntries'])->middleware('permission:orders.view');
Route::get('/accounting/export-tax-report', [AccountingController::class, 'exportTaxReport'])->middleware('permission:orders.view');
Route::get('/accounting/export-entries-excel', [AccountingController::class, 'exportEntriesExcel'])->middleware('permission:orders.view');
Route::get('/accounting/export-tax-excel', [AccountingController::class, 'exportTaxReportExcel'])->middleware('permission:orders.view');
Route::get('/accounting/export-combined', [AccountingController::class, 'exportCombinedExcel'])->middleware('permission:orders.view');
Route::get('/accounting/config', [AccountingController::class, 'getConfig'])->middleware('permission:settings.view');
Route::put('/accounting/config', [AccountingController::class, 'updateConfig'])->middleware('permission:settings.manage');

// Stock Receipts (Phiếu nhập/xuất kho)
use App\Http\Controllers\Tenant\StockReceiptController;
Route::get('/stock-receipts', [StockReceiptController::class, 'index'])->middleware('permission:orders.view');
Route::get('/stock-receipts/stats', [StockReceiptController::class, 'stats'])->middleware('permission:orders.view');
Route::post('/stock-receipts', [StockReceiptController::class, 'store'])->middleware('permission:orders.edit');
Route::get('/stock-receipts/{id}', [StockReceiptController::class, 'show'])->middleware('permission:orders.view');
Route::put('/stock-receipts/{id}', [StockReceiptController::class, 'update'])->middleware('permission:orders.edit');
Route::post('/stock-receipts/{id}/confirm', [StockReceiptController::class, 'confirm'])->middleware('permission:orders.edit');
Route::post('/stock-receipts/{id}/cancel', [StockReceiptController::class, 'cancel'])->middleware('permission:orders.edit');
Route::delete('/stock-receipts/{id}', [StockReceiptController::class, 'destroy'])->middleware('permission:orders.edit');

// Suppliers (Nhà cung cấp)
use App\Http\Controllers\Tenant\SupplierController;
Route::get('/suppliers', [SupplierController::class, 'index'])->middleware('permission:orders.view');
Route::post('/suppliers', [SupplierController::class, 'store'])->middleware('permission:settings.manage');
Route::get('/suppliers/debt-report', [SupplierController::class, 'debtReport'])->middleware('permission:orders.view');
Route::get('/suppliers/{id}', [SupplierController::class, 'show'])->middleware('permission:orders.view');
Route::put('/suppliers/{id}', [SupplierController::class, 'update'])->middleware('permission:settings.manage');
Route::delete('/suppliers/{id}', [SupplierController::class, 'destroy'])->middleware('permission:settings.manage');

// Payment Vouchers (Phiếu thu/chi)
use App\Http\Controllers\Tenant\PaymentVoucherController;
Route::get('/payment-vouchers', [PaymentVoucherController::class, 'index'])->middleware('permission:orders.view');
Route::get('/payment-vouchers/stats', [PaymentVoucherController::class, 'stats'])->middleware('permission:orders.view');
Route::post('/payment-vouchers', [PaymentVoucherController::class, 'store'])->middleware('permission:orders.edit');
Route::get('/payment-vouchers/{id}', [PaymentVoucherController::class, 'show'])->middleware('permission:orders.view');
Route::put('/payment-vouchers/{id}', [PaymentVoucherController::class, 'update'])->middleware('permission:orders.edit');
Route::post('/payment-vouchers/{id}/confirm', [PaymentVoucherController::class, 'confirm'])->middleware('permission:orders.edit');
Route::post('/payment-vouchers/{id}/cancel', [PaymentVoucherController::class, 'cancel'])->middleware('permission:orders.edit');
Route::delete('/payment-vouchers/{id}', [PaymentVoucherController::class, 'destroy'])->middleware('permission:orders.edit');

// Purchase Orders (Đơn mua hàng)
use App\Http\Controllers\Tenant\PurchaseOrderController;
Route::get('/purchase-orders', [PurchaseOrderController::class, 'index'])->middleware('permission:orders.view');
Route::get('/purchase-orders/stats', [PurchaseOrderController::class, 'stats'])->middleware('permission:orders.view');
Route::post('/purchase-orders', [PurchaseOrderController::class, 'store'])->middleware('permission:orders.edit');
Route::get('/purchase-orders/{id}', [PurchaseOrderController::class, 'show'])->middleware('permission:orders.view');
Route::put('/purchase-orders/{id}', [PurchaseOrderController::class, 'update'])->middleware('permission:orders.edit');
Route::post('/purchase-orders/{id}/send', [PurchaseOrderController::class, 'send'])->middleware('permission:orders.edit');
Route::post('/purchase-orders/{id}/receive', [PurchaseOrderController::class, 'receive'])->middleware('permission:orders.edit');
Route::post('/purchase-orders/{id}/cancel', [PurchaseOrderController::class, 'cancel'])->middleware('permission:orders.edit');
Route::delete('/purchase-orders/{id}', [PurchaseOrderController::class, 'destroy'])->middleware('permission:orders.edit');

// Inventory Reports (Báo cáo kho)
use App\Http\Controllers\Tenant\InventoryReportController;
Route::get('/inventory/stock-report', [InventoryReportController::class, 'stockReport'])->middleware('permission:products.view');
Route::get('/inventory/movement-report', [InventoryReportController::class, 'movementReport'])->middleware('permission:products.view');
Route::get('/inventory/cogs-report', [InventoryReportController::class, 'cogsReport'])->middleware('permission:orders.view');
Route::get('/inventory/low-stock-alerts', [InventoryReportController::class, 'lowStockAlerts'])->middleware('permission:products.view');
Route::get('/inventory/export-csv', [InventoryReportController::class, 'exportCsv'])->middleware('permission:products.view');
