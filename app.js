/**
 * FINANCE TRACKER - CORE LOGIC & PERSISTENCE
 * Sederhana, Cepat, Minimal, Tanpa Backend
 */

import Chart from 'chart.js/auto';

// ==========================================
// 1. KONSTANTA & STATE APLIKASI
// ==========================================

const STORAGE_KEY_TX = 'financeTransactions';
const STORAGE_KEY_CAT = 'financeCategories';
const STORAGE_KEY_THEME = 'finance_theme';
const STORAGE_KEY_TARGETS = 'financeTargets';

// Kategori Bawaan (Default Categories)
const DEFAULT_CATEGORIES = {
  income: ['Gaji', 'Driver', 'Freelance', 'Bonus', 'Penjualan', 'Lainnya'],
  expense: ['Makanan', 'Bensin', 'Transportasi', 'Tagihan', 'Belanja', 'Hiburan', 'Kesehatan', 'Tabungan', 'Lainnya']
};

// Data Sampel Awal untuk Pengguna Baru
const SAMPLE_TRANSACTIONS = [
  {
    id: 1727500000001,
    date: '2026-09-28',
    type: 'income',
    category: 'Driver',
    amount: 150000,
    paymentMethod: 'Tunai',
    note: 'Order pagi & siang'
  },
  {
    id: 1727500000002,
    date: '2026-09-28',
    type: 'expense',
    category: 'Bensin',
    amount: 50000,
    paymentMethod: 'QRIS',
    note: 'Pertalite full tank'
  },
  {
    id: 1727500000003,
    date: '2026-09-28',
    type: 'expense',
    category: 'Makanan',
    amount: 25000,
    paymentMethod: 'Tunai',
    note: 'Makan siang warteg'
  },
  {
    id: 1727500000004,
    date: '2026-09-27',
    type: 'income',
    category: 'Freelance',
    amount: 500000,
    paymentMethod: 'Transfer Bank',
    note: 'Desain banner'
  },
  {
    id: 1727500000005,
    date: '2026-09-27',
    type: 'expense',
    category: 'Tagihan',
    amount: 150000,
    paymentMethod: 'E-Wallet',
    note: 'Pulsa & paket data'
  }
];

// Data Sampel Target Pembelian untuk Pengguna Baru
const SAMPLE_TARGETS = [
  {
    id: 1727500010001,
    name: 'Smartphone Baru',
    targetAmount: 3500000,
    savedAmount: 1800000,
    category: 'Elektronik',
    targetDate: '2026-12-31',
    note: 'Untuk menunjang kerja & komunikasi lancar',
    createdAt: '2026-09-01'
  },
  {
    id: 1727500010002,
    name: 'Dana Darurat 3 Bulan',
    targetAmount: 6000000,
    savedAmount: 3600000,
    category: 'Dana Darurat',
    targetDate: '2027-03-31',
    note: 'Tabungan jaga-jaga kebutuhan mendesak',
    createdAt: '2026-08-15'
  }
];

// Definisi Metode Pembayaran / Transaksi
const PAYMENT_METHOD_ICONS = {
  Tunai: '💵',
  QRIS: '📱',
  'Transfer Bank': '🏦',
  'E-Wallet': '👛',
  Kartu: '💳',
  Lainnya: '🔄'
};

function getPaymentMethodIcon(method) {
  return PAYMENT_METHOD_ICONS[method] || '💵';
}

function getPaymentMethodBadgeClass(method) {
  switch (method) {
    case 'QRIS': return 'badge-method-qris';
    case 'Transfer Bank': return 'badge-method-bank';
    case 'E-Wallet': return 'badge-method-ewallet';
    case 'Kartu': return 'badge-method-kartu';
    case 'Lainnya': return 'badge-method-lainnya';
    case 'Tunai':
    default:
      return 'badge-method-tunai';
  }
}

// State Global
let currentNav = 'dashboard';
let txFilterType = 'all'; // 'all' | 'income' | 'expense'
let txFilterMethod = 'all'; // 'all' | 'Tunai' | 'QRIS' | 'Transfer Bank' | 'E-Wallet' | 'Kartu' | 'Lainnya'
let txSearchQuery = '';
let txFilterDateFrom = '';
let txFilterDateTo = '';
let reportPeriod = 'month'; // 'today' | 'week' | 'month' | 'all'
let targetFilterStatus = 'all'; // 'all' | 'active' | 'completed'
let pendingConfirmCallback = null;
let toastTimeout = null;

// Chart.js State
let chartCashflowInstance = null;
let chartExpenseCatInstance = null;
let chartCashflowRatioInstance = null;
let chartTargetsInstance = null;
let chartTrendType = 'bar'; // 'bar' | 'line'

// ==========================================
// 2. STORAGE HELPERS
// ==========================================

function getStoredTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TX);
    if (raw === null) {
      if (!localStorage.getItem('finance_app_visited')) {
        localStorage.setItem('finance_app_visited', 'true');
        saveTransactions(SAMPLE_TRANSACTIONS);
        return [...SAMPLE_TRANSACTIONS];
      }
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error saat membaca transaksi dari storage:', error);
    return [];
  }
}

function saveTransactions(transactions) {
  try {
    localStorage.setItem(STORAGE_KEY_TX, JSON.stringify(transactions));
  } catch (error) {
    console.error('Error saat menyimpan transaksi:', error);
    showToast('Gagal menyimpan transaksi ke storage browser.');
  }
}

function getStoredCategories() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CAT);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CAT, JSON.stringify(DEFAULT_CATEGORIES));
      return JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
    }
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.income) && Array.isArray(parsed.expense)) {
      return parsed;
    }
    return JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
  } catch (e) {
    console.error('Error membaca kategori:', e);
    return JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
  }
}

function saveCategories(categories) {
  try {
    localStorage.setItem(STORAGE_KEY_CAT, JSON.stringify(categories));
  } catch (e) {
    console.error('Error menyimpan kategori:', e);
  }
}

function getStoredTargets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TARGETS);
    if (raw === null) {
      if (!localStorage.getItem('finance_targets_visited')) {
        localStorage.setItem('finance_targets_visited', 'true');
        saveTargets(SAMPLE_TARGETS);
        return [...SAMPLE_TARGETS];
      }
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error saat membaca target dari storage:', error);
    return [];
  }
}

function saveTargets(targets) {
  try {
    localStorage.setItem(STORAGE_KEY_TARGETS, JSON.stringify(targets));
  } catch (error) {
    console.error('Error saat menyimpan target:', error);
    showToast('Gagal menyimpan target ke storage browser.');
  }
}

// ==========================================
// 3. UTILITY FUNCTIONS
// ==========================================

function formatRupiah(number) {
  const num = Math.round(Number(number) || 0);
  return 'Rp' + num.toLocaleString('id-ID');
}

function formatRupiahShort(num) {
  const n = Math.abs(num);
  if (n >= 1000000000) return (num / 1000000000).toFixed(1) + 'M';
  if (n >= 1000000) return (num / 1000000).toFixed(1) + 'jt';
  if (n >= 1000) return (num / 1000).toFixed(0) + 'rb';
  return String(num);
}

function getChartThemeColors() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    isDark,
    text: isDark ? '#94a3b8' : '#64748b',
    textMain: isDark ? '#f8fafc' : '#0f172a',
    grid: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    cardBg: isDark ? '#1e293b' : '#ffffff'
  };
}

function formatDateDisplay(dateString) {
  if (!dateString) return '';
  try {
    const todayStr = getTodayString();
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const formatted = `${day} ${months[monthIndex] || ''} ${year}`;

      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      if (dateString === todayStr) {
        return `Hari Ini, ${formatted}`;
      } else if (dateString === yStr) {
        return `Kemarin, ${formatted}`;
      }
      return formatted;
    }
    return dateString;
  } catch (e) {
    return dateString;
  }
}

function formatDateShort(dateString) {
  if (!dateString) return '';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return `${day} ${months[monthIndex] || ''}`;
    }
    return dateString;
  } catch (e) {
    return dateString;
  }
}

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function escapeHTML(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showToast(message) {
  const toastEl = document.getElementById('notification-toast');
  const messageEl = document.getElementById('notification-message');
  if (!toastEl || !messageEl) return;

  if (toastTimeout) clearTimeout(toastTimeout);
  messageEl.textContent = message;
  toastEl.hidden = false;

  toastTimeout = setTimeout(() => {
    toastEl.hidden = true;
  }, 2800);
}

// ==========================================
// 4. NAVIGATION CONTROLLER
// ==========================================

function switchView(viewName) {
  currentNav = viewName;
  const views = ['dashboard', 'add', 'transactions', 'targets', 'report', 'settings'];

  views.forEach((v) => {
    const el = document.getElementById(`view-${v}`);
    if (el) {
      el.hidden = v !== viewName;
    }
  });

  // Update Bottom Nav active state
  document.querySelectorAll('.bottom-nav .nav-item').forEach((item) => {
    if (item.dataset.nav === viewName) {
      item.classList.add('is-active');
    } else {
      item.classList.remove('is-active');
    }
  });

  // Refresh current view data
  if (viewName === 'dashboard') {
    renderDashboard();
  } else if (viewName === 'add') {
    const addDateInput = document.getElementById('date');
    if (addDateInput && !addDateInput.value) {
      addDateInput.value = getTodayString();
    }
    const amountInput = document.getElementById('amount');
    if (amountInput) amountInput.focus();
  } else if (viewName === 'transactions') {
    renderTransactionsList();
  } else if (viewName === 'targets') {
    renderTargetsView();
  } else if (viewName === 'report') {
    requestAnimationFrame(() => {
      renderReport();
      if (chartCashflowInstance) chartCashflowInstance.resize();
      if (chartCashflowRatioInstance) chartCashflowRatioInstance.resize();
      if (chartExpenseCatInstance) chartExpenseCatInstance.resize();
      if (chartTargetsInstance) chartTargetsInstance.resize();
    });
  } else if (viewName === 'settings') {
    renderSettingsCategoryTags();
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'instant' });
}

// ==========================================
// 5. VIEW 1: DASHBOARD LOGIC
// ==========================================

function renderDashboard() {
  const transactions = getStoredTransactions();

  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'income') {
      totalIncome += amt;
    } else if (tx.type === 'expense') {
      totalExpense += amt;
    }
  });

  const totalBalance = totalIncome - totalExpense;

  const totalBalanceEl = document.getElementById('dash-total-balance');
  const totalIncomeEl = document.getElementById('dash-total-income');
  const totalExpenseEl = document.getElementById('dash-total-expense');

  if (totalBalanceEl) totalBalanceEl.textContent = formatRupiah(totalBalance);
  if (totalIncomeEl) totalIncomeEl.textContent = formatRupiah(totalIncome);
  if (totalExpenseEl) totalExpenseEl.textContent = formatRupiah(totalExpense);

  // Render 4-5 transaksi terbaru
  const recentListEl = document.getElementById('dash-recent-list');
  const emptyStateEl = document.getElementById('dash-empty-state');
  if (!recentListEl) return;

  recentListEl.innerHTML = '';

  const sorted = [...transactions].sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return Number(b.id) - Number(a.id);
  });

  const recentItems = sorted.slice(0, 5);

  if (recentItems.length === 0) {
    if (emptyStateEl) emptyStateEl.hidden = false;
    return;
  }

  if (emptyStateEl) emptyStateEl.hidden = true;

  recentItems.forEach((tx) => {
    const item = document.createElement('div');
    const isIncome = tx.type === 'income';
    const method = tx.paymentMethod || 'Tunai';
    const methodIcon = getPaymentMethodIcon(method);
    const badgeClass = getPaymentMethodBadgeClass(method);
    item.className = `tx-item ${isIncome ? 'tx-income' : 'tx-expense'}`;

    item.innerHTML = `
      <div class="tx-main-info">
        <div class="tx-title-row">
          <span class="tx-category">${escapeHTML(tx.category)}</span>
          <span class="tx-method-badge ${badgeClass}">${methodIcon} ${escapeHTML(method)}</span>
        </div>
        <span class="tx-note">${escapeHTML(tx.note || formatDateShort(tx.date))}</span>
      </div>
      <div class="tx-right-info">
        <span class="tx-amount ${isIncome ? 'income-color' : 'expense-color'}">
          ${isIncome ? '+' : '-'}${formatRupiah(tx.amount)}
        </span>
      </div>
    `;

    recentListEl.appendChild(item);
  });

  // Render Target Widget on Dashboard
  renderDashboardTargetWidget();
}

// ==========================================
// 6. VIEW 2: TAMBAH TRANSAKSI
// ==========================================

function populateCategorySelect(selectId, type, selectedCategory = '') {
  const selectEl = document.getElementById(selectId);
  if (!selectEl) return;

  const categories = getStoredCategories();
  const list = categories[type] || [];

  selectEl.innerHTML = '';
  list.forEach((cat) => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    if (cat === selectedCategory) {
      opt.selected = true;
    }
    selectEl.appendChild(opt);
  });
}

function handleAddTransactionSubmit(e) {
  e.preventDefault();

  const form = document.getElementById('transaction-form');
  const typeRadio = form.querySelector('input[name="type"]:checked');
  const type = typeRadio ? typeRadio.value : 'income';

  const amountInput = document.getElementById('amount');
  const categorySelect = document.getElementById('category');
  const dateInput = document.getElementById('date');
  const noteInput = document.getElementById('note');

  const amountVal = parseFloat(amountInput.value);
  const categoryVal = categorySelect.value;
  const dateVal = dateInput.value;
  const noteVal = noteInput.value.trim();

  // Validasi
  if (!amountVal || isNaN(amountVal) || amountVal <= 0) {
    showToast('Masukkan nominal transaksi yang valid.');
    amountInput.focus();
    return;
  }

  if (!categoryVal) {
    showToast('Silakan pilih kategori transaksi.');
    categorySelect.focus();
    return;
  }

  if (!dateVal) {
    showToast('Silakan pilih tanggal transaksi.');
    dateInput.focus();
    return;
  }

  const methodRadio = form.querySelector('input[name="payment-method"]:checked');
  const paymentMethod = methodRadio ? methodRadio.value : 'Tunai';

  const newTx = {
    id: Date.now(),
    date: dateVal,
    type: type,
    category: categoryVal,
    amount: Math.round(amountVal),
    paymentMethod: paymentMethod,
    note: noteVal
  };

  const list = getStoredTransactions();
  list.push(newTx);
  saveTransactions(list);

  showToast('Transaksi berhasil dicatat!');

  // Reset form tapi tetap simpan tanggal hari ini
  form.reset();
  dateInput.value = getTodayString();
  const labelIncome = document.getElementById('label-type-income');
  const labelExpense = document.getElementById('label-type-expense');
  if (labelIncome && labelExpense) {
    labelIncome.classList.add('is-active');
    labelExpense.classList.remove('is-active');
  }
  populateCategorySelect('category', 'income');

  // Reset payment method pills to Tunai
  const addPills = document.querySelectorAll('#add-payment-method-grid .payment-pill');
  addPills.forEach((p) => {
    if (p.dataset.method === 'Tunai') {
      p.classList.add('is-active');
      const inp = p.querySelector('input');
      if (inp) inp.checked = true;
    } else {
      p.classList.remove('is-active');
    }
  });

  // Berikan opsi navigasi ke dashboard
  switchView('dashboard');
}

// ==========================================
// 7. VIEW 3: RIWAYAT TRANSAKSI (GROUPED & FILTER)
// ==========================================

function renderTransactionsList() {
  const container = document.getElementById('tx-grouped-list');
  const countBadge = document.getElementById('tx-filter-count');
  const emptyState = document.getElementById('tx-empty-state');
  if (!container) return;

  const allTx = getStoredTransactions();

  // Filter jenis, pencarian, dan rentang tanggal
  const filtered = allTx.filter((tx) => {
    // 1. Jenis
    if (txFilterType !== 'all' && tx.type !== txFilterType) return false;

    // 1b. Metode Pembayaran
    if (txFilterMethod !== 'all' && (tx.paymentMethod || 'Tunai') !== txFilterMethod) return false;

    // 2. Pencarian (kategori atau catatan)
    if (txSearchQuery) {
      const cat = (tx.category || '').toLowerCase();
      const note = (tx.note || '').toLowerCase();
      const method = (tx.paymentMethod || '').toLowerCase();
      if (!cat.includes(txSearchQuery) && !note.includes(txSearchQuery) && !method.includes(txSearchQuery)) return false;
    }

    // 3. Rentang Tanggal
    if (txFilterDateFrom && tx.date < txFilterDateFrom) return false;
    if (txFilterDateTo && tx.date > txFilterDateTo) return false;

    return true;
  });

  if (countBadge) {
    countBadge.textContent = `${filtered.length} Transaksi`;
  }

  container.innerHTML = '';

  if (filtered.length === 0) {
    if (emptyState) emptyState.hidden = false;
    return;
  }

  if (emptyState) emptyState.hidden = true;

  // Urutkan transaksi terbaru di atas
  filtered.sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return Number(b.id) - Number(a.id);
  });

  // Kelompokkan per tanggal
  const groupsByDate = {};
  filtered.forEach((tx) => {
    if (!groupsByDate[tx.date]) {
      groupsByDate[tx.date] = [];
    }
    groupsByDate[tx.date].push(tx);
  });

  // Render per grup tanggal (urut tanggal terbaru di atas)
  const sortedDateKeys = Object.keys(groupsByDate).sort((a, b) => b.localeCompare(a));
  sortedDateKeys.forEach((dateKey) => {
    const txItems = groupsByDate[dateKey];
    const groupEl = document.createElement('div');
    groupEl.className = 'tx-date-group';

    // Hitung subtotal untuk tanggal ini
    let dateNet = 0;
    txItems.forEach((t) => {
      dateNet += t.type === 'income' ? t.amount : -t.amount;
    });

    const headerEl = document.createElement('div');
    headerEl.className = 'tx-date-header';
    headerEl.innerHTML = `
      <div class="tx-date-title">
        <span>📅 ${formatDateDisplay(dateKey)}</span>
      </div>
      <span class="tx-date-subtotal ${dateNet >= 0 ? 'income-color' : 'expense-color'}">
        ${dateNet >= 0 ? '+' : ''}${formatRupiah(dateNet)}
      </span>
    `;
    groupEl.appendChild(headerEl);

    // List item transaksi dalam tanggal ini
    txItems.forEach((tx) => {
      const item = document.createElement('div');
      const isIncome = tx.type === 'income';
      const method = tx.paymentMethod || 'Tunai';
      const methodIcon = getPaymentMethodIcon(method);
      const badgeClass = getPaymentMethodBadgeClass(method);
      item.className = `tx-item ${isIncome ? 'tx-income' : 'tx-expense'}`;

      item.innerHTML = `
        <div class="tx-main-info">
          <div class="tx-title-row">
            <span class="tx-category">${escapeHTML(tx.category)}</span>
            <span class="tx-method-badge ${badgeClass}">${methodIcon} ${escapeHTML(method)}</span>
          </div>
          <span class="tx-note">${escapeHTML(tx.note || '(Tanpa catatan)')}</span>
        </div>
        <div class="tx-right-info">
          <span class="tx-amount ${isIncome ? 'income-color' : 'expense-color'}">
            ${isIncome ? '+' : '-'}${formatRupiah(tx.amount)}
          </span>
          <div class="tx-actions">
            <button type="button" class="btn-tx-action btn-tx-edit" title="Edit" aria-label="Edit transaksi">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </button>
            <button type="button" class="btn-tx-action btn-tx-delete" title="Hapus" aria-label="Hapus transaksi">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      `;

      // Event Edit
      const btnEdit = item.querySelector('.btn-tx-edit');
      btnEdit.addEventListener('click', () => openEditModal(tx));

      // Event Hapus
      const btnDelete = item.querySelector('.btn-tx-delete');
      btnDelete.addEventListener('click', () => {
        openConfirmModal({
          title: 'Hapus Transaksi',
          description: `Apakah Anda yakin ingin menghapus "${tx.category}" sebesar ${formatRupiah(tx.amount)}?`,
          confirmText: 'Hapus',
          onConfirm: () => {
            deleteTransaction(tx.id);
          }
        });
      });

      groupEl.appendChild(item);
    });

    container.appendChild(groupEl);
  });
}

function deleteTransaction(id) {
  const current = getStoredTransactions();
  const updated = current.filter((t) => t.id !== id);
  saveTransactions(updated);
  showToast('Transaksi berhasil dihapus.');
  renderDashboard();
  renderTransactionsList();
}

// ==========================================
// 8. MODAL EDIT TRANSAKSI
// ==========================================

function openEditModal(tx) {
  const modal = document.getElementById('edit-tx-modal');
  if (!modal) return;

  const idInput = document.getElementById('edit-tx-id');
  const amountInput = document.getElementById('edit-amount');
  const dateInput = document.getElementById('edit-date');
  const noteInput = document.getElementById('edit-note');

  idInput.value = tx.id;
  amountInput.value = tx.amount;
  dateInput.value = tx.date;
  noteInput.value = tx.note || '';

  // Type radio
  const isIncome = tx.type === 'income';
  const radioIncome = modal.querySelector('input[value="income"]');
  const radioExpense = modal.querySelector('input[value="expense"]');
  const labelIncome = document.getElementById('edit-label-type-income');
  const labelExpense = document.getElementById('edit-label-type-expense');

  if (isIncome) {
    radioIncome.checked = true;
    labelIncome.classList.add('is-active');
    labelExpense.classList.remove('is-active');
  } else {
    radioExpense.checked = true;
    labelExpense.classList.add('is-active');
    labelIncome.classList.remove('is-active');
  }

  populateCategorySelect('edit-category', tx.type, tx.category);

  // Payment method selection
  const curMethod = tx.paymentMethod || 'Tunai';
  const methodRadio = modal.querySelector(`input[name="edit-payment-method"][value="${curMethod}"]`);
  if (methodRadio) {
    methodRadio.checked = true;
  }
  modal.querySelectorAll('#edit-payment-method-grid .payment-pill').forEach((pill) => {
    if (pill.dataset.method === curMethod) {
      pill.classList.add('is-active');
    } else {
      pill.classList.remove('is-active');
    }
  });

  modal.hidden = false;
  modal.classList.add('is-open');
}

function closeEditModal() {
  const modal = document.getElementById('edit-tx-modal');
  if (modal) {
    modal.hidden = true;
    modal.classList.remove('is-open');
  }
}

function handleEditFormSubmit(e) {
  e.preventDefault();

  const id = Number(document.getElementById('edit-tx-id').value);
  const amount = Math.round(parseFloat(document.getElementById('edit-amount').value));
  const category = document.getElementById('edit-category').value;
  const date = document.getElementById('edit-date').value;
  const note = document.getElementById('edit-note').value.trim();
  const typeRadio = document.querySelector('input[name="edit-type"]:checked');
  const type = typeRadio ? typeRadio.value : 'income';
  const methodRadio = document.querySelector('input[name="edit-payment-method"]:checked');
  const paymentMethod = methodRadio ? methodRadio.value : 'Tunai';

  if (!amount || amount <= 0) {
    showToast('Nominal harus lebih dari Rp0.');
    return;
  }

  const list = getStoredTransactions();
  const index = list.findIndex((t) => t.id === id);
  if (index !== -1) {
    list[index] = {
      ...list[index],
      amount,
      category,
      date,
      paymentMethod,
      note,
      type
    };
    saveTransactions(list);
    showToast('Transaksi berhasil diperbarui.');
    closeEditModal();
    renderTransactionsList();
    renderDashboard();
  }
}

// ==========================================
// 9. VIEW 4: LAPORAN (PERIOD, CHARTS & BREAKDOWN)
// ==========================================

function renderReport() {
  const allTx = getStoredTransactions();
  const todayStr = getTodayString();
  const todayDate = new Date();

  // Tentukan batas waktu berdasarkan reportPeriod
  const filtered = allTx.filter((tx) => {
    if (reportPeriod === 'all') return true;

    if (reportPeriod === 'today') {
      return tx.date === todayStr;
    }

    if (reportPeriod === 'month') {
      // Sama bulan dan tahun
      const txParts = tx.date.split('-');
      const nowYear = String(todayDate.getFullYear());
      const nowMonth = String(todayDate.getMonth() + 1).padStart(2, '0');
      return txParts[0] === nowYear && txParts[1] === nowMonth;
    }

    if (reportPeriod === 'week') {
      // 7 hari terakhir
      const txD = new Date(tx.date + 'T00:00:00');
      const diffTime = todayDate.getTime() - txD.getTime();
      const diffDays = diffTime / (1000 * 3600 * 24);
      return diffDays >= 0 && diffDays <= 7;
    }

    return true;
  });

  let totalIncome = 0;
  let totalExpense = 0;
  const expenseByCat = {};
  const incomeByCat = {};
  const methodStats = {
    Tunai: { income: 0, expense: 0, total: 0, count: 0 },
    QRIS: { income: 0, expense: 0, total: 0, count: 0 },
    'Transfer Bank': { income: 0, expense: 0, total: 0, count: 0 },
    'E-Wallet': { income: 0, expense: 0, total: 0, count: 0 },
    Kartu: { income: 0, expense: 0, total: 0, count: 0 },
    Lainnya: { income: 0, expense: 0, total: 0, count: 0 }
  };

  filtered.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    const method = tx.paymentMethod || 'Tunai';
    if (!methodStats[method]) {
      methodStats[method] = { income: 0, expense: 0, total: 0, count: 0 };
    }

    if (tx.type === 'income') {
      totalIncome += amt;
      incomeByCat[tx.category] = (incomeByCat[tx.category] || 0) + amt;
      methodStats[method].income += amt;
    } else {
      totalExpense += amt;
      expenseByCat[tx.category] = (expenseByCat[tx.category] || 0) + amt;
      methodStats[method].expense += amt;
    }
    methodStats[method].total += amt;
    methodStats[method].count += 1;
  });

  const net = totalIncome - totalExpense;

  const repIncomeEl = document.getElementById('rep-income');
  const repExpenseEl = document.getElementById('rep-expense');
  const repNetEl = document.getElementById('rep-net');

  if (repIncomeEl) repIncomeEl.textContent = formatRupiah(totalIncome);
  if (repExpenseEl) repExpenseEl.textContent = formatRupiah(totalExpense);
  if (repNetEl) {
    repNetEl.textContent = (net >= 0 ? '+' : '') + formatRupiah(net);
    repNetEl.className = `summary-value font-bold ${net >= 0 ? 'income-color' : 'expense-color'}`;
  }

  // Hitung Rasio Tabungan (Savings Rate)
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100)) : 0;
  const metricSavingsEl = document.getElementById('rep-metric-savings-rate');
  if (metricSavingsEl) metricSavingsEl.textContent = `${savingsRate}%`;

  // Hitung Rata-rata Harian
  let daysCount = 1;
  if (reportPeriod === 'today') {
    daysCount = 1;
  } else if (reportPeriod === 'week') {
    daysCount = 7;
  } else if (reportPeriod === 'month') {
    daysCount = Math.max(1, todayDate.getDate());
  } else {
    const uniqueDates = new Set(filtered.map((t) => t.date));
    daysCount = Math.max(1, uniqueDates.size);
  }

  const dailyAvg = Math.round(totalExpense / daysCount);
  const metricDailyEl = document.getElementById('rep-metric-daily-avg');
  if (metricDailyEl) metricDailyEl.textContent = formatRupiah(dailyAvg);

  // Status Arus Kas
  const cashflowStatusEl = document.getElementById('rep-cashflow-status');
  if (cashflowStatusEl) {
    if (totalIncome === 0 && totalExpense === 0) {
      cashflowStatusEl.textContent = 'Netral';
      cashflowStatusEl.className = 'cashflow-status-badge status-warning';
    } else if (totalExpense > totalIncome) {
      cashflowStatusEl.textContent = 'Defisit';
      cashflowStatusEl.className = 'cashflow-status-badge status-danger';
    } else if (savingsRate < 20) {
      cashflowStatusEl.textContent = 'Waspada';
      cashflowStatusEl.className = 'cashflow-status-badge status-warning';
    } else {
      cashflowStatusEl.textContent = 'Sehat';
      cashflowStatusEl.className = 'cashflow-status-badge status-healthy';
    }
  }

  // Render Charts
  renderDonutChart(totalIncome, totalExpense, savingsRate);
  renderTrendBarChart(filtered, reportPeriod);
  renderExpenseCategoriesChart(expenseByCat, totalExpense);
  renderDistributionBar(expenseByCat, totalExpense);
  renderTargetsReportChart();

  // Render breakdowns
  renderCategoryBreakdownList('rep-expense-breakdown', expenseByCat, totalExpense, 'expense');
  renderCategoryBreakdownList('rep-income-breakdown', incomeByCat, totalIncome, 'income');
  renderMethodBreakdownList('rep-method-breakdown', methodStats, totalIncome + totalExpense);
}

function renderDonutChart(income, expense, savingsRate) {
  const canvas = document.getElementById('chart-cashflow-ratio-canvas');
  const centerPct = document.getElementById('donut-savings-pct');
  const legendIncome = document.getElementById('donut-income-txt');
  const legendExpense = document.getElementById('donut-expense-txt');

  if (centerPct) centerPct.textContent = `${savingsRate}%`;

  const total = income + expense;
  const incomePct = total > 0 ? Math.round((income / total) * 100) : 0;
  const expensePct = total > 0 ? 100 - incomePct : 0;

  if (legendIncome) legendIncome.textContent = `${formatRupiah(income)} (${incomePct}%)`;
  if (legendExpense) legendExpense.textContent = `${formatRupiah(expense)} (${expensePct}%)`;

  if (!canvas) return;

  if (chartCashflowRatioInstance) {
    chartCashflowRatioInstance.destroy();
    chartCashflowRatioInstance = null;
  }

  const themeColors = getChartThemeColors();
  const dataVals = total === 0 ? [1] : [income, expense];
  const bgColors = total === 0 ? [themeColors.grid] : ['#10b981', '#f43f5e'];

  chartCashflowRatioInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: total === 0 ? ['Belum ada data'] : ['Pemasukan', 'Pengeluaran'],
      datasets: [
        {
          data: dataVals,
          backgroundColor: bgColors,
          borderWidth: 0,
          hoverOffset: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: total > 0,
          backgroundColor: themeColors.cardBg,
          titleColor: themeColors.textMain,
          bodyColor: themeColors.text,
          borderColor: themeColors.isDark ? '#334155' : '#e2e8f0',
          borderWidth: 1,
          padding: 8,
          callbacks: {
            label: (item) => {
              const val = item.raw || 0;
              const pct = Math.round((val / total) * 100);
              return ` ${item.label}: ${formatRupiah(val)} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

function renderTrendBarChart(filteredTransactions, period) {
  const canvas = document.getElementById('chart-cashflow-canvas');
  const subtitleEl = document.getElementById('chart-trend-subtitle');
  if (!canvas) return;

  if (chartCashflowInstance) {
    chartCashflowInstance.destroy();
    chartCashflowInstance = null;
  }

  // Build time buckets
  const buckets = [];
  const today = new Date();

  if (period === 'today') {
    if (subtitleEl) subtitleEl.textContent = 'Aktivitas per segmen hari ini';
    buckets.push({ id: 'pagi', label: 'Pagi', timeRange: '06:00 - 12:00', income: 0, expense: 0 });
    buckets.push({ id: 'siang', label: 'Siang', timeRange: '12:00 - 15:00', income: 0, expense: 0 });
    buckets.push({ id: 'sore', label: 'Sore', timeRange: '15:00 - 18:00', income: 0, expense: 0 });
    buckets.push({ id: 'malam', label: 'Malam', timeRange: '18:00 - 24:00', income: 0, expense: 0 });

    filteredTransactions.forEach((tx, idx) => {
      const bIndex = idx % 4;
      if (tx.type === 'income') buckets[bIndex].income += tx.amount;
      else buckets[bIndex].expense += tx.amount;
    });
  } else if (period === 'week') {
    if (subtitleEl) subtitleEl.textContent = '7 Hari terakhir';
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;
      const label = `${dayNames[d.getDay()]} ${day}`;
      buckets.push({ id: dateStr, label, timeRange: formatDateDisplay(dateStr), income: 0, expense: 0 });
    }

    filteredTransactions.forEach((tx) => {
      const bucket = buckets.find((b) => b.id === tx.date);
      if (bucket) {
        if (tx.type === 'income') bucket.income += tx.amount;
        else bucket.expense += tx.amount;
      }
    });
  } else if (period === 'month') {
    if (subtitleEl) subtitleEl.textContent = 'Pekan 1 sampai 4 bulan ini';
    buckets.push({ id: 'w1', label: 'Mgg 1', timeRange: 'Tgl 1 - 7', income: 0, expense: 0 });
    buckets.push({ id: 'w2', label: 'Mgg 2', timeRange: 'Tgl 8 - 14', income: 0, expense: 0 });
    buckets.push({ id: 'w3', label: 'Mgg 3', timeRange: 'Tgl 15 - 21', income: 0, expense: 0 });
    buckets.push({ id: 'w4', label: 'Mgg 4', timeRange: 'Tgl 22 - akhir', income: 0, expense: 0 });

    filteredTransactions.forEach((tx) => {
      const dayNum = parseInt(tx.date.split('-')[2], 10) || 1;
      let bIdx = 0;
      if (dayNum > 21) bIdx = 3;
      else if (dayNum > 14) bIdx = 2;
      else if (dayNum > 7) bIdx = 1;

      if (tx.type === 'income') buckets[bIdx].income += tx.amount;
      else buckets[bIdx].expense += tx.amount;
    });
  } else {
    // 'all'
    if (subtitleEl) subtitleEl.textContent = 'Tren arus kas per bulan';
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const curYear = today.getFullYear();
    const curMonth = today.getMonth();

    for (let i = 4; i >= 0; i--) {
      const d = new Date(curYear, curMonth - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const ymKey = `${y}-${m}`;
      buckets.push({ id: ymKey, label: `${monthNames[d.getMonth()]} '${String(y).slice(-2)}`, timeRange: `${monthNames[d.getMonth()]} ${y}`, income: 0, expense: 0 });
    }

    filteredTransactions.forEach((tx) => {
      const ymKey = tx.date.slice(0, 7);
      const bucket = buckets.find((b) => b.id === ymKey);
      if (bucket) {
        if (tx.type === 'income') bucket.income += tx.amount;
        else bucket.expense += tx.amount;
      }
    });
  }

  const themeColors = getChartThemeColors();
  const labels = buckets.map((b) => b.label);
  const incomeData = buckets.map((b) => b.income);
  const expenseData = buckets.map((b) => b.expense);

  const isLine = chartTrendType === 'line';

  chartCashflowInstance = new Chart(canvas, {
    type: isLine ? 'line' : 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Pemasukan',
          data: incomeData,
          backgroundColor: isLine ? 'rgba(16, 185, 129, 0.15)' : '#10b981',
          borderColor: '#10b981',
          borderWidth: isLine ? 2.5 : 0,
          borderRadius: isLine ? 0 : 5,
          tension: 0.3,
          fill: isLine,
          pointBackgroundColor: '#10b981',
          pointRadius: isLine ? 4 : 0,
          pointHoverRadius: 6,
          maxBarThickness: 28
        },
        {
          label: 'Pengeluaran',
          data: expenseData,
          backgroundColor: isLine ? 'rgba(244, 63, 94, 0.15)' : '#f43f5e',
          borderColor: '#f43f5e',
          borderWidth: isLine ? 2.5 : 0,
          borderRadius: isLine ? 0 : 5,
          tension: 0.3,
          fill: isLine,
          pointBackgroundColor: '#f43f5e',
          pointRadius: isLine ? 4 : 0,
          pointHoverRadius: 6,
          maxBarThickness: 28
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: themeColors.cardBg,
          titleColor: themeColors.textMain,
          bodyColor: themeColors.text,
          borderColor: themeColors.isDark ? '#334155' : '#e2e8f0',
          borderWidth: 1,
          padding: 10,
          displayColors: true,
          boxWidth: 8,
          boxHeight: 8,
          usePointStyle: true,
          callbacks: {
            title: (items) => {
              const idx = items[0].dataIndex;
              return buckets[idx].timeRange || buckets[idx].label;
            },
            label: (item) => {
              const val = item.raw || 0;
              return ` ${item.dataset.label}: ${formatRupiah(val)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: themeColors.text,
            font: {
              size: 11,
              weight: '600',
              family: 'Plus Jakarta Sans'
            }
          }
        },
        y: {
          grid: {
            color: themeColors.grid
          },
          ticks: {
            color: themeColors.text,
            font: {
              size: 10,
              family: 'Plus Jakarta Sans'
            },
            callback: (val) => formatRupiahShort(val)
          }
        }
      }
    }
  });
}

function renderExpenseCategoriesChart(expenseByCat, totalExpense) {
  const canvas = document.getElementById('chart-expense-categories-canvas');
  if (!canvas) return;

  if (chartExpenseCatInstance) {
    chartExpenseCatInstance.destroy();
    chartExpenseCatInstance = null;
  }

  const themeColors = getChartThemeColors();
  const entries = Object.entries(expenseByCat).filter(([_, amt]) => amt > 0).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0 || totalExpense <= 0) {
    chartExpenseCatInstance = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Belum ada pengeluaran'],
        datasets: [{
          data: [1],
          backgroundColor: [themeColors.isDark ? '#334155' : '#e2e8f0'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        }
      }
    });
    return;
  }

  const palette = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#64748b', '#14b8a6', '#6366f1'];
  const labels = entries.map(([cat]) => cat);
  const data = entries.map(([_, amt]) => amt);
  const bgColors = entries.map((_, i) => palette[i % palette.length]);

  chartExpenseCatInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: bgColors,
          borderWidth: 2,
          borderColor: themeColors.cardBg,
          hoverOffset: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            padding: 8,
            color: themeColors.text,
            font: {
              size: 11,
              family: 'Plus Jakarta Sans',
              weight: '600'
            }
          }
        },
        tooltip: {
          backgroundColor: themeColors.cardBg,
          titleColor: themeColors.textMain,
          bodyColor: themeColors.text,
          borderColor: themeColors.isDark ? '#334155' : '#e2e8f0',
          borderWidth: 1,
          padding: 8,
          callbacks: {
            label: (item) => {
              const val = item.raw || 0;
              const pct = Math.round((val / totalExpense) * 100);
              return ` ${item.label}: ${formatRupiah(val)} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

function renderTargetsReportChart() {
  const canvas = document.getElementById('chart-targets-progress-canvas');
  const summaryListEl = document.getElementById('report-targets-summary-list');
  if (!canvas) return;

  if (chartTargetsInstance) {
    chartTargetsInstance.destroy();
    chartTargetsInstance = null;
  }

  const targets = getStoredTargets();
  const themeColors = getChartThemeColors();

  if (targets.length === 0) {
    if (summaryListEl) {
      summaryListEl.innerHTML = '<p class="empty-state-mini" style="text-align:center; padding:10px 0;">Belum ada target pembelian yang dibuat. Rencanakan barang impian Anda di menu Target!</p>';
    }
    chartTargetsInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Belum ada target'],
        datasets: [{ data: [0], backgroundColor: themeColors.grid }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } }
      }
    });
    return;
  }

  // Display top 5 targets
  const displayTargets = targets.slice(0, 5);
  const labels = displayTargets.map((t) => t.name.length > 14 ? t.name.slice(0, 14) + '...' : t.name);
  const savedData = displayTargets.map((t) => t.savedAmount || 0);
  const targetData = displayTargets.map((t) => Math.max(0, (t.targetAmount || 0) - (t.savedAmount || 0)));

  chartTargetsInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Terkumpul',
          data: savedData,
          backgroundColor: '#10b981',
          borderRadius: 4,
          stack: 'progress'
        },
        {
          label: 'Sisa Target',
          data: targetData,
          backgroundColor: themeColors.isDark ? '#334155' : '#cbd5e1',
          borderRadius: 4,
          stack: 'progress'
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            boxWidth: 8,
            boxHeight: 8,
            color: themeColors.text,
            font: { size: 10, family: 'Plus Jakarta Sans', weight: '600' }
          }
        },
        tooltip: {
          backgroundColor: themeColors.cardBg,
          titleColor: themeColors.textMain,
          bodyColor: themeColors.text,
          borderColor: themeColors.isDark ? '#334155' : '#e2e8f0',
          borderWidth: 1,
          padding: 8,
          callbacks: {
            label: (item) => {
              const t = displayTargets[item.dataIndex];
              const pct = t.targetAmount > 0 ? Math.min(100, Math.round(((t.savedAmount || 0) / t.targetAmount) * 100)) : 0;
              if (item.datasetIndex === 0) {
                return ` Terkumpul: ${formatRupiah(t.savedAmount || 0)} (${pct}%)`;
              }
              const remaining = Math.max(0, (t.targetAmount || 0) - (t.savedAmount || 0));
              return ` Sisa Kebutuhan: ${formatRupiah(remaining)}`;
            }
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          grid: { color: themeColors.grid },
          ticks: {
            color: themeColors.text,
            font: { size: 10, family: 'Plus Jakarta Sans' },
            callback: (val) => formatRupiahShort(val)
          }
        },
        y: {
          stacked: true,
          grid: { display: false },
          ticks: {
            color: themeColors.textMain,
            font: { size: 11, family: 'Plus Jakarta Sans', weight: '600' }
          }
        }
      }
    }
  });

  // Summary items below chart
  if (summaryListEl) {
    summaryListEl.innerHTML = '';
    displayTargets.forEach((t) => {
      const isDone = (t.savedAmount || 0) >= (t.targetAmount || 0);
      const pct = t.targetAmount > 0 ? Math.min(100, Math.round(((t.savedAmount || 0) / t.targetAmount) * 100)) : 0;
      const icon = TARGET_CATEGORY_ICONS[t.category] || '🎯';

      const div = document.createElement('div');
      div.className = 'report-target-item';
      div.innerHTML = `
        <span class="report-target-name">${icon} ${escapeHTML(t.name)}</span>
        <span class="report-target-progress-txt ${isDone ? 'income-color' : ''}">
          ${isDone ? 'Tercapai 🎉' : `${formatRupiah(t.savedAmount || 0)} / ${formatRupiah(t.targetAmount)} (${pct}%)`}
        </span>
      `;
      summaryListEl.appendChild(div);
    });
  }
}

function renderDistributionBar(expenseByCat, totalExpense) {
  const distBar = document.getElementById('expense-distribution-bar');
  if (!distBar) return;

  distBar.innerHTML = '';
  if (totalExpense <= 0) {
    distBar.innerHTML = '<div style="width: 100%; height: 100%; background: var(--bg-muted);"></div>';
    return;
  }

  const palette = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b'];
  const entries = Object.entries(expenseByCat).sort((a, b) => b[1] - a[1]);

  entries.forEach(([cat, amt], i) => {
    const pct = Math.round((amt / totalExpense) * 100);
    if (pct < 1) return;

    const color = palette[i % palette.length];
    const segment = document.createElement('div');
    segment.className = 'dist-segment';
    segment.style.width = `${pct}%`;
    segment.style.backgroundColor = color;
    segment.title = `${cat}: ${pct}% (${formatRupiah(amt)})`;
    distBar.appendChild(segment);
  });
}

function renderCategoryBreakdownList(containerId, dataMap, totalAmount, type) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';
  const entries = Object.entries(dataMap).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    container.innerHTML = '<p class="empty-state-mini">Tidak ada data untuk kategori ini.</p>';
    return;
  }

  entries.forEach(([catName, amt]) => {
    const pct = totalAmount > 0 ? Math.round((amt / totalAmount) * 100) : 0;
    const item = document.createElement('div');
    item.className = 'breakdown-item';

    item.innerHTML = `
      <div class="breakdown-header">
        <span class="breakdown-cat-name">${escapeHTML(catName)}</span>
        <div class="breakdown-values">
          <span>${formatRupiah(amt)}</span>
          <span class="breakdown-pct">(${pct}%)</span>
        </div>
      </div>
      <div class="breakdown-bar-bg">
        <div class="breakdown-bar-fill ${type === 'income' ? 'fill-income' : 'fill-expense'}" style="width: ${pct}%"></div>
      </div>
    `;

    container.appendChild(item);
  });
}

function renderMethodBreakdownList(containerId, methodStats, totalTurnover) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';
  const entries = Object.entries(methodStats).filter(([_, stats]) => stats.count > 0);

  if (entries.length === 0) {
    container.innerHTML = '<p class="empty-state-mini">Tidak ada data transaksi pada periode ini.</p>';
    return;
  }

  // Sort by total turnover descending
  entries.sort((a, b) => b[1].total - a[1].total);

  entries.forEach(([methodName, stats]) => {
    const pct = totalTurnover > 0 ? Math.round((stats.total / totalTurnover) * 100) : 0;
    const icon = getPaymentMethodIcon(methodName);
    const badgeClass = getPaymentMethodBadgeClass(methodName);
    const item = document.createElement('div');
    item.className = 'breakdown-item';

    item.innerHTML = `
      <div class="breakdown-header">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 1.125rem;">${icon}</span>
          <span class="breakdown-cat-name" style="font-weight: 700;">${escapeHTML(methodName)}</span>
          <span class="tx-method-badge ${badgeClass}" style="font-size: 0.625rem;">
            ${stats.count} transaksi
          </span>
        </div>
        <div class="breakdown-values">
          <span style="font-weight: 700;">${formatRupiah(stats.total)}</span>
          <span class="breakdown-pct">(${pct}%)</span>
        </div>
      </div>
      <div class="breakdown-bar-bg" style="height: 7px;">
        <div class="breakdown-bar-fill" style="width: ${pct}%; background: var(--primary);"></div>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 0.6875rem; color: var(--text-muted); margin-top: 4px;">
        <span class="income-color">Uang Masuk: +${formatRupiah(stats.income)}</span>
        <span class="expense-color">Uang Keluar: -${formatRupiah(stats.expense)}</span>
      </div>
    `;

    container.appendChild(item);
  });
}

// ==========================================
// 9.5. VIEW: TARGET PEMBELIAN CONTROLLER
// ==========================================

const TARGET_CATEGORY_ICONS = {
  Elektronik: '📱',
  Kendaraan: '🛵',
  'Rumah Tangga': '🏠',
  Liburan: '🏖️',
  Pakaian: '👕',
  'Dana Darurat': '🛡️',
  Pendidikan: '📚',
  Lainnya: '📦'
};

function renderTargetsView() {
  const targets = getStoredTargets();
  const listEl = document.getElementById('target-items-list');
  const emptyStateEl = document.getElementById('target-empty-state');

  // Stats calculation
  let totalSaved = 0;
  let totalNeeded = 0;
  let countActive = 0;
  let countCompleted = 0;

  targets.forEach((t) => {
    totalSaved += Number(t.savedAmount) || 0;
    totalNeeded += Number(t.targetAmount) || 0;
    if ((Number(t.savedAmount) || 0) >= (Number(t.targetAmount) || 0)) {
      countCompleted++;
    } else {
      countActive++;
    }
  });

  const totalRemaining = Math.max(0, totalNeeded - totalSaved);
  const globalPct = totalNeeded > 0 ? Math.min(100, Math.round((totalSaved / totalNeeded) * 100)) : 0;

  const totalSavedEl = document.getElementById('target-total-saved');
  const totalNeededEl = document.getElementById('target-total-needed');
  const totalRemEl = document.getElementById('target-total-remaining');
  const globalPctEl = document.getElementById('target-global-pct');
  const globalBarEl = document.getElementById('target-global-bar');

  if (totalSavedEl) totalSavedEl.textContent = formatRupiah(totalSaved);
  if (totalNeededEl) totalNeededEl.textContent = formatRupiah(totalNeeded);
  if (totalRemEl) totalRemEl.textContent = formatRupiah(totalRemaining);
  if (globalPctEl) globalPctEl.textContent = `${globalPct}%`;
  if (globalBarEl) globalBarEl.style.width = `${globalPct}%`;

  // Update counts on filter buttons
  const countAllEl = document.getElementById('count-target-all');
  const countActEl = document.getElementById('count-target-active');
  const countCompEl = document.getElementById('count-target-completed');

  if (countAllEl) countAllEl.textContent = targets.length;
  if (countActEl) countActEl.textContent = countActive;
  if (countCompEl) countCompEl.textContent = countCompleted;

  if (!listEl) return;
  listEl.innerHTML = '';

  // Filter based on targetFilterStatus
  const filtered = targets.filter((t) => {
    const isDone = (Number(t.savedAmount) || 0) >= (Number(t.targetAmount) || 0);
    if (targetFilterStatus === 'active') return !isDone;
    if (targetFilterStatus === 'completed') return isDone;
    return true;
  });

  if (filtered.length === 0) {
    if (emptyStateEl) emptyStateEl.hidden = false;
    return;
  }

  if (emptyStateEl) emptyStateEl.hidden = true;

  const today = new Date();

  filtered.forEach((t) => {
    const isDone = (Number(t.savedAmount) || 0) >= (Number(t.targetAmount) || 0);
    const targetAmt = Number(t.targetAmount) || 0;
    const savedAmt = Number(t.savedAmount) || 0;
    const remaining = Math.max(0, targetAmt - savedAmt);
    const pct = targetAmt > 0 ? Math.min(100, Math.round((savedAmt / targetAmt) * 100)) : 0;
    const icon = TARGET_CATEGORY_ICONS[t.category] || '🎯';

    // Deadline & smart saving pace calculation
    let adviceHTML = '';
    if (t.targetDate) {
      const targetD = new Date(t.targetDate + 'T00:00:00');
      const diffMs = targetD.getTime() - today.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 3600 * 24));

      if (isDone) {
        adviceHTML = `
          <div class="target-advice-row">
            <span class="target-deadline-tag">🎉 Target telah tercapai penuh!</span>
            <span class="target-saving-rate-hint">Siap Dibeli</span>
          </div>
        `;
      } else if (diffDays > 0) {
        const dailyPace = Math.ceil(remaining / diffDays);
        adviceHTML = `
          <div class="target-advice-row">
            <span class="target-deadline-tag">📅 Target: ${formatDateDisplay(t.targetDate)} (${diffDays} hari lagi)</span>
            <span class="target-saving-rate-hint">Perlu ~${formatRupiah(dailyPace)} / hari</span>
          </div>
        `;
      } else {
        adviceHTML = `
          <div class="target-advice-row">
            <span class="target-deadline-tag" style="color: var(--expense-color);">⚠️ Telah melewati target tanggal (${formatDateDisplay(t.targetDate)})</span>
          </div>
        `;
      }
    }

    const card = document.createElement('div');
    card.className = `target-card ${isDone ? 'is-completed' : ''}`;

    card.innerHTML = `
      <div class="target-card-header">
        <div class="target-title-wrap">
          <span class="target-cat-badge">${icon} ${escapeHTML(t.category || 'Target')}</span>
          <h3 class="target-card-title">${escapeHTML(t.name)}</h3>
          ${t.note ? `<p class="target-card-note">${escapeHTML(t.note)}</p>` : ''}
        </div>
        <span class="target-status-badge ${isDone ? 'status-completed-pill' : 'status-active-pill'}">
          ${isDone ? 'Tercapai 🎉' : 'Nabung'}
        </span>
      </div>

      <div class="target-numbers-row">
        <div>
          <span style="font-size: 0.6875rem; color: var(--text-muted); display: block;">Terkumpul:</span>
          <span class="target-saved-val">${formatRupiah(savedAmt)}</span>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 0.6875rem; color: var(--text-muted); display: block;">Target Harga:</span>
          <span class="target-goal-val">${formatRupiah(targetAmt)}</span>
        </div>
      </div>

      <div class="target-track-row">
        <div class="target-progress-bar">
          <div class="target-bar-fill" style="width: ${pct}%"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">
          <span>Sisa: ${isDone ? '<strong style="color: var(--income-color);">Lunas</strong>' : formatRupiah(remaining)}</span>
          <span class="target-pct-indicator">${pct}%</span>
        </div>
      </div>

      ${adviceHTML}

      <div class="target-card-actions">
        <button type="button" class="btn btn-primary btn-sm btn-deposit-target" data-target-id="${t.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          + Nabung
        </button>

        <div class="target-extra-actions">
          ${savedAmt > 0 ? `
            <button type="button" class="btn-target-icon btn-target-withdraw" data-target-id="${t.id}" title="Tarik uang tabungan" aria-label="Tarik tabungan">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          ` : ''}

          <button type="button" class="btn-target-icon btn-target-edit" data-target-id="${t.id}" title="Edit target" aria-label="Edit target">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
            </svg>
          </button>

          <button type="button" class="btn-target-icon btn-target-delete" data-target-id="${t.id}" title="Hapus target" aria-label="Hapus target">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    `;

    listEl.appendChild(card);
  });
}

function renderDashboardTargetWidget() {
  const container = document.getElementById('dash-target-preview');
  if (!container) return;

  const targets = getStoredTargets();
  if (targets.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 12px 6px;">
        <p style="font-size: 0.8125rem; color: var(--text-muted); margin-bottom: 8px;">Punya impian beli barang? Atur target & tabung bertahap.</p>
        <button type="button" class="btn btn-secondary btn-sm" id="btn-dash-create-target">
          + Buat Target Impian
        </button>
      </div>
    `;

    const btn = document.getElementById('btn-dash-create-target');
    if (btn) {
      btn.addEventListener('click', () => {
        openTargetModal();
      });
    }
    return;
  }

  // Ambil 2 target prioritas (belum selesai lebih diutamakan)
  const activeTargets = targets.filter((t) => (t.savedAmount || 0) < (t.targetAmount || 0));
  const previewItems = activeTargets.length > 0 ? activeTargets.slice(0, 2) : targets.slice(0, 2);

  let html = '';
  previewItems.forEach((t) => {
    const isDone = (t.savedAmount || 0) >= (t.targetAmount || 0);
    const targetAmt = Number(t.targetAmount) || 0;
    const savedAmt = Number(t.savedAmount) || 0;
    const pct = targetAmt > 0 ? Math.min(100, Math.round((savedAmt / targetAmt) * 100)) : 0;
    const icon = TARGET_CATEGORY_ICONS[t.category] || '🎯';

    html += `
      <div class="dash-target-mini-card" role="button" tabindex="0" title="Klik untuk lihat detail target" style="cursor: pointer;">
        <div class="dash-target-mini-top">
          <span class="dash-target-mini-name">${icon} ${escapeHTML(t.name)}</span>
          <span class="dash-target-mini-pct ${isDone ? 'income-color' : ''}">${isDone ? 'Tercapai 🎉' : pct + '%'}</span>
        </div>
        <div class="progress-track">
          <div class="progress-bar-fill" style="width: ${pct}%; ${isDone ? 'background: var(--income-color);' : ''}"></div>
        </div>
        <div class="dash-target-mini-bottom">
          <span>Terkumpul: <strong class="income-color">${formatRupiah(savedAmt)}</strong></span>
          <span>Target: ${formatRupiah(targetAmt)}</span>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  container.querySelectorAll('.dash-target-mini-card').forEach((card) => {
    card.addEventListener('click', () => switchView('targets'));
  });
}

// Modal Target Controller
function openTargetModal(targetId = null) {
  const modal = document.getElementById('target-modal');
  const titleEl = document.getElementById('target-modal-title');
  const form = document.getElementById('target-form');
  if (!modal || !form) return;

  form.reset();

  if (targetId) {
    const targets = getStoredTargets();
    const t = targets.find((item) => item.id === targetId);
    if (t) {
      if (titleEl) titleEl.textContent = 'Edit Target Pembelian';
      document.getElementById('target-form-id').value = t.id;
      document.getElementById('target-form-name').value = t.name;
      document.getElementById('target-form-amount').value = t.targetAmount;
      document.getElementById('target-form-saved').value = t.savedAmount;
      document.getElementById('target-form-category').value = t.category || 'Elektronik';
      document.getElementById('target-form-date').value = t.targetDate || '';
      document.getElementById('target-form-note').value = t.note || '';
    }
  } else {
    if (titleEl) titleEl.textContent = 'Buat Target Pembelian';
    document.getElementById('target-form-id').value = '';
    document.getElementById('target-form-saved').value = '0';
  }

  modal.hidden = false;
  modal.classList.add('is-open');
}

function closeTargetModal() {
  const modal = document.getElementById('target-modal');
  if (modal) {
    modal.hidden = true;
    modal.classList.remove('is-open');
  }
}

function handleTargetFormSubmit(e) {
  e.preventDefault();
  const idVal = document.getElementById('target-form-id').value;
  const name = document.getElementById('target-form-name').value.trim();
  const amount = Math.round(parseFloat(document.getElementById('target-form-amount').value));
  const saved = Math.max(0, Math.round(parseFloat(document.getElementById('target-form-saved').value) || 0));
  const category = document.getElementById('target-form-category').value;
  const date = document.getElementById('target-form-date').value;
  const note = document.getElementById('target-form-note').value.trim();

  if (!name) {
    showToast('Nama barang / target tidak boleh kosong.');
    return;
  }

  if (!amount || amount < 1000) {
    showToast('Target nominal minimal Rp1.000.');
    return;
  }

  const targets = getStoredTargets();

  if (idVal) {
    // Edit
    const id = Number(idVal);
    const idx = targets.findIndex((t) => t.id === id);
    if (idx !== -1) {
      targets[idx] = {
        ...targets[idx],
        name,
        targetAmount: amount,
        savedAmount: saved,
        category,
        targetDate: date,
        note
      };
      saveTargets(targets);
      showToast('Target pembelian berhasil diperbarui!');
    }
  } else {
    // Baru
    const newTarget = {
      id: Date.now(),
      name,
      targetAmount: amount,
      savedAmount: saved,
      category,
      targetDate: date,
      note,
      createdAt: getTodayString()
    };
    targets.unshift(newTarget);
    saveTargets(targets);
    showToast('Target pembelian baru berhasil dibuat! 🎯');
  }

  closeTargetModal();
  renderTargetsView();
  renderDashboardTargetWidget();
}

// Deposit Tabungan Controller
function openDepositModal(targetId) {
  const modal = document.getElementById('deposit-target-modal');
  const targetIdInput = document.getElementById('deposit-target-id');
  const nameEl = document.getElementById('deposit-target-name');
  const curSavedEl = document.getElementById('deposit-current-saved');
  const remNeededEl = document.getElementById('deposit-remaining-needed');
  const amountInput = document.getElementById('deposit-amount');
  if (!modal || !targetIdInput) return;

  const targets = getStoredTargets();
  const t = targets.find((item) => item.id === targetId);
  if (!t) return;

  targetIdInput.value = t.id;
  if (nameEl) nameEl.textContent = t.name;
  if (curSavedEl) curSavedEl.textContent = formatRupiah(t.savedAmount);
  const remaining = Math.max(0, t.targetAmount - t.savedAmount);
  if (remNeededEl) remNeededEl.textContent = remaining > 0 ? formatRupiah(remaining) : 'Lunas';

  if (amountInput) {
    amountInput.value = '';
    setTimeout(() => amountInput.focus(), 100);
  }

  modal.hidden = false;
  modal.classList.add('is-open');
}

function closeDepositModal() {
  const modal = document.getElementById('deposit-target-modal');
  if (modal) {
    modal.hidden = true;
    modal.classList.remove('is-open');
  }
}

function handleDepositFormSubmit(e) {
  e.preventDefault();
  const id = Number(document.getElementById('deposit-target-id').value);
  const amount = Math.round(parseFloat(document.getElementById('deposit-amount').value));
  const recordTx = document.getElementById('deposit-record-tx').checked;

  if (!amount || amount < 1000) {
    showToast('Nominal tabungan minimal Rp1.000.');
    return;
  }

  const targets = getStoredTargets();
  const idx = targets.findIndex((t) => t.id === id);
  if (idx === -1) return;

  const prevSaved = targets[idx].savedAmount || 0;
  targets[idx].savedAmount = prevSaved + amount;
  saveTargets(targets);

  // Optional: create expense transaction under category 'Tabungan'
  if (recordTx) {
    const transactions = getStoredTransactions();
    transactions.unshift({
      id: Date.now(),
      date: getTodayString(),
      type: 'expense',
      category: 'Tabungan',
      amount,
      paymentMethod: 'Transfer Bank',
      note: `Nabung untuk ${targets[idx].name}`
    });
    saveTransactions(transactions);
    renderDashboard();
    renderTransactionsList();
  }

  const isNowComplete = targets[idx].savedAmount >= targets[idx].targetAmount;
  if (isNowComplete && prevSaved < targets[idx].targetAmount) {
    showToast(`Selamat! Target "${targets[idx].name}" telah tercapai! 🎉`);
  } else {
    showToast(`Berhasil menabung ${formatRupiah(amount)} untuk ${targets[idx].name}!`);
  }

  closeDepositModal();
  renderTargetsView();
  renderDashboardTargetWidget();
}

// Withdraw Tabungan Controller
function openWithdrawModal(targetId) {
  const modal = document.getElementById('withdraw-target-modal');
  const targetIdInput = document.getElementById('withdraw-target-id');
  const nameEl = document.getElementById('withdraw-target-name');
  const availEl = document.getElementById('withdraw-available-saved');
  const amountInput = document.getElementById('withdraw-amount');
  if (!modal || !targetIdInput) return;

  const targets = getStoredTargets();
  const t = targets.find((item) => item.id === targetId);
  if (!t) return;

  targetIdInput.value = t.id;
  if (nameEl) nameEl.textContent = t.name;
  if (availEl) availEl.textContent = formatRupiah(t.savedAmount);
  if (amountInput) amountInput.value = '';

  modal.hidden = false;
  modal.classList.add('is-open');
}

function closeWithdrawModal() {
  const modal = document.getElementById('withdraw-target-modal');
  if (modal) {
    modal.hidden = true;
    modal.classList.remove('is-open');
  }
}

function handleWithdrawFormSubmit(e) {
  e.preventDefault();
  const id = Number(document.getElementById('withdraw-target-id').value);
  const amount = Math.round(parseFloat(document.getElementById('withdraw-amount').value));
  const recordTx = document.getElementById('withdraw-record-tx').checked;

  const targets = getStoredTargets();
  const idx = targets.findIndex((t) => t.id === id);
  if (idx === -1) return;

  if (!amount || amount < 1000) {
    showToast('Nominal penarikan minimal Rp1.000.');
    return;
  }

  if (amount > (targets[idx].savedAmount || 0)) {
    showToast('Nominal melebihi saldo tabungan target.');
    return;
  }

  targets[idx].savedAmount = (targets[idx].savedAmount || 0) - amount;
  saveTargets(targets);

  if (recordTx) {
    const transactions = getStoredTransactions();
    transactions.unshift({
      id: Date.now(),
      date: getTodayString(),
      type: 'income',
      category: 'Lainnya',
      amount,
      paymentMethod: 'Transfer Bank',
      note: `Tarik tabungan dari ${targets[idx].name}`
    });
    saveTransactions(transactions);
    renderDashboard();
    renderTransactionsList();
  }

  showToast(`Dana ${formatRupiah(amount)} ditarik dari ${targets[idx].name}.`);
  closeWithdrawModal();
  renderTargetsView();
  renderDashboardTargetWidget();
}

function deleteTarget(targetId) {
  const targets = getStoredTargets();
  const target = targets.find((t) => t.id === targetId);
  if (!target) return;

  openConfirmModal(
    `Hapus Target "${target.name}"?`,
    'Target pembelian beserta riwayat capaian tabungan ini akan dihapus permanen.',
    () => {
      const updated = targets.filter((t) => t.id !== targetId);
      saveTargets(updated);
      showToast(`Target "${target.name}" berhasil dihapus.`);
      renderTargetsView();
      renderDashboardTargetWidget();
    }
  );
}

// ==========================================
// 10. VIEW 5: PENGATURAN (BACKUP, RESTORE, CSV)
// ==========================================

function exportCSV() {
  const transactions = getStoredTransactions();
  if (transactions.length === 0) {
    showToast('Tidak ada data transaksi untuk diexport.');
    return;
  }

  const headers = ['Tanggal', 'Tipe', 'Kategori', 'Metode Transaksi', 'Nominal', 'Catatan'];
  const rows = transactions.map((tx) => [
    `"${tx.date}"`,
    `"${tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}"`,
    `"${(tx.category || '').replace(/"/g, '""')}"`,
    `"${(tx.paymentMethod || 'Tunai').replace(/"/g, '""')}"`,
    tx.amount,
    `"${(tx.note || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `finova-transactions-${getTodayString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast('File CSV berhasil diunduh!');
}

function backupJSON() {
  const transactions = getStoredTransactions();
  const categories = getStoredCategories();
  const targets = getStoredTargets();

  const backupData = {
    appName: 'FiNOVA',
    version: 1,
    exportedAt: new Date().toISOString(),
    transactions,
    categories,
    targets
  };

  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `finova-backup-${getTodayString()}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast('File Backup JSON berhasil diunduh!');
}

function importJSON(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data && Array.isArray(data.transactions)) {
        saveTransactions(data.transactions);

        if (data.categories && Array.isArray(data.categories.income) && Array.isArray(data.categories.expense)) {
          saveCategories(data.categories);
        }

        if (Array.isArray(data.targets)) {
          saveTargets(data.targets);
        }

        showToast(`Berhasil memulihkan ${data.transactions.length} transaksi!`);
        renderDashboard();
        renderTransactionsList();
        renderTargetsView();
        renderSettingsCategoryTags();
      } else {
        showToast('Format berkas JSON tidak valid.');
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal membaca file JSON.');
    }
  };
  reader.readAsText(file);
}

function renderSettingsCategoryTags() {
  const cat = getStoredCategories();
  const wrapIncome = document.getElementById('tags-income');
  const wrapExpense = document.getElementById('tags-expense');

  if (wrapIncome) {
    wrapIncome.innerHTML = '';
    cat.income.forEach((c) => {
      const badge = document.createElement('span');
      badge.className = 'tag-badge';
      badge.innerHTML = `
        ${escapeHTML(c)}
        ${!DEFAULT_CATEGORIES.income.includes(c) ? `<button type="button" class="btn-delete-tag" title="Hapus kategori" data-type="income" data-cat="${escapeHTML(c)}">✕</button>` : ''}
      `;
      wrapIncome.appendChild(badge);
    });
  }

  if (wrapExpense) {
    wrapExpense.innerHTML = '';
    cat.expense.forEach((c) => {
      const badge = document.createElement('span');
      badge.className = 'tag-badge';
      badge.innerHTML = `
        ${escapeHTML(c)}
        ${!DEFAULT_CATEGORIES.expense.includes(c) ? `<button type="button" class="btn-delete-tag" title="Hapus kategori" data-type="expense" data-cat="${escapeHTML(c)}">✕</button>` : ''}
      `;
      wrapExpense.appendChild(badge);
    });
  }

  // Event listener tombol hapus custom category
  document.querySelectorAll('.btn-delete-tag').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const type = e.currentTarget.dataset.type;
      const catName = e.currentTarget.dataset.cat;
      const categories = getStoredCategories();
      categories[type] = categories[type].filter((item) => item !== catName);
      saveCategories(categories);
      showToast(`Kategori "${catName}" dihapus.`);
      renderSettingsCategoryTags();
      populateCategorySelect('category', 'income');
    });
  });
}

// ==========================================
// 11. MODAL TAMBAH KATEGORI BARU
// ==========================================

function openCategoryModal() {
  const modal = document.getElementById('add-category-modal');
  if (modal) {
    modal.hidden = false;
    modal.classList.add('is-open');
    const input = document.getElementById('new-category-name');
    if (input) {
      input.value = '';
      input.focus();
    }
  }
}

function closeCategoryModal() {
  const modal = document.getElementById('add-category-modal');
  if (modal) {
    modal.hidden = true;
    modal.classList.remove('is-open');
  }
}

function handleAddCategorySubmit(e) {
  e.preventDefault();
  const input = document.getElementById('new-category-name');
  const typeRadio = document.querySelector('input[name="cat-type"]:checked');
  const type = typeRadio ? typeRadio.value : 'income';
  const name = input.value.trim();

  if (!name) {
    showToast('Masukkan nama kategori.');
    return;
  }

  const categories = getStoredCategories();
  if (categories[type].includes(name)) {
    showToast('Kategori ini sudah terdaftar.');
    return;
  }

  categories[type].push(name);
  saveCategories(categories);
  showToast(`Kategori "${name}" berhasil ditambahkan!`);
  closeCategoryModal();

  populateCategorySelect('category', type, name);
  renderSettingsCategoryTags();
}

// ==========================================
// 12. MODAL KONFIRMASI UMUM
// ==========================================

function openConfirmModal(configOrTitle, description, onConfirm, confirmText) {
  const modal = document.getElementById('confirmation-modal');
  const titleEl = document.getElementById('modal-title');
  const descEl = document.getElementById('modal-description');
  const confirmBtn = document.getElementById('btn-modal-confirm');

  let title = 'Konfirmasi';
  let desc = 'Apakah Anda yakin?';
  let confirm = 'Ya, Lanjutkan';
  let callback = null;

  if (typeof configOrTitle === 'object' && configOrTitle !== null) {
    title = configOrTitle.title || title;
    desc = configOrTitle.description || desc;
    confirm = configOrTitle.confirmText || (title.toLowerCase().includes('hapus') ? 'Hapus' : confirm);
    callback = configOrTitle.onConfirm || null;
  } else {
    title = configOrTitle || title;
    desc = description || desc;
    callback = onConfirm || null;
    confirm = confirmText || (title.toLowerCase().includes('hapus') ? 'Hapus' : confirm);
  }

  if (titleEl) titleEl.textContent = title;
  if (descEl) descEl.textContent = desc;
  if (confirmBtn) {
    confirmBtn.textContent = confirm;
    confirmBtn.className = title.toLowerCase().includes('hapus') ? 'btn btn-danger' : 'btn btn-primary';
  }

  pendingConfirmCallback = callback;
  if (modal) {
    modal.hidden = false;
    modal.classList.add('is-open');
  }
}

function closeConfirmModal() {
  const modal = document.getElementById('confirmation-modal');
  if (modal) {
    modal.hidden = true;
    modal.classList.remove('is-open');
  }
  pendingConfirmCallback = null;
}

// ==========================================
// 13. TEMA / DARK MODE
// ==========================================

function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) || 'light';
  applyTheme(savedTheme);

  const themeSwitch = document.getElementById('switch-dark-mode');
  if (themeSwitch) {
    themeSwitch.checked = savedTheme === 'dark';
    themeSwitch.addEventListener('change', (e) => {
      applyTheme(e.target.checked ? 'dark' : 'light');
    });
  }

  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const target = current === 'dark' ? 'light' : 'dark';
      applyTheme(target);
      if (themeSwitch) themeSwitch.checked = target === 'dark';
    });
  }
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem(STORAGE_KEY_THEME, 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem(STORAGE_KEY_THEME, 'light');
  }

  const iconMoon = document.getElementById('icon-theme-moon');
  const iconSun = document.getElementById('icon-theme-sun');
  if (iconMoon && iconSun) {
    iconMoon.hidden = theme === 'dark';
    iconSun.hidden = theme !== 'dark';
  }

  // If report view is currently open, redraw charts for updated theme colors
  if (currentNav === 'report') {
    renderReport();
  }
}

// ==========================================
// 14. INISIALISASI EVENT LISTENERS
// ==========================================

function initApp() {
  // 1. Inisialisasi Tema
  initTheme();

  // 2. Navigasi Bottom Bar
  document.querySelectorAll('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget.dataset.nav;
      switchView(target);
    });
  });

  // 3. Form Tambah Transaksi
  const form = document.getElementById('transaction-form');
  if (form) {
    form.addEventListener('submit', handleAddTransactionSubmit);

    // Pill Pemasukan / Pengeluaran toggle
    const radioIncome = form.querySelector('input[value="income"]');
    const radioExpense = form.querySelector('input[value="expense"]');
    const labelIncome = document.getElementById('label-type-income');
    const labelExpense = document.getElementById('label-type-expense');

    if (radioIncome && radioExpense) {
      const selectIncome = () => {
        radioIncome.checked = true;
        labelIncome.classList.add('is-active');
        labelExpense.classList.remove('is-active');
        populateCategorySelect('category', 'income');
      };

      const selectExpense = () => {
        radioExpense.checked = true;
        labelExpense.classList.add('is-active');
        labelIncome.classList.remove('is-active');
        populateCategorySelect('category', 'expense');
      };

      radioIncome.addEventListener('change', selectIncome);
      radioExpense.addEventListener('change', selectExpense);
      if (labelIncome) labelIncome.addEventListener('click', selectIncome);
      if (labelExpense) labelExpense.addEventListener('click', selectExpense);
    }

    // Default kategori
    populateCategorySelect('category', 'income');

    // Payment Method Pills for Add Form
    const addMethodPills = form.querySelectorAll('#add-payment-method-grid .payment-pill');
    addMethodPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        addMethodPills.forEach((p) => p.classList.remove('is-active'));
        pill.classList.add('is-active');
        const inp = pill.querySelector('input');
        if (inp) inp.checked = true;
      });
    });

    // Quick Amount Chips
    form.querySelectorAll('[data-amount-set]').forEach((chip) => {
      chip.addEventListener('click', (e) => {
        const val = e.currentTarget.dataset.amountSet;
        const amountInput = document.getElementById('amount');
        if (amountInput && val) {
          amountInput.value = val;
          amountInput.focus();
        }
      });
    });
  }

  // Quick add category button
  const btnQuickAddCat = document.getElementById('btn-quick-add-category');
  if (btnQuickAddCat) btnQuickAddCat.addEventListener('click', openCategoryModal);

  // 4. Riwayat Transaksi - Filter Buttons
  document.querySelectorAll('.filter-group .btn-filter').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-group .btn-filter').forEach((b) => b.classList.remove('is-active'));
      e.currentTarget.classList.add('is-active');
      txFilterType = e.currentTarget.dataset.filter;
      renderTransactionsList();
    });
  });

  // Filter Metode Pembayaran Chips
  document.querySelectorAll('#method-filter-chips .btn-method-chip').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('#method-filter-chips .btn-method-chip').forEach((b) => b.classList.remove('is-active'));
      e.currentTarget.classList.add('is-active');
      txFilterMethod = e.currentTarget.dataset.methodFilter;
      renderTransactionsList();
    });
  });

  // Search Input
  const txSearchInput = document.getElementById('tx-search-input');
  const btnTxClearSearch = document.getElementById('btn-tx-clear-search');
  if (txSearchInput && btnTxClearSearch) {
    txSearchInput.addEventListener('input', (e) => {
      txSearchQuery = e.target.value.trim().toLowerCase();
      btnTxClearSearch.hidden = !e.target.value;
      renderTransactionsList();
    });

    btnTxClearSearch.addEventListener('click', () => {
      txSearchInput.value = '';
      txSearchQuery = '';
      btnTxClearSearch.hidden = true;
      txSearchInput.focus();
      renderTransactionsList();
    });
  }

  // Filter Tanggal
  const inputDateFrom = document.getElementById('filter-date-from');
  const inputDateTo = document.getElementById('filter-date-to');
  const btnResetDate = document.getElementById('btn-reset-date-filter');

  if (inputDateFrom && inputDateTo) {
    inputDateFrom.addEventListener('change', (e) => {
      txFilterDateFrom = e.target.value;
      renderTransactionsList();
    });

    inputDateTo.addEventListener('change', (e) => {
      txFilterDateTo = e.target.value;
      renderTransactionsList();
    });
  }

  if (btnResetDate) {
    btnResetDate.addEventListener('click', () => {
      if (inputDateFrom) inputDateFrom.value = '';
      if (inputDateTo) inputDateTo.value = '';
      txFilterDateFrom = '';
      txFilterDateTo = '';
      renderTransactionsList();
    });
  }

  // 5. Laporan - Periode Tabs
  document.querySelectorAll('.period-tabs .btn-period').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.period-tabs .btn-period').forEach((b) => b.classList.remove('is-active'));
      e.currentTarget.classList.add('is-active');
      reportPeriod = e.currentTarget.dataset.period;
      renderReport();
    });
  });

  // 5.1. Laporan - Toggle Grafik (Bar vs Line)
  const btnChartBar = document.getElementById('btn-chart-bar');
  const btnChartLine = document.getElementById('btn-chart-line');
  if (btnChartBar && btnChartLine) {
    btnChartBar.addEventListener('click', () => {
      btnChartBar.classList.add('is-active');
      btnChartLine.classList.remove('is-active');
      chartTrendType = 'bar';
      renderReport();
    });
    btnChartLine.addEventListener('click', () => {
      btnChartLine.classList.add('is-active');
      btnChartBar.classList.remove('is-active');
      chartTrendType = 'line';
      renderReport();
    });
  }

  // 6. Settings Buttons
  const btnExportCsv = document.getElementById('btn-export-csv');
  if (btnExportCsv) btnExportCsv.addEventListener('click', exportCSV);

  const btnBackup = document.getElementById('btn-backup-json');
  if (btnBackup) btnBackup.addEventListener('click', backupJSON);

  const btnTriggerImport = document.getElementById('btn-trigger-import-json');
  const inputImport = document.getElementById('input-import-json');
  if (btnTriggerImport && inputImport) {
    btnTriggerImport.addEventListener('click', () => inputImport.click());
    inputImport.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        importJSON(e.target.files[0]);
        e.target.value = '';
      }
    });
  }

  const btnResetAll = document.getElementById('btn-reset-data');
  if (btnResetAll) {
    btnResetAll.addEventListener('click', () => {
      openConfirmModal({
        title: 'Hapus Semua Data',
        description: 'Tindakan ini akan menghapus seluruh data transaksi dan target pembelian dari browser. Pastikan sudah melakukan backup.',
        confirmText: 'Hapus Semua',
        onConfirm: () => {
          localStorage.removeItem(STORAGE_KEY_TX);
          localStorage.removeItem(STORAGE_KEY_TARGETS);
          localStorage.setItem('finance_app_visited', 'true');
          localStorage.setItem('finance_targets_visited', 'true');
          showToast('Semua data transaksi dan target telah dihapus.');
          renderDashboard();
          renderTransactionsList();
          renderTargetsView();
          renderReport();
        }
      });
    });
  }

  const btnOpenCatModal = document.getElementById('btn-open-category-modal');
  if (btnOpenCatModal) btnOpenCatModal.addEventListener('click', openCategoryModal);

  // 6.5. Target Pembelian Event Handlers
  // Target Filter Tabs
  document.querySelectorAll('[data-target-filter]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('[data-target-filter]').forEach((b) => b.classList.remove('is-active'));
      e.currentTarget.classList.add('is-active');
      targetFilterStatus = e.currentTarget.dataset.targetFilter;
      renderTargetsView();
    });
  });

  // Open Target Modal Buttons
  const btnOpenAddTarget = document.getElementById('btn-open-add-target');
  const btnEmptyAddTarget = document.getElementById('btn-empty-add-target');
  if (btnOpenAddTarget) btnOpenAddTarget.addEventListener('click', () => openTargetModal());
  if (btnEmptyAddTarget) btnEmptyAddTarget.addEventListener('click', () => openTargetModal());

  // Target Card Action Delegation
  const targetListEl = document.getElementById('target-items-list');
  if (targetListEl) {
    targetListEl.addEventListener('click', (e) => {
      const btnDeposit = e.target.closest('.btn-deposit-target');
      if (btnDeposit) {
        openDepositModal(Number(btnDeposit.dataset.targetId));
        return;
      }

      const btnWithdraw = e.target.closest('.btn-target-withdraw');
      if (btnWithdraw) {
        openWithdrawModal(Number(btnWithdraw.dataset.targetId));
        return;
      }

      const btnEdit = e.target.closest('.btn-target-edit');
      if (btnEdit) {
        openTargetModal(Number(btnEdit.dataset.targetId));
        return;
      }

      const btnDelete = e.target.closest('.btn-target-delete');
      if (btnDelete) {
        deleteTarget(Number(btnDelete.dataset.targetId));
        return;
      }
    });
  }

  // Preset Target Buttons in Modal
  document.querySelectorAll('.btn-preset-target').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const name = e.currentTarget.dataset.presetName;
      const cat = e.currentTarget.dataset.presetCat;
      const amt = e.currentTarget.dataset.presetAmount;
      if (name) document.getElementById('target-form-name').value = name;
      if (cat) document.getElementById('target-form-category').value = cat;
      if (amt) document.getElementById('target-form-amount').value = amt;
      showToast(`Pilihan cepat "${name}" diterapkan!`);
    });
  });

  // Target Form Modal
  const targetForm = document.getElementById('target-form');
  if (targetForm) targetForm.addEventListener('submit', handleTargetFormSubmit);
  const btnCloseTarget = document.getElementById('btn-close-target-modal');
  const btnCancelTarget = document.getElementById('btn-cancel-target');
  if (btnCloseTarget) btnCloseTarget.addEventListener('click', closeTargetModal);
  if (btnCancelTarget) btnCancelTarget.addEventListener('click', closeTargetModal);

  // Deposit Form Modal & Quick Chips
  const depositForm = document.getElementById('deposit-target-form');
  if (depositForm) depositForm.addEventListener('submit', handleDepositFormSubmit);
  const btnCloseDeposit = document.getElementById('btn-close-deposit-modal');
  const btnCancelDeposit = document.getElementById('btn-cancel-deposit');
  if (btnCloseDeposit) btnCloseDeposit.addEventListener('click', closeDepositModal);
  if (btnCancelDeposit) btnCancelDeposit.addEventListener('click', closeDepositModal);

  document.querySelectorAll('[data-deposit-add]').forEach((chip) => {
    chip.addEventListener('click', (e) => {
      const addVal = parseInt(e.currentTarget.dataset.depositAdd, 10) || 0;
      const amountInput = document.getElementById('deposit-amount');
      if (amountInput) {
        const curVal = parseInt(amountInput.value, 10) || 0;
        amountInput.value = curVal + addVal;
      }
    });
  });

  // Withdraw Form Modal
  const withdrawForm = document.getElementById('withdraw-target-form');
  if (withdrawForm) withdrawForm.addEventListener('submit', handleWithdrawFormSubmit);
  const btnCloseWithdraw = document.getElementById('btn-close-withdraw-modal');
  const btnCancelWithdraw = document.getElementById('btn-cancel-withdraw');
  if (btnCloseWithdraw) btnCloseWithdraw.addEventListener('click', closeWithdrawModal);
  if (btnCancelWithdraw) btnCancelWithdraw.addEventListener('click', closeWithdrawModal);

  // 7. Modal Handlers
  // Confirm Modal
  const btnModalCancel = document.getElementById('btn-modal-cancel');
  const btnModalConfirm = document.getElementById('btn-modal-confirm');
  if (btnModalCancel) btnModalCancel.addEventListener('click', closeConfirmModal);
  if (btnModalConfirm) {
    btnModalConfirm.addEventListener('click', () => {
      if (typeof pendingConfirmCallback === 'function') {
        pendingConfirmCallback();
      }
      closeConfirmModal();
    });
  }

  // Edit Modal
  const editForm = document.getElementById('edit-transaction-form');
  if (editForm) {
    editForm.addEventListener('submit', handleEditFormSubmit);

    const editRadioIncome = editForm.querySelector('input[value="income"]');
    const editRadioExpense = editForm.querySelector('input[value="expense"]');
    const editLabelIncome = document.getElementById('edit-label-type-income');
    const editLabelExpense = document.getElementById('edit-label-type-expense');

    if (editRadioIncome && editRadioExpense) {
      const selectEditIncome = () => {
        editRadioIncome.checked = true;
        editLabelIncome.classList.add('is-active');
        editLabelExpense.classList.remove('is-active');
        populateCategorySelect('edit-category', 'income');
      };

      const selectEditExpense = () => {
        editRadioExpense.checked = true;
        editLabelExpense.classList.add('is-active');
        editLabelIncome.classList.remove('is-active');
        populateCategorySelect('edit-category', 'expense');
      };

      editRadioIncome.addEventListener('change', selectEditIncome);
      editRadioExpense.addEventListener('change', selectEditExpense);
      if (editLabelIncome) editLabelIncome.addEventListener('click', selectEditIncome);
      if (editLabelExpense) editLabelExpense.addEventListener('click', selectEditExpense);
    }

    // Edit Payment Method Pills
    const editMethodPills = editForm.querySelectorAll('#edit-payment-method-grid .payment-pill');
    editMethodPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        editMethodPills.forEach((p) => p.classList.remove('is-active'));
        pill.classList.add('is-active');
        const inp = pill.querySelector('input');
        if (inp) inp.checked = true;
      });
    });
  }

  const btnCloseEdit = document.getElementById('btn-close-edit-modal');
  const btnCancelEdit = document.getElementById('btn-cancel-edit');
  if (btnCloseEdit) btnCloseEdit.addEventListener('click', closeEditModal);
  if (btnCancelEdit) btnCancelEdit.addEventListener('click', closeEditModal);

  // Category Modal
  const catForm = document.getElementById('add-category-form');
  if (catForm) {
    catForm.addEventListener('submit', handleAddCategorySubmit);

    const catRadioIncome = catForm.querySelector('input[value="income"]');
    const catRadioExpense = catForm.querySelector('input[value="expense"]');
    const catLabelIncome = document.getElementById('label-cat-income');
    const catLabelExpense = document.getElementById('label-cat-expense');

    if (catRadioIncome && catRadioExpense) {
      const selectCatIncome = () => {
        catRadioIncome.checked = true;
        catLabelIncome.classList.add('is-active');
        catLabelExpense.classList.remove('is-active');
      };

      const selectCatExpense = () => {
        catRadioExpense.checked = true;
        catLabelExpense.classList.add('is-active');
        catLabelIncome.classList.remove('is-active');
      };

      catRadioIncome.addEventListener('change', selectCatIncome);
      catRadioExpense.addEventListener('change', selectCatExpense);
      if (catLabelIncome) catLabelIncome.addEventListener('click', selectCatIncome);
      if (catLabelExpense) catLabelExpense.addEventListener('click', selectCatExpense);
    }
  }

  const btnCloseCat = document.getElementById('btn-close-cat-modal');
  const btnCancelCat = document.getElementById('btn-cancel-cat');
  if (btnCloseCat) btnCloseCat.addEventListener('click', closeCategoryModal);
  if (btnCancelCat) btnCancelCat.addEventListener('click', closeCategoryModal);

  // Close modals on Escape & backdrop click
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeConfirmModal();
      closeEditModal();
      closeCategoryModal();
      closeTargetModal();
      closeDepositModal();
      closeWithdrawModal();
      closeIOSModal();
    }
  });

  document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeConfirmModal();
        closeEditModal();
        closeCategoryModal();
        closeTargetModal();
        closeDepositModal();
        closeWithdrawModal();
        closeIOSModal();
      }
    });
  });

  // 8. Initial Render
  closeConfirmModal();
  closeEditModal();
  closeCategoryModal();
  closeTargetModal();
  closeDepositModal();
  closeWithdrawModal();
  closeIOSModal();
  initPWA();
  renderDashboard();
  renderTargetsView();
  renderSettingsCategoryTags();
}

// ==========================================
// 15. PWA (PROGRESSIVE WEB APP) CONTROLLER
// ==========================================

let deferredPWAInstallPrompt = null;

function isPWAStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function isIOSDevice() {
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
}

function closeIOSModal() {
  const modal = document.getElementById('ios-install-modal');
  if (modal) {
    modal.hidden = true;
    modal.classList.remove('is-open');
  }
}

function openIOSModal() {
  const modal = document.getElementById('ios-install-modal');
  if (modal) {
    modal.hidden = false;
    modal.classList.add('is-open');
  }
}

function updatePWAStatusUI() {
  const isInstalled = isPWAStandalone();
  const statusBadge = document.getElementById('pwa-status-badge');
  const btnSettingsInstall = document.getElementById('btn-settings-install');
  const btnHeaderInstall = document.getElementById('btn-header-install');
  const banner = document.getElementById('pwa-install-banner');

  if (isInstalled) {
    if (statusBadge) {
      statusBadge.textContent = 'Terpasang (Aplikasi Mandiri)';
      statusBadge.style.color = 'var(--income-color)';
      statusBadge.style.backgroundColor = 'var(--income-bg)';
    }
    if (btnSettingsInstall) btnSettingsInstall.hidden = true;
    if (btnHeaderInstall) btnHeaderInstall.hidden = true;
    if (banner) banner.hidden = true;
    return;
  }

  // Not standalone yet
  if (statusBadge) {
    statusBadge.textContent = isIOSDevice() ? 'Siap Ditambah ke Home Screen' : 'Siap Dipasang';
  }

  if (btnSettingsInstall) {
    btnSettingsInstall.hidden = false;
    btnSettingsInstall.textContent = isIOSDevice() ? 'Panduan Pasang di iOS' : 'Pasang Aplikasi';
  }

  const dismissed = localStorage.getItem('pwa_banner_dismissed') === 'true';

  if (!dismissed) {
    if (deferredPWAInstallPrompt || isIOSDevice()) {
      if (banner) banner.hidden = false;
    }
  }

  if (deferredPWAInstallPrompt || isIOSDevice()) {
    if (btnHeaderInstall) btnHeaderInstall.hidden = false;
  }
}

async function triggerPWAInstall() {
  if (isIOSDevice()) {
    openIOSModal();
    return;
  }

  if (!deferredPWAInstallPrompt) {
    showToast('Aplikasi dapat dipasang melalui menu titik tiga browser.');
    return;
  }

  try {
    await deferredPWAInstallPrompt.prompt();
    const { outcome } = await deferredPWAInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      showToast('Terima kasih telah memasang FiNOVA!');
      deferredPWAInstallPrompt = null;
      updatePWAStatusUI();
    }
  } catch (err) {
    console.error('Error saat install PWA:', err);
  }
}

function initPWA() {
  // Service Worker Registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        // Fallback or dev mode logging
      });
    });
  }

  // Handle beforeinstallprompt (Chromium / Android / Desktop)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPWAInstallPrompt = e;
    updatePWAStatusUI();
  });

  // Handle appinstalled event
  window.addEventListener('appinstalled', () => {
    showToast('FiNOVA berhasil terpasang di perangkat Anda!');
    deferredPWAInstallPrompt = null;
    updatePWAStatusUI();
  });

  // Offline / Online Connectivity Listeners
  const offlineIndicator = document.getElementById('offline-indicator');
  function updateOnlineStatus() {
    if (!navigator.onLine) {
      if (offlineIndicator) offlineIndicator.hidden = false;
    } else {
      if (offlineIndicator) offlineIndicator.hidden = true;
    }
  }

  window.addEventListener('online', () => {
    updateOnlineStatus();
    showToast('Koneksi internet kembali normal.');
  });

  window.addEventListener('offline', () => {
    updateOnlineStatus();
  });

  updateOnlineStatus();

  // Attach button triggers
  const btnHeaderInstall = document.getElementById('btn-header-install');
  if (btnHeaderInstall) {
    btnHeaderInstall.addEventListener('click', triggerPWAInstall);
  }

  const btnBannerInstall = document.getElementById('btn-banner-install');
  if (btnBannerInstall) {
    btnBannerInstall.addEventListener('click', triggerPWAInstall);
  }

  const btnBannerDismiss = document.getElementById('btn-banner-dismiss');
  if (btnBannerDismiss) {
    btnBannerDismiss.addEventListener('click', () => {
      localStorage.setItem('pwa_banner_dismissed', 'true');
      const banner = document.getElementById('pwa-install-banner');
      if (banner) banner.hidden = true;
    });
  }

  const btnSettingsInstall = document.getElementById('btn-settings-install');
  if (btnSettingsInstall) {
    btnSettingsInstall.addEventListener('click', triggerPWAInstall);
  }

  // iOS modal buttons
  const btnCloseIOS = document.getElementById('btn-close-ios-modal');
  const btnCloseIOSGuide = document.getElementById('btn-close-ios-guide');
  if (btnCloseIOS) btnCloseIOS.addEventListener('click', closeIOSModal);
  if (btnCloseIOSGuide) btnCloseIOSGuide.addEventListener('click', closeIOSModal);

  updatePWAStatusUI();
}

// Jalankan ketika DOM siap
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
