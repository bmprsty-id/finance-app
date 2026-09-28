/**
 * FINANCE TRACKER - CORE LOGIC & PERSISTENCE
 * Sederhana, Cepat, Minimal, Tanpa Backend
 */

// ==========================================
// 1. KONSTANTA & STATE APLIKASI
// ==========================================

const STORAGE_KEY_TX = 'financeTransactions';
const STORAGE_KEY_CAT = 'financeCategories';
const STORAGE_KEY_THEME = 'finance_theme';

// Kategori Bawaan (Default Categories)
const DEFAULT_CATEGORIES = {
  income: ['Gaji', 'Driver', 'Freelance', 'Bonus', 'Penjualan', 'Lainnya'],
  expense: ['Makanan', 'Bensin', 'Transportasi', 'Tagihan', 'Belanja', 'Hiburan', 'Kesehatan', 'Lainnya']
};

// Data Sampel Awal untuk Pengguna Baru
const SAMPLE_TRANSACTIONS = [
  {
    id: 1727500000001,
    date: '2026-09-28',
    type: 'income',
    category: 'Driver',
    amount: 150000,
    note: 'Order pagi & siang'
  },
  {
    id: 1727500000002,
    date: '2026-09-28',
    type: 'expense',
    category: 'Bensin',
    amount: 50000,
    note: 'Pertalite full tank'
  },
  {
    id: 1727500000003,
    date: '2026-09-28',
    type: 'expense',
    category: 'Makanan',
    amount: 25000,
    note: 'Makan siang warteg'
  },
  {
    id: 1727500000004,
    date: '2026-09-27',
    type: 'income',
    category: 'Freelance',
    amount: 500000,
    note: 'Desain banner'
  },
  {
    id: 1727500000005,
    date: '2026-09-27',
    type: 'expense',
    category: 'Tagihan',
    amount: 150000,
    note: 'Pulsa & paket data'
  }
];

// State Global
let currentNav = 'dashboard';
let txFilterType = 'all'; // 'all' | 'income' | 'expense'
let txSearchQuery = '';
let txFilterDateFrom = '';
let txFilterDateTo = '';
let reportPeriod = 'month'; // 'today' | 'week' | 'month' | 'all'
let pendingConfirmCallback = null;
let toastTimeout = null;

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

// ==========================================
// 3. UTILITY FUNCTIONS
// ==========================================

function formatRupiah(number) {
  const num = Math.round(Number(number) || 0);
  return 'Rp' + num.toLocaleString('id-ID');
}

function formatDateDisplay(dateString) {
  if (!dateString) return '';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return `${day} ${months[monthIndex] || ''} ${year}`;
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
  const views = ['dashboard', 'add', 'transactions', 'report', 'settings'];

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
  } else if (viewName === 'report') {
    renderReport();
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
    item.className = `tx-item ${isIncome ? 'tx-income' : 'tx-expense'}`;

    item.innerHTML = `
      <div class="tx-main-info">
        <span class="tx-category">${escapeHTML(tx.category)}</span>
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

  const newTx = {
    id: Date.now(),
    date: dateVal,
    type: type,
    category: categoryVal,
    amount: Math.round(amountVal),
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

    // 2. Pencarian (kategori atau catatan)
    if (txSearchQuery) {
      const cat = (tx.category || '').toLowerCase();
      const note = (tx.note || '').toLowerCase();
      if (!cat.includes(txSearchQuery) && !note.includes(txSearchQuery)) return false;
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

  // Render per grup tanggal
  Object.keys(groupsByDate).forEach((dateKey) => {
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
      item.className = `tx-item ${isIncome ? 'tx-income' : 'tx-expense'}`;

      item.innerHTML = `
        <div class="tx-main-info">
          <span class="tx-category">${escapeHTML(tx.category)}</span>
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
// 9. VIEW 4: LAPORAN (PERIOD & BREAKDOWN)
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

  filtered.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'income') {
      totalIncome += amt;
      incomeByCat[tx.category] = (incomeByCat[tx.category] || 0) + amt;
    } else {
      totalExpense += amt;
      expenseByCat[tx.category] = (expenseByCat[tx.category] || 0) + amt;
    }
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

  // Render breakdowns
  renderCategoryBreakdownList('rep-expense-breakdown', expenseByCat, totalExpense, 'expense');
  renderCategoryBreakdownList('rep-income-breakdown', incomeByCat, totalIncome, 'income');
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

// ==========================================
// 10. VIEW 5: PENGATURAN (BACKUP, RESTORE, CSV)
// ==========================================

function exportCSV() {
  const transactions = getStoredTransactions();
  if (transactions.length === 0) {
    showToast('Tidak ada data transaksi untuk diexport.');
    return;
  }

  const headers = ['Tanggal', 'Tipe', 'Kategori', 'Nominal', 'Catatan'];
  const rows = transactions.map((tx) => [
    `"${tx.date}"`,
    `"${tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}"`,
    `"${(tx.category || '').replace(/"/g, '""')}"`,
    tx.amount,
    `"${(tx.note || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `finance-transactions-${getTodayString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast('File CSV berhasil diunduh!');
}

function backupJSON() {
  const transactions = getStoredTransactions();
  const categories = getStoredCategories();

  const backupData = {
    appName: 'Finance Tracker',
    version: 1,
    exportedAt: new Date().toISOString(),
    transactions,
    categories
  };

  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `finance-backup-${getTodayString()}.json`);
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

        showToast(`Berhasil memulihkan ${data.transactions.length} transaksi!`);
        renderDashboard();
        renderTransactionsList();
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

function openConfirmModal({ title, description, confirmText, onConfirm }) {
  const modal = document.getElementById('confirmation-modal');
  const titleEl = document.getElementById('modal-title');
  const descEl = document.getElementById('modal-description');
  const confirmBtn = document.getElementById('btn-modal-confirm');

  if (titleEl) titleEl.textContent = title;
  if (descEl) descEl.textContent = description;
  if (confirmBtn) confirmBtn.textContent = confirmText || 'Ya, Lanjutkan';

  pendingConfirmCallback = onConfirm;
  modal.hidden = false;
  modal.classList.add('is-open');
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
      radioIncome.addEventListener('change', () => {
        if (radioIncome.checked) {
          labelIncome.classList.add('is-active');
          labelExpense.classList.remove('is-active');
          populateCategorySelect('category', 'income');
        }
      });

      radioExpense.addEventListener('change', () => {
        if (radioExpense.checked) {
          labelExpense.classList.add('is-active');
          labelIncome.classList.remove('is-active');
          populateCategorySelect('category', 'expense');
        }
      });
    }

    // Default kategori
    populateCategorySelect('category', 'income');
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
        description: 'Tindakan ini akan menghapus seluruh data transaksi dari browser. Pastikan sudah melakukan backup.',
        confirmText: 'Hapus Semua',
        onConfirm: () => {
          localStorage.removeItem(STORAGE_KEY_TX);
          localStorage.setItem('finance_app_visited', 'true');
          showToast('Semua data transaksi telah dihapus.');
          renderDashboard();
          renderTransactionsList();
          renderReport();
        }
      });
    });
  }

  const btnOpenCatModal = document.getElementById('btn-open-category-modal');
  if (btnOpenCatModal) btnOpenCatModal.addEventListener('click', openCategoryModal);

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
      editRadioIncome.addEventListener('change', () => {
        if (editRadioIncome.checked) {
          editLabelIncome.classList.add('is-active');
          editLabelExpense.classList.remove('is-active');
          populateCategorySelect('edit-category', 'income');
        }
      });

      editRadioExpense.addEventListener('change', () => {
        if (editRadioExpense.checked) {
          editLabelExpense.classList.add('is-active');
          editLabelIncome.classList.remove('is-active');
          populateCategorySelect('edit-category', 'expense');
        }
      });
    }
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
      catRadioIncome.addEventListener('change', () => {
        if (catRadioIncome.checked) {
          catLabelIncome.classList.add('is-active');
          catLabelExpense.classList.remove('is-active');
        }
      });

      catRadioExpense.addEventListener('change', () => {
        if (catRadioExpense.checked) {
          catLabelExpense.classList.add('is-active');
          catLabelIncome.classList.remove('is-active');
        }
      });
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
    }
  });

  document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeConfirmModal();
        closeEditModal();
        closeCategoryModal();
      }
    });
  });

  // 8. Initial Render
  closeConfirmModal();
  closeEditModal();
  closeCategoryModal();
  closeIOSModal();
  initPWA();
  renderDashboard();
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
      showToast('Terima kasih telah memasang Finance Tracker!');
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
    showToast('Finance Tracker berhasil terpasang di perangkat Anda!');
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
