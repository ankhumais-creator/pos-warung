// 🧾 RECEIPT ENGINE - Struk Thermal 58/80mm
import type { Transaction, TransactionItem } from './db';

interface ReceiptConfig {
    storeName: string;
    storeAddress: string;
    storePhone?: string;
    footer?: string;
}

const DEFAULT_CONFIG: ReceiptConfig = {
    storeName: 'POS Warung',
    storeAddress: 'Jl. Contoh No. 123, Kota',
    storePhone: '08123456789',
    footer: 'Terima Kasih atas Kunjungan Anda!',
};

// Z-Report data interface (consolidates parameters to avoid too many args)
export interface ZReportData {
    shiftNumber: string;
    cashierName: string;
    openedAt: number;
    closedAt: number;
    openingCash: number;
    totalTransactions: number;
    totalRevenue: number;
    actualCash: number;
    variance: number;
}

/**
 * Format tanggal Indonesia
 */
function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Truncate text untuk thermal printer (max chars)
 */
function truncate(text: string, maxLength: number): string {
    return text.length > maxLength ? text.slice(0, maxLength - 2) + '..' : text;
}

/**
 * Format currency Rupiah
 */
function formatRp(amount: number): string {
    return `Rp ${amount.toLocaleString('id-ID')}`;
}

/**
 * Generate receipt HTML untuk print
 */
export function generateReceiptHTML(
    transaction: Transaction,
    cashierName: string,
    config: ReceiptConfig = DEFAULT_CONFIG
): string {
    const items = transaction.items.map((item: TransactionItem) => {
        const modText = item.selectedModifiers.length > 0
            ? item.selectedModifiers.map(m => m.modifierName).join(', ')
            : '';

        return `
            <tr>
                <td class="item-name">
                    ${truncate(item.productName, 20)}
                    ${modText ? `<br><small>${truncate(modText, 18)}</small>` : ''}
                </td>
                <td class="item-qty">${item.quantity}x</td>
                <td class="item-price">${formatRp(item.itemTotal)}</td>
            </tr>
        `;
    }).join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Struk #${transaction.transactionNumber}</title>
            <style>
                @page {
                    size: 58mm auto;
                    margin: 0;
                }
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: 'Courier New', monospace;
                    font-size: 11px;
                    width: 58mm;
                    padding: 4mm;
                    line-height: 1.3;
                }
                .header {
                    text-align: center;
                    border-bottom: 1px dashed #000;
                    padding-bottom: 6px;
                    margin-bottom: 6px;
                }
                .store-name {
                    font-size: 14px;
                    font-weight: bold;
                }
                .store-info {
                    font-size: 9px;
                }
                .meta {
                    font-size: 10px;
                    margin-bottom: 6px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .item-name {
                    width: 50%;
                    vertical-align: top;
                }
                .item-qty {
                    width: 15%;
                    text-align: center;
                    vertical-align: top;
                }
                .item-price {
                    width: 35%;
                    text-align: right;
                    vertical-align: top;
                }
                .divider {
                    border-top: 1px dashed #000;
                    margin: 6px 0;
                }
                .totals {
                    font-size: 11px;
                }
                .totals tr td {
                    padding: 2px 0;
                }
                .totals .label {
                    text-align: left;
                }
                .totals .value {
                    text-align: right;
                    font-weight: bold;
                }
                .grand-total {
                    font-size: 14px;
                    font-weight: bold;
                }
                .footer {
                    text-align: center;
                    border-top: 1px dashed #000;
                    padding-top: 6px;
                    margin-top: 6px;
                    font-size: 9px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="store-name">${config.storeName}</div>
                <div class="store-info">${config.storeAddress}</div>
                ${config.storePhone ? `<div class="store-info">Tel: ${config.storePhone}</div>` : ''}
            </div>

            <div class="meta">
                <div>No: ${transaction.transactionNumber}</div>
                <div>Tgl: ${formatDate(transaction.createdAt)}</div>
                <div>Kasir: ${cashierName}</div>
            </div>

            <div class="divider"></div>

            <table class="items">
                ${items}
            </table>

            <div class="divider"></div>

            <table class="totals">
                <tr>
                    <td class="label">Subtotal</td>
                    <td class="value">${formatRp(transaction.subtotal)}</td>
                </tr>
                <tr>
                    <td class="label">Pajak</td>
                    <td class="value">${formatRp(transaction.tax)}</td>
                </tr>
                <tr class="grand-total">
                    <td class="label">TOTAL</td>
                    <td class="value">${formatRp(transaction.total)}</td>
                </tr>
                <tr>
                    <td class="label">Bayar</td>
                    <td class="value">${formatRp(transaction.cashReceived || 0)}</td>
                </tr>
                <tr>
                    <td class="label">Kembali</td>
                    <td class="value">${formatRp(transaction.cashChange || 0)}</td>
                </tr>
            </table>

            <div class="footer">
                ${config.footer}
            </div>
        </body>
        </html>
    `;
}

/**
 * Print receipt menggunakan window.print()
 */
export function printReceipt(
    transaction: Transaction,
    cashierName: string,
    config?: ReceiptConfig
): void {
    const html = generateReceiptHTML(transaction, cashierName, config);

    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (printWindow) {
        printWindow.document.open();`r`n        printWindow.document.write(html); // eslint-disable-line deprecation/deprecation
        printWindow.document.close();
        printWindow.focus();

        // Delay print untuk pastikan content loaded
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 300);
    }
}

/**
 * Generate Z-Report HTML untuk close shift
 */
export function generateZReportHTML(
    data: ZReportData,
    config: ReceiptConfig = DEFAULT_CONFIG
): string {
    const { shiftNumber, cashierName, openedAt, closedAt, openingCash, totalTransactions, totalRevenue, actualCash, variance } = data;
    const expectedCash = openingCash + totalRevenue;

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Z-Report ${shiftNumber}</title>
            <style>
                @page {
                    size: 58mm auto;
                    margin: 0;
                }
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: 'Courier New', monospace;
                    font-size: 11px;
                    width: 58mm;
                    padding: 4mm;
                    line-height: 1.3;
                }
                .header {
                    text-align: center;
                    border-bottom: 2px solid #000;
                    padding-bottom: 6px;
                    margin-bottom: 6px;
                }
                .title {
                    font-size: 14px;
                    font-weight: bold;
                }
                .subtitle {
                    font-size: 10px;
                }
                .section {
                    margin: 8px 0;
                }
                .section-title {
                    font-weight: bold;
                    font-size: 10px;
                    text-transform: uppercase;
                    border-bottom: 1px dashed #000;
                    padding-bottom: 2px;
                    margin-bottom: 4px;
                }
                table {
                    width: 100%;
                }
                td {
                    padding: 2px 0;
                }
                .label {
                    text-align: left;
                }
                .value {
                    text-align: right;
                    font-weight: bold;
                }
                .variance-plus {
                    color: green;
                }
                .variance-minus {
                    color: red;
                }
                .total-row {
                    font-size: 13px;
                    font-weight: bold;
                    border-top: 1px solid #000;
                    padding-top: 4px;
                }
                .footer {
                    text-align: center;
                    border-top: 2px solid #000;
                    padding-top: 6px;
                    margin-top: 10px;
                    font-size: 9px;
                }
                .signature {
                    margin-top: 20px;
                    border-top: 1px solid #000;
                    padding-top: 4px;
                    text-align: center;
                    font-size: 9px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">Z-REPORT</div>
                <div class="subtitle">Laporan Tutup Shift</div>
                <div class="subtitle">${config.storeName}</div>
            </div>

            <div class="section">
                <div class="section-title">Info Shift</div>
                <table>
                    <tr><td class="label">Shift</td><td class="value">${shiftNumber}</td></tr>
                    <tr><td class="label">Kasir</td><td class="value">${cashierName}</td></tr>
                    <tr><td class="label">Buka</td><td class="value">${formatDate(openedAt)}</td></tr>
                    <tr><td class="label">Tutup</td><td class="value">${formatDate(closedAt)}</td></tr>
                </table>
            </div>

            <div class="section">
                <div class="section-title">Ringkasan Penjualan</div>
                <table>
                    <tr><td class="label">Jml Transaksi</td><td class="value">${totalTransactions}</td></tr>
                    <tr><td class="label">Total Pendapatan</td><td class="value">${formatRp(totalRevenue)}</td></tr>
                </table>
            </div>

            <div class="section">
                <div class="section-title">Rekonsiliasi Kas</div>
                <table>
                    <tr><td class="label">Modal Awal</td><td class="value">${formatRp(openingCash)}</td></tr>
                    <tr><td class="label">+ Penjualan</td><td class="value">${formatRp(totalRevenue)}</td></tr>
                    <tr class="total-row"><td class="label">Seharusnya</td><td class="value">${formatRp(expectedCash)}</td></tr>
                    <tr><td class="label">Aktual</td><td class="value">${formatRp(actualCash)}</td></tr>
                    <tr>
                        <td class="label">Selisih</td>
                        <td class="value ${variance >= 0 ? 'variance-plus' : 'variance-minus'}">
                            ${variance >= 0 ? '+' : ''}${formatRp(variance)}
                        </td>
                    </tr>
                </table>
            </div>

            <div class="signature">
                <div>Tanda Tangan Kasir</div>
                <br><br><br>
                <div>( ${cashierName} )</div>
            </div>

            <div class="footer">
                Dicetak: ${formatDate(Date.now())}
            </div>
        </body>
        </html>
    `;
}

/**
 * Print Z-Report
 */
export function printZReport(
    data: ZReportData,
    config?: ReceiptConfig
): void {
    const html = generateZReportHTML(data, config);

    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (printWindow) {
        printWindow.document.open();`r`n        printWindow.document.write(html); // eslint-disable-line deprecation/deprecation
        printWindow.document.close();
        printWindow.focus();

        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 300);
    }
}
