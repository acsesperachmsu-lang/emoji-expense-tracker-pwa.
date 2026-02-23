/**
 * Emoji Expense Tracker - Main Script
 * Uses only vanilla JavaScript. Data saved in localStorage.
 */

// ========== DATA STORAGE KEYS ==========
const STORAGE_KEYS = {
  balance: 'expense_tracker_balance',
  total_added: 'expense_tracker_total_added',
  expenses: 'expense_tracker_expenses',
  borrows: 'expense_tracker_borrows',
  presets: 'expense_tracker_presets'
};

// ========== PRESET EXPENSES (quick-add) ==========
var PRESET_EXPENSES = [
  { emoji: '🍔', name: 'Food' },
  { emoji: '🧋', name: 'Milk Tea' },
  { emoji: '☕', name: 'Coffee' },
  { emoji: '🎮', name: 'Game Load' },
  { emoji: '📚', name: 'Books' },
  { emoji: '🚕', name: 'Transport' },
  { emoji: '🍕', name: 'Snacks' },
  { emoji: '🎬', name: 'Entertainment' },
  { emoji: '🛒', name: 'Groceries' },
  { emoji: '💊', name: 'Medicine' },
  { emoji: '📱', name: 'Load / Data' },
  { emoji: '✏️', name: 'School' }
];

// Custom presets saved by the user (merged into PRESET_EXPENSES on load)
var customPresets = [];

// ========== STATE ==========
let balance = 0;
let total_added = 0;
let expenses = [];
let borrows = [];

// ========== DOM ELEMENTS ==========
const balanceDisplay = document.getElementById('balanceDisplay');
const addMoneyBtn = document.getElementById('addMoneyBtn');
const addExpenseBtn = document.getElementById('addExpenseBtn');
const addBorrowBtn = document.getElementById('addBorrowBtn');
const viewHistoryBtn = document.getElementById('viewHistoryBtn');

const addMoneyModal = document.getElementById('addMoneyModal');
const addMoneyInput = document.getElementById('addMoneyInput');
const cancelAddMoney = document.getElementById('cancelAddMoney');
const saveAddMoney = document.getElementById('saveAddMoney');

const expenseModal = document.getElementById('expenseModal');
const expenseEmoji = document.getElementById('expenseEmoji');
const expenseName = document.getElementById('expenseName');
const expenseAmount = document.getElementById('expenseAmount');
const cancelExpense = document.getElementById('cancelExpense');
const saveExpense = document.getElementById('saveExpense');

const borrowModal = document.getElementById('borrowModal');
const borrowEmoji = document.getElementById('borrowEmoji');
const borrowPerson = document.getElementById('borrowPerson');
const borrowAmount = document.getElementById('borrowAmount');
const cancelBorrow = document.getElementById('cancelBorrow');
const saveBorrow = document.getElementById('saveBorrow');

const paymentModal = document.getElementById('paymentModal');
const paymentModalHint = document.getElementById('paymentModalHint');
const paymentAmountInput = document.getElementById('paymentAmountInput');
const cancelPayment = document.getElementById('cancelPayment');
const savePayment = document.getElementById('savePayment');

const historyScreen = document.getElementById('historyScreen');
const historyList = document.getElementById('historyList');
const closeHistory = document.getElementById('closeHistory');
const insightsScreen = document.getElementById('insightsScreen');
const closeInsights = document.getElementById('closeInsights');
const viewInsightsBtn = document.getElementById('viewInsightsBtn');
const insightsStats = document.getElementById('insightsStats');
// Pie chart elements
const pieChartWrap = document.getElementById('pieChartWrap');
const pieChart = document.getElementById('pieChart');
const pieTooltip = document.getElementById('pieTooltip');
const pieLegend = document.getElementById('pieLegend');
const expenseDateHint = document.getElementById('expenseDateHint');
const quickAddGrid = document.getElementById('quickAddGrid');
const amountChips = document.getElementById('amountChips');
const resetAppBtn = document.getElementById('resetAppBtn');

// ========== LOAD DATA FROM LOCAL STORAGE ==========
function loadData() {
  try {
    const savedBalance = localStorage.getItem(STORAGE_KEYS.balance);
    const savedTotalAdded = localStorage.getItem(STORAGE_KEYS.total_added);
    const savedExpenses = localStorage.getItem(STORAGE_KEYS.expenses);
    const savedBorrows = localStorage.getItem(STORAGE_KEYS.borrows);
    const savedPresets = localStorage.getItem(STORAGE_KEYS.presets);

    if (savedBalance !== null) balance = parseFloat(savedBalance) || 0;
    if (savedTotalAdded !== null) total_added = parseFloat(savedTotalAdded) || 0;
    if (savedExpenses) expenses = JSON.parse(savedExpenses);
    if (savedBorrows) {
      borrows = JSON.parse(savedBorrows);
      borrows.forEach(function (b) {
        if (b.paidBack === undefined) b.paidBack = b.paid ? b.amount : 0;
      });
    }
    if (savedPresets) {
      try {
        customPresets = JSON.parse(savedPresets) || [];
        if (Array.isArray(customPresets) && customPresets.length > 0) {
          PRESET_EXPENSES = PRESET_EXPENSES.concat(customPresets);
        }
      } catch (e) {
        customPresets = [];
      }
    }
    if (total_added === 0 && (balance > 0 || expenses.length > 0)) {
      total_added = balance + getTotalSpent();
    }
  } catch (e) {
    console.warn('Could not load saved data:', e);
  }
  updateBalanceDisplay();
}

// ========== SAVE DATA TO LOCAL STORAGE ==========
function saveData() {
  try {
    localStorage.setItem(STORAGE_KEYS.balance, String(balance));
    localStorage.setItem(STORAGE_KEYS.total_added, String(total_added));
    localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(expenses));
    localStorage.setItem(STORAGE_KEYS.borrows, JSON.stringify(borrows));
  } catch (e) {
    console.warn('Could not save data:', e);
  }
}

// ========== UPDATE BALANCE DISPLAY ==========
function updateBalanceDisplay() {
  const text = '₱' + formatNumber(balance);
  balanceDisplay.textContent = text;
}

// Format number with commas (e.g. 4850 -> 4,850)
function formatNumber(num) {
  return Number(num).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// ========== ADD MONEY ==========
function openAddMoneyModal() {
  addMoneyInput.value = '';
  addMoneyModal.classList.add('show');
  addMoneyInput.focus();
}

function closeAddMoneyModal() {
  addMoneyModal.classList.remove('show');
}

function saveAddMoneyHandler() {
  const value = parseFloat(addMoneyInput.value);
  if (isNaN(value) || value <= 0) {
    alert('Butang anay valid nga amount (dapat sobra 0).');
    return;
  }
  balance += value;
  total_added += value;
  saveData();
  updateBalanceDisplay();
  closeAddMoneyModal();
}

// ========== ADD EXPENSE ==========
// Open with optional preset (emoji + name) for quick-add. Date is automatic from phone.
function openExpenseModal(presetEmoji, presetName) {
  expenseEmoji.value = presetEmoji !== undefined ? presetEmoji : '';
  expenseName.value = presetName !== undefined ? presetName : '';
  expenseAmount.value = '';
  var now = new Date();
  var dateStr = now.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  if (expenseDateHint) expenseDateHint.textContent = 'Ma-rekord sa ' + dateStr;
  expenseModal.classList.add('show');
  setTimeout(function () { expenseAmount.focus(); }, 100);
}

function buildQuickAddButtons() {
  if (!quickAddGrid) return;
  quickAddGrid.innerHTML = '';
  PRESET_EXPENSES.forEach(function (preset) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quick-add-btn';
    btn.innerHTML = '<span class="quick-add-emoji">' + preset.emoji + '</span><span class="quick-add-label">' + escapeHtml(preset.name) + '</span>';
    // normal tap: open expense modal for this preset
    var longPressFired = false;
    btn.addEventListener('click', function () {
      if (longPressFired) {
        longPressFired = false;
        return;
      }
      openExpenseModal(preset.emoji, preset.name);
    });

    // long-press: ask to remove custom preset icon
    var pressTimer = null;
    function startPress() {
      if (pressTimer !== null) return;
      btn.classList.add('deleting');
      pressTimer = setTimeout(function () {
        pressTimer = null;
        longPressFired = true;
        tryRemovePresetIcon(preset.emoji, preset.name);
      }, 600);
    }
    function cancelPress() {
      if (pressTimer !== null) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
      btn.classList.remove('deleting');
    }
    btn.addEventListener('mousedown', startPress);
    btn.addEventListener('touchstart', startPress);
    ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(function (ev) {
      btn.addEventListener(ev, cancelPress);
    });

    quickAddGrid.appendChild(btn);
  });
}

function closeExpenseModal() {
  expenseModal.classList.remove('show');
}

function saveExpenseHandler() {
  const emoji = (expenseEmoji.value || '📌').trim();
  const name = (expenseName.value || 'Expense').trim();
  const amount = parseFloat(expenseAmount.value);

  if (isNaN(amount) || amount < 0) {
    alert('Butang anay valid nga amount sang gasto.');
    return;
  }

  // If this is a new custom gasto, remember it as a preset for "Dali Idagdag"
  maybeAddPresetFromExpense(emoji, name);

  const expense = {
    id: Date.now(),
    emoji: emoji || '📌',
    name: name || 'Expense',
    amount: amount,
    date: new Date().toISOString()
  };

  expenses.push(expense);
  balance = balance - amount;
  saveData();
  updateBalanceDisplay();
  closeExpenseModal();
}

// Helper: add a new quick-add preset from a custom expense if it doesn't already exist
function maybeAddPresetFromExpense(emoji, name) {
  if (!emoji || !name) return;
  var exists = PRESET_EXPENSES.some(function (p) {
    return p.emoji === emoji && p.name === name;
  });
  if (exists) return;

  var preset = { emoji: emoji, name: name };
  PRESET_EXPENSES.push(preset);
  customPresets.push(preset);
  try {
    localStorage.setItem(STORAGE_KEYS.presets, JSON.stringify(customPresets));
  } catch (e) {
    // ignore storage errors
  }
  buildQuickAddButtons();
}

// Long-press helper: remove a custom Dali Idagdag icon (preset)
function tryRemovePresetIcon(emoji, name) {
  // Only allow removing presets that were created by the user
  var isCustom = customPresets.some(function (p) {
    return p.emoji === emoji && p.name === name;
  });
  if (!isCustom) {
    alert('Ini nga preset built-in na, indi pwede i-delete. Pero pwede ka gihapon maghimo kag mag-delete sang imo kaugalingon nga presets.');
    return;
  }
  var ok = confirm('Kuhaon gid naton ni nga Dali Idagdag icon (' + emoji + ' ' + name + ')?');
  if (!ok) return;

  PRESET_EXPENSES = PRESET_EXPENSES.filter(function (p) {
    return !(p.emoji === emoji && p.name === name);
  });
  customPresets = customPresets.filter(function (p) {
    return !(p.emoji === emoji && p.name === name);
  });
  try {
    localStorage.setItem(STORAGE_KEYS.presets, JSON.stringify(customPresets));
  } catch (e) {
    // ignore storage errors
  }
  // remove any visual delete state
  if (quickAddGrid) {
    quickAddGrid.querySelectorAll('.quick-add-btn').forEach(function (btn) {
      btn.classList.remove('deleting');
    });
  }
  buildQuickAddButtons();
}

// ========== ADD BORROW ==========
function openBorrowModal() {
  borrowEmoji.value = '🤝';
  borrowPerson.value = '';
  borrowAmount.value = '';
  borrowModal.classList.add('show');
  borrowPerson.focus();
}

function closeBorrowModal() {
  borrowModal.classList.remove('show');
}

function saveBorrowHandler() {
  const emoji = (borrowEmoji.value || '🤝').trim();
  const person = (borrowPerson.value || 'Someone').trim();
  const amount = parseFloat(borrowAmount.value);

  if (isNaN(amount) || amount < 0) {
    alert('Butang anay valid nga amount sang utang.');
    return;
  }

  const borrow = {
    id: Date.now(),
    emoji: emoji || '🤝',
    person: person || 'Someone',
    amount: amount,
    paidBack: 0,
    paid: false,
    date: new Date().toISOString()
  };

  borrows.push(borrow);
  balance -= amount;
  saveData();
  updateBalanceDisplay();
  closeBorrowModal();
}

// ========== RECORD PAYMENT (partial) ==========
var _paymentBorrowId = null;

function openPaymentModal(borrowId) {
  var b = borrows.find(function (x) { return x.id === borrowId; });
  if (!b) return;
  _paymentBorrowId = borrowId;
  if (paymentModalHint) paymentModalHint.textContent = 'Pila ang ginbayad ni ' + b.person + '?';
  if (paymentAmountInput) {
    paymentAmountInput.value = '';
    paymentAmountInput.placeholder = 'Max ₱' + formatNumber(b.amount - b.paidBack);
  }
  paymentModal.classList.add('show');
  if (paymentAmountInput) paymentAmountInput.focus();
}

function closePaymentModal() {
  paymentModal.classList.remove('show');
  _paymentBorrowId = null;
}

function savePaymentHandler() {
  if (_paymentBorrowId == null) return;
  var b = borrows.find(function (x) { return x.id === _paymentBorrowId; });
  if (!b) return;
  var amt = parseFloat(paymentAmountInput.value);
  if (isNaN(amt) || amt <= 0) {
    alert('Butang anay valid nga amount sang bayad.');
    return;
  }
  var remaining = b.amount - b.paidBack;
  if (amt > remaining) amt = remaining;
  balance += amt;
  b.paidBack = (b.paidBack || 0) + amt;
  if (b.paidBack >= b.amount) {
    b.paid = true;
  }
  saveData();
  updateBalanceDisplay();
  closePaymentModal();
  renderHistory();
}

// ========== MARK BORROW FULLY PAID (checklist) ==========
function markBorrowPaid(id) {
  var b = borrows.find(function (x) { return x.id === id; });
  if (!b) return;
  var remaining = b.amount - (b.paidBack || 0);
  if (remaining > 0) {
    balance += remaining;
    b.paidBack = b.amount;
  }
  b.paid = true;
  saveData();
  updateBalanceDisplay();
  renderHistory();
}

// ========== INSIGHTS (separate section) ==========
function getTotalSpent() {
  return expenses.reduce(function (sum, e) { return sum + e.amount; }, 0);
}

function getBorrowStats() {
  var total = borrows.reduce(function (sum, b) { return sum + b.amount; }, 0);
  var unpaid = borrows.reduce(function (sum, b) {
    var pb = b.paidBack || 0;
    return sum + (b.amount - pb);
  }, 0);
  return { total: total, unpaid: unpaid, count: borrows.length };
}

function getCategoryBreakdown() {
  var byKey = {};
  expenses.forEach(function (e) {
    var key = e.emoji + ' ' + e.name;
    if (!byKey[key]) byKey[key] = { emoji: e.emoji, name: e.name, amount: 0 };
    byKey[key].amount += e.amount;
  });
  return Object.keys(byKey)
    .map(function (k) { return byKey[k]; })
    .sort(function (a, b) { return b.amount - a.amount; });
}

var PIE_COLORS = ['#f9a8d4', '#c4b5fd', '#a7f3d0', '#fed7aa', '#bae6fd', '#fcd34d', '#a78bfa', '#f472b6'];

function drawPieChart(categories, totalSpent, totalAdded) {
  if (!pieChart || categories.length === 0) return;
  var ctx = pieChart.getContext('2d');
  var w = pieChart.width;
  var h = pieChart.height;
  var cx = w / 2;
  var cy = h / 2;
  var r = Math.min(w, h) / 2 - 8;
  ctx.clearRect(0, 0, w, h);
  var start = -Math.PI / 2;
  var segments = [];
  for (var i = 0; i < categories.length; i++) {
    var pct = totalSpent > 0 ? categories[i].amount / totalSpent : 0;
    var angle = pct * Math.PI * 2;
    segments.push({
      start: start,
      end: start + angle,
      category: categories[i],
      pctOfSpent: pct * 100,
      pctOfAllowance: totalAdded > 0 ? (categories[i].amount / totalAdded) * 100 : 0
    });
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + angle);
    ctx.closePath();
    ctx.fillStyle = PIE_COLORS[i % PIE_COLORS.length];
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    start += angle;
  }
  pieChart._segments = segments;
  pieChart._cx = cx;
  pieChart._cy = cy;
  pieChart._r = r;
}

function getSegmentAt(x, y) {
  if (!pieChart || !pieChart._segments) return -1;
  var dx = x - pieChart._cx;
  var dy = y - pieChart._cy;
  var r = Math.sqrt(dx * dx + dy * dy);
  if (r > pieChart._r) return -1;
  var angle = Math.atan2(dy, dx);
  angle = angle + Math.PI / 2;
  if (angle < 0) angle += Math.PI * 2;
  for (var i = 0; i < pieChart._segments.length; i++) {
    var s = pieChart._segments[i];
    var a = (angle + Math.PI * 2) % (Math.PI * 2);
    var segStart = (s.start + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
    var segEnd = (s.end + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
    if (segStart <= segEnd && a >= segStart && a <= segEnd) return i;
    if (segStart > segEnd && (a >= segStart || a <= segEnd)) return i;
  }
  return -1;
}

function showPieTooltip(segmentIndex) {
  if (!pieTooltip || !pieChart._segments || segmentIndex < 0) {
    if (pieTooltip) pieTooltip.textContent = '';
    return;
  }
  var s = pieChart._segments[segmentIndex];
  var name = s.category.emoji + ' ' + s.category.name;
  var pct = s.pctOfAllowance.toFixed(1);
  pieTooltip.textContent = name + ' — ' + pct + '% sang kwarta';
  pieTooltip.classList.add('show');
}

function hidePieTooltip() {
  if (pieTooltip) {
    pieTooltip.textContent = '';
    pieTooltip.classList.remove('show');
  }
}

function bindPieChartEvents() {
  if (!pieChart || !pieChart._segments) return;
  function onMove(e) {
    var rect = pieChart.getBoundingClientRect();
    var x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    var y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    var scale = pieChart.width / rect.width;
    var idx = getSegmentAt(x * scale, y * scale);
    showPieTooltip(idx);
  }
  function onLeave() { hidePieTooltip(); }
  pieChart.onmousemove = onMove;
  pieChart.onmouseleave = onLeave;
  pieChart.ontouchstart = onMove;
  pieChart.ontouchmove = onMove;
  pieChart.ontouchend = onLeave;
}

function renderInsightsSection() {
  var spent = getTotalSpent();
  var borrowStats = getBorrowStats();
  var categories = getCategoryBreakdown(); // [{emoji, name, amount}, ...]

  // Percent used (gastos only)
  var percentUsed = total_added > 0 ? (spent / total_added) * 100 : 0;
  percentUsed = Math.min(100, Math.round(percentUsed));

  // Highest expense category
  var highest = null;
  if (categories.length > 0) {
    highest = categories.reduce(function (best, c) {
      return !best || c.amount > best.amount ? c : best;
    }, null);
  }

  // Insights summary rows
  if (insightsStats) {
    var html = '';
    html += '<div class="insight-row"><span class="insight-mini-emoji">🍅</span><span class="insight-mini-label">Total nagasto</span><span class="insight-mini-value">₱' + formatNumber(spent) + '</span></div>';
    html += '<div class="insight-row"><span class="insight-mini-emoji">📄</span><span class="insight-mini-label">Pila ka gastos</span><span class="insight-mini-value">' + expenses.length + '</span></div>';
    if (total_added > 0) {
      html += '<div class="insight-row"><span class="insight-mini-emoji">📊</span><span class="insight-mini-label">% sang allowance nga nagamit</span><span class="insight-mini-value">' + percentUsed + '%</span></div>';
      html += '<div class="progress-bar progress-bar-inline"><div class="progress-fill" style="width:' + percentUsed + '%"></div></div>';
    }
    html += '<div class="insight-row"><span class="insight-mini-emoji">🤝</span><span class="insight-mini-label">Total utang</span><span class="insight-mini-value">₱' + formatNumber(borrowStats.total) + ' (₱' + formatNumber(borrowStats.unpaid) + ' wala pa nabayad)</span></div>';

    // Pinakadako nga gasto
    if (highest) {
      html += '<div class="insight-row"><span class="insight-mini-emoji">' + escapeHtml(highest.emoji) + '</span><span class="insight-mini-label">Pinakadako mong gasto</span><span class="insight-mini-value">₱' + formatNumber(highest.amount) + ' (' + escapeHtml(highest.name) + ')</span></div>';
    }

    if (expenses.length === 0 && borrows.length === 0) {
      html = '<p class="empty-insights-inline">Wala pa data. I-add anay gasto kag utang para may ara ta stats. 🌸</p>';
    }

    insightsStats.innerHTML = html;
  }

  // Category pie chart
  if (!pieChartWrap || !pieChart || !pieLegend) return;

  if (categories.length > 0 && spent > 0 && total_added > 0) {
    drawPieChart(categories, spent, total_added);
    bindPieChartEvents();
    pieChartWrap.style.display = 'block';

    var leg = '';
    categories.forEach(function (c, i) {
      var pct = total_added > 0 ? ((c.amount / total_added) * 100).toFixed(1) : '0';
      leg += '<div class="pie-legend-item" data-index="' + i + '"><span class="pie-legend-dot" style="background:' + PIE_COLORS[i % PIE_COLORS.length] + '"></span><span class="pie-legend-label">' + escapeHtml(c.emoji + ' ' + c.name) + '</span><span class="pie-legend-pct">' + pct + '%</span></div>';
    });
    pieLegend.innerHTML = leg;

    pieLegend.querySelectorAll('.pie-legend-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var idx = parseInt(item.getAttribute('data-index'), 10);
        showPieTooltip(idx);
      });
    });
  } else {
    pieChartWrap.style.display = 'none';
    if (pieLegend) pieLegend.innerHTML = '';
  }
}

// Reset all app data (balance, gastos, utang, custom presets)
function resetAppData() {
  var ok = confirm('Sure ka gid nga i-reset ta tanan? Maklear tanan balance, gastos, utang kag presets. Di na ni mabalik ha.');
  if (!ok) return;
  try {
    localStorage.clear();
  } catch (e) {
    // ignore
  }
  location.reload();
}

// ========== VIEW HISTORY ==========
function openHistory() {
  renderHistory();
  historyScreen.classList.add('show');
}

function closeHistoryScreen() {
  historyScreen.classList.remove('show');
}

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function renderHistory() {
  // Separate expenses and borrows, each sorted by date (newest first)
  const expenseEntries = expenses
    .map(function (e) { return { type: 'expense', data: e, date: e.date }; })
    .sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
  const borrowEntries = borrows
    .map(function (b) { return { type: 'borrow', data: b, date: b.date }; })
    .sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

  if (expenseEntries.length === 0 && borrowEntries.length === 0) {
    historyList.innerHTML = '<p class="empty-history">Wala pa gastos kag utang.<br>I-add anay sa baba. 😄</p>';
    return;
  }

  historyList.innerHTML = '';

  function appendExpenseItem(entry) {
    const div = document.createElement('div');
    div.className = 'history-item expense';
    const e = entry.data;
    div.innerHTML =
      '<div class="item-left">' +
        '<span class="item-emoji">' + escapeHtml(e.emoji) + '</span>' +
        '<div class="item-details">' +
          '<div class="item-title">' + escapeHtml(e.name) + '</div>' +
          '<div class="item-date">' + formatDate(e.date) + '</div>' +
        '</div>' +
      '</div>' +
      '<span class="item-amount expense-amount">- ₱' + formatNumber(e.amount) + '</span>';
    historyList.appendChild(div);
  }

  function appendBorrowItem(entry) {
    const div = document.createElement('div');
    div.className = 'history-item borrow';
    const b = entry.data;
    const paidBack = b.paidBack || 0;
    const isFullyPaid = paidBack >= b.amount;
    const remaining = b.amount - paidBack;
    const title = b.person + ' nangutang';
    div.classList.add('borrow-row');
    if (isFullyPaid) div.classList.add('paid');
    var nameClass = 'borrow-name' + (isFullyPaid ? ' paid' : '');
    var checkIcon = isFullyPaid ? '☑' : '☐';
    var statusHtml = '';
    if (isFullyPaid) {
      statusHtml = '<span class="item-status paid">Bayad na</span>';
    } else {
      statusHtml = '<div class="borrow-actions">' +
        '<span class="item-status unpaid">₱' + formatNumber(remaining) + ' nabilin</span>' +
        '<button type="button" class="btn-record-payment" data-borrow-id="' + b.id + '">Record Bayad</button>' +
        '<button type="button" class="btn-mark-paid" data-borrow-id="' + b.id + '">Mark Bayad</button>' +
        '</div>';
    }
    div.innerHTML =
      '<div class="item-left">' +
        '<span class="borrow-checkbox" data-borrow-id="' + b.id + '" aria-label="' + (isFullyPaid ? 'Bayad na' : 'Mark Bayad') + '">' + checkIcon + '</span>' +
        '<span class="item-emoji">' + escapeHtml(b.emoji) + '</span>' +
        '<div class="item-details">' +
          '<div class="item-title"><span class="' + nameClass + '">' + escapeHtml(title) + '</span></div>' +
          '<div class="item-date">' + formatDate(b.date) + '</div>' +
          '<span class="borrow-progress">₱' + formatNumber(paidBack) + ' / ₱' + formatNumber(b.amount) + '</span>' +
          statusHtml +
        '</div>' +
      '</div>' +
      '<span class="item-amount">₱' + formatNumber(b.amount) + '</span>';

    historyList.appendChild(div);
  }

  // Expenses section
  if (expenseEntries.length > 0) {
    const header = document.createElement('h3');
    header.className = 'history-section-title';
    header.textContent = 'Mga gastos';
    historyList.appendChild(header);
    expenseEntries.forEach(appendExpenseItem);
  }

  // Borrows section
  if (borrowEntries.length > 0) {
    const header = document.createElement('h3');
    header.className = 'history-section-title';
    header.textContent = 'Mga utang';
    historyList.appendChild(header);
    borrowEntries.forEach(appendBorrowItem);
  }

  historyList.querySelectorAll('.btn-mark-paid').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const id = parseInt(btn.getAttribute('data-borrow-id'), 10);
      markBorrowPaid(id);
    });
  });
  historyList.querySelectorAll('.btn-record-payment').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const id = parseInt(btn.getAttribute('data-borrow-id'), 10);
      openPaymentModal(id);
    });
  });
  historyList.querySelectorAll('.borrow-checkbox').forEach(function (el) {
    el.addEventListener('click', function () {
      const id = parseInt(el.getAttribute('data-borrow-id'), 10);
      var b = borrows.find(function (x) { return x.id === id; });
      if (b && (b.paidBack || 0) < b.amount) markBorrowPaid(id);
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ========== EVENT LISTENERS ==========
if (addMoneyBtn) addMoneyBtn.addEventListener('click', openAddMoneyModal);
if (cancelAddMoney) cancelAddMoney.addEventListener('click', closeAddMoneyModal);
if (saveAddMoney) saveAddMoney.addEventListener('click', saveAddMoneyHandler);

addExpenseBtn.addEventListener('click', function () { openExpenseModal(); });
cancelExpense.addEventListener('click', closeExpenseModal);
saveExpense.addEventListener('click', saveExpenseHandler);

// Amount chips: tap to set amount in expense modal
if (amountChips) {
  amountChips.querySelectorAll('.chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      var amt = chip.getAttribute('data-amount');
      expenseAmount.value = amt;
    });
  });
}

addBorrowBtn.addEventListener('click', openBorrowModal);
cancelBorrow.addEventListener('click', closeBorrowModal);
saveBorrow.addEventListener('click', saveBorrowHandler);

function openInsights() {
  renderInsightsSection();
  insightsScreen.classList.add('show');
}

function closeInsightsScreen() {
  insightsScreen.classList.remove('show');
}

if (viewInsightsBtn) viewInsightsBtn.addEventListener('click', openInsights);
if (closeInsights) closeInsights.addEventListener('click', closeInsightsScreen);
if (viewHistoryBtn) viewHistoryBtn.addEventListener('click', openHistory);
if (closeHistory) closeHistory.addEventListener('click', closeHistoryScreen);

if (cancelPayment) cancelPayment.addEventListener('click', closePaymentModal);
if (savePayment) savePayment.addEventListener('click', savePaymentHandler);
if (resetAppBtn) resetAppBtn.addEventListener('click', resetAppData);

// Close modals when clicking backdrop
[addMoneyModal, expenseModal, borrowModal, paymentModal].filter(Boolean).forEach(function (modal) {
  modal.addEventListener('click', function (e) {
    if (e.target === modal) {
      modal.classList.remove('show');
    }
  });
});

// ========== REGISTER SERVICE WORKER (for PWA / offline) ==========
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    document.body.classList.add('app-ready');
    navigator.serviceWorker.register('./service-worker.js').then(function () {
      // Registration worked
    }).catch(function () {
      // Registration failed (e.g. not served over HTTPS or file://)
    });
  });
}

// ========== START APP ==========
loadData();
buildQuickAddButtons();