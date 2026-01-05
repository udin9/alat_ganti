// Data Store
let inventory = [];
let itemIdCounter = 1;
let equipment = [];
let equipmentIdCounter = 1;
let requests = [];
let requestIdCounter = 1;
let budget = 0;
let budgetUsed = 0;

// Load data from localStorage on page load
window.addEventListener('DOMContentLoaded', () => {
    loadDataFromStorage();
    updateDashboard();
    // Inventory
    displayInventory();
    // Event listeners
    setupEventListeners();
    setupEquipmentListeners();
    // Requests and import
    displayRequests();
    setupImportListeners();
    setupRequestModalListeners();
    setupUsageModalListeners();
    displayEquipmentTable();
    displayUsage();
    updateBudgetDisplay();
    // Ensure only dashboard is visible on initial load
    showSection('dashboard');
});

// Setup Equipment Listeners
function setupEquipmentListeners() {
    const modal = document.getElementById('equipmentModal');
    const openBtn = document.getElementById('openAddEquipmentForm');
    const closeBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelModalBtn');
    const form = document.getElementById('addEquipmentForm');

    if (!form || !modal || !openBtn) {
        console.error('Required modal elements not found');
        return;
    }

    // Open modal button
    openBtn.addEventListener('click', () => {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    });

    // Close modal function
    const closeModal = () => {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        form.reset();
        document.getElementById('EQuantity').value = '1';
        document.getElementById('modalTitle').textContent = '➕ Tambah Peralatan Baru';
        delete form.dataset.editingId;
    };

    // Close button
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    // Cancel button
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }

    // Close on outside click
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Form submission
    form.addEventListener('submit', handleAddEquipment);
}

// Setup import and request listeners
function setupImportListeners() {
    const importBtn = document.getElementById('importEquipmentBtn');
    const importInput = document.getElementById('importEquipmentFile');
    const openReqBtn = document.getElementById('openRequestForm');

    if (importBtn && importInput) {
        importBtn.addEventListener('click', () => importEquipmentFile(importInput.files[0]));
    }

    // opening of request form handled by modal listener
}

function setupRequestModalListeners() {
    const openReqBtn = document.getElementById('openRequestForm');
    const modal = document.getElementById('requestModal');
    const closeBtn = document.getElementById('closeRequestModal');
    const cancelBtn = document.getElementById('cancelRequestBtn');
    const form = document.getElementById('addRequestForm');

    if (!openReqBtn || !modal || !form) return;

    openReqBtn.addEventListener('click', () => {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        form.reset();
        document.getElementById('requestModalTitle').textContent = '➕ 1Tambah Permohonan'; // <!-- permohonan alat ganti (user) form dalam burger permohonan -->
        delete form.dataset.editingId;
    });

    closeBtn?.addEventListener('click', closeRequestModal);
    cancelBtn?.addEventListener('click', closeRequestModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeRequestModal(); });

    form.addEventListener('submit', handleAddRequest);

    function closeRequestModal() {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        form.reset();
        delete form.dataset.editingId;
    }
}


// Handle Add Equipment - ada sambungan ke section senarai alat ganti form edit add dan table
function handleAddEquipment(e) {
    e.preventDefault();

    const form = document.getElementById('addEquipmentForm');
    const editingId = form.dataset.editingId ? parseInt(form.dataset.editingId) : null;

    const equipmentData = {
        name: document.getElementById('komp1').value.trim(),
        category: document.getElementById('NamaPeralatan').value,
        model: document.getElementById('NamaModel').value.trim(),
        quantity: parseInt(document.getElementById('EQuantity').value),      
        notaganti: document.getElementById('CatitAlatGanti').value.trim(),
        namamodell: document.getElementById('NamaModel').value,
        dateAdded: new Date().toLocaleDateString('id-ID')
    };

    if (editingId) {
        // Update existing equipment
        const itemIndex = equipment.findIndex(e => e.id == editingId);
        if (itemIndex > -1) {
            equipment[itemIndex] = {
                ...equipment[itemIndex],
                ...equipmentData
            };
            showNotification('✓ Peralatan berhasil diubah!', 'success');
        }
    } else {
        // Add new equipment
        const newEquipment = {
            id: equipmentIdCounter++,
            ...equipmentData
        };
        equipment.push(newEquipment);
        showNotification('✓ Selesai!! Peralatan berhasil ditambahkan!', 'success');
    }

    saveDataToStorage();
    
    // Update category filter dengan kategori baru jika ada
    updateCategoryFilters();
    
    // Close modal
    const modal = document.getElementById('equipmentModal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    
    // Reset form
    form.reset();
    document.getElementById('EQuantity').value = '1';
    document.getElementById('modalTitle').textContent = '➕ Tambah Peralatan Baru';
    delete form.dataset.editingId;
    
    updateDashboard();
    displayEquipmentTable();
}

// Import equipment from CSV (simple parser)_Digunakan untuk upload file ke dalam senarai alat ganti
// ni dalam grup senarai alat ganti
function importEquipmentCSV(file) {
    if (!file) {
        showNotification('⚠️ Pilih fail CSV terlebih dahulu.', 'warning');
        return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
        const text = evt.target.result;
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
        let added = 0;
        for (let i = 0; i < lines.length; i++) {
            const row = parseCSVLine(lines[i]);
            // Expecting: name,category,quantity,icon,condition,model,location,notes
            if (!row[0]) continue;
            const newEquipment = {
                id: equipmentIdCounter++,
                name: row[0] || 'Unknown',
                category: row[1] || 'General',
                quantity: parseInt(row[2]) || 1,
                iconn: row[3] || '📦', //icon -- iconn
                condition: row[4] || 'Baik',
                model: row[5] || '',
                location: row[6] || '',
                notes: row[7] || '',
                dateAdded: new Date().toLocaleDateString('id-ID')
            };
            equipment.push(newEquipment);
            added++;
        }
        saveDataToStorage();
        updateCategoryFilters();
        displayEquipmentTable();
        showNotification(`✓ ${added} baris berhasil diimpor.`, 'success');
    };
    reader.readAsText(file, 'utf-8');
}

// Unified import handler: CSV or XLSX
// ni pun dalam grop senarai alat ganrti
function importEquipmentFile(file) {
    if (!file) { showNotification('⚠️ Pilih fail terlebih dahulu.', 'warning'); return; }
    const name = file.name.toLowerCase();
    if (name.endsWith('.csv')) {
        importEquipmentCSV(file);
        return;
    }
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[firstSheetName]);
                // parse csv text
                const lines = csv.split(/\r?\n/).map(l => l.trim()).filter(l => l);
                let added = 0;
                for (let i = 0; i < lines.length; i++) {
                    const row = parseCSVLine(lines[i]);
                    if (!row[0]) continue;
                    const newEquipment = {
                        id: equipmentIdCounter++,
                        name: row[0] || 'Unknown',
                        category: row[1] || 'General',
                        quantity: parseInt(row[2]) || 1,
                        gambar: row[3] || '📦', //icon--icon1
                        condition: row[4] || 'Baik',
                        model: row[5] || '',
                        location: row[6] || '',
                        notes: row[7] || '',
                        dateAdded: new Date().toLocaleDateString('id-ID')
                    };
                    equipment.push(newEquipment);
                    added++;
                }
                saveDataToStorage();
                updateCategoryFilters();
                displayEquipmentTable();
                showNotification(`✓ ${added} baris berhasil diimpor.`, 'success');
            } catch (err) {
                console.error(err);
                showNotification('⚠️ Gagal memproses file XLSX.', 'warning');
            }
        };
        reader.readAsArrayBuffer(file);
        return;
    }
    showNotification('⚠️ Format file tidak disokong.', 'warning');
}

// Basic CSV line parser supporting quoted fields
function parseCSVLine(line) {
    const values = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i+1] === '"') { cur += '"'; i++; continue; }
            inQuotes = !inQuotes;
            continue;
        }
        if (ch === ',' && !inQuotes) {
            values.push(cur);
            cur = '';
            continue;
        }
        cur += ch;
    }
    values.push(cur);
    return values;
}

// Update category filters dynamically
function updateCategoryFilters() {
    // Get unique categories from equipment array
    const uniqueCategories = [...new Set(equipment.map(e => e.category))].filter(cat => cat);
    
    // Update category filter select in Inventory section
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        const currentSelected = categoryFilter.value;
        const existingOptions = Array.from(categoryFilter.options).map(opt => opt.value).slice(1); // Skip "Semua Kategori"
        
        // Add new categories that don't exist yet
        uniqueCategories.forEach(category => {
            if (!existingOptions.includes(category)) {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categoryFilter.appendChild(option);
            }
        });
    }
}

// -----------------------
// Requests (Permohonan user)
// -----------------------
function addRequest({ cust, model, catat, status = 'Baru' }) {
    const newReq = {
        id: requestIdCounter++,
        cust: cust || 'Unknown',
        model: model,
        jenama: jenama,
        nosiri: nosiri,
        Requestitem: Requestitem || '-',
        nosiriganti: nosiriganti,
        status: status,
        juruteknik: juruteknik,
        catat: catat,
        
        date: new Date().toLocaleDateString('id-ID')
    };
    requests.push(newReq);
    saveDataToStorage();
    displayRequests();
    updateDashboard();
    showNotification('✓ Beyul Permohonan berhasil ditambahkan!', 'success');
}

// Handle add/edit request from permohonan alat ganti user form
function handleAddRequest(e) {
    e.preventDefault();
    const form = document.getElementById('addRequestForm');
    const editingId = form.dataset.editingId ? parseInt(form.dataset.editingId) : null;
    const cust = document.getElementById('reqCust').value.trim();
    const model = document.getElementById('reqModel').value.trim();
    const jenama = document.getElementById('reqJenama').value.trim();
    const nosiri = document.getElementById('reqNoSiri').value.trim();
    const Requestitem = document.getElementById('reqRequestItem').value.trim();
    const nosiriganti = document.getElementById('reqSiriGanti').value.trim();
    const status = document.getElementById('reqStatus').value.trim();
    const catat = document.getElementById('reqcatat').value.trim();
    const dateend = document.getElementById('reqDateEnd').value.trim();
    const juruteknik = document.getElementById('reqJuruteknik').value.trim();

    if (editingId) {
        const idx = requests.findIndex(r => r.id === editingId);
        if (idx > -1) {
            requests[idx] = { ...requests[idx], cust, model, jenama, nosiri, Requestitem, nosiriganti, status, catat, dateend, juruteknik };
            showNotification('✓ Permohonan dikemaskini.', 'success');
        }
    } else { //table permohonan user punya
        const newReq = {
            id: requestIdCounter++,
            cust,
            model,
            jenama,
            nosiri,
            Requestitem,
            nosiriganti,
            status,
            juruteknik,
            catat,
            dateend,
            date: new Date().toLocaleDateString('id-ID')
            
        };
        requests.push(newReq);
        showNotification('✓ Permohonan User ditambahkan.', 'success');
    }

    saveDataToStorage();
    displayRequests();
    updateDashboard();

    // close modal
    const modal = document.getElementById('requestModal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    form.reset();
    delete form.dataset.editingId;
}

let isEditMode = false;

// ADD
document.getElementById("requestModalTitle").addEventListener("click", () => {
    isEditMode = false;

    document.getElementById("requestModalTitle").innerHTML = "➕ Tambah Permohonan";
    document.getElementById("addRequestForm").reset();
    document.getElementById("statusGroup").style.display = "none";
});

// EDIT
function openEditForm(data) {
    isEditMode = true;

    document.getElementById("requestModalTitle").innerHTML = "✏️ Edit Permohonan";
    document.getElementById("statusGroup").style.display = "block";

    document.getElementById("reqCust").value = data.reqCust;
    document.getElementById("reqStatus").value = data.reqStatus;
}




function displayRequests() {
    const tbody = document.getElementById('requestsTableBody');
    if (!tbody) return;
    if (requests.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="7" class="text-center">Belum ada permohonan.</td></tr>';
        return;
    }

    // masih permohonan user
    tbody.innerHTML = requests.map((r, idx) => `  
        <tr data-req-id="${r.id}">
            <td>${idx + 1}</td>
            <td>${r.cust}</td>
            <td>${r.model}</td>
            <td>${r.jenama}</td>
            <td>${r.nosiri}</td>
            <td>${r.Requestitem}</td>
            <td>${r.nosiriganti}</td>
            <td>${r.status}</td>
            <td>${r.juruteknik}</td>
            <td>${r.catat}</td>
            <td>${r.date}</td>
            <td>${r.dateend}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-edit" onclick="promptEditRequest(${r.id})">✏️</button>
                    <button class="btn btn-danger" onclick="deleteRequest(${r.id})">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ------------------
// Usage (Penggunaan Item)
// ------------------
function displayUsage() {
    const tbody = document.getElementById('usageTableBody');
    if (!tbody) return;
    if (inventory.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="7" class="text-center">Tiada data inventori.</td></tr>';
        return;
    }

    tbody.innerHTML = inventory.map((it, idx) => {
        if (typeof it.used !== 'number') it.used = 0;
        const used = it.used || 0;
        const total = it.quantity || 0;
        const remaining = Math.max(0, total - used);
        const percent = total > 0 ? Math.round((used / total) * 100) + '%' : '0%';
        return `
        <tr data-item-id="${it.id}">
            <td>${idx + 1}</td>
            <td>${it.name}</td>
            <td>${total}</td>
            <td>${used}</td>
            <td>${remaining}</td>
            <td>${percent}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="openUsageModal(${it.id})">Rekod Penggunaan</button>
                    <button class="btn btn-secondary" onclick="resetUsage(${it.id})">Reset</button>
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

function recordUsagePrompt(itemId) {
    const it = inventory.find(x => x.id === itemId);
    if (!it) return;
    const qty = parseInt(prompt(`Masukkan kuantiti digunakan untuk ${it.name}:`, '1')) || 0;
    if (qty <= 0) return;
    it.used = (it.used || 0) + qty;
    if (it.used > it.quantity) it.used = it.quantity;
    saveDataToStorage();
    displayUsage();
    updateDashboard();
    showNotification('✓ Penggunaan direkod.', 'success');
}

function resetUsage(itemId) {
    const it = inventory.find(x => x.id === itemId);
    if (!it) return;
    if (!confirm('Reset rekod penggunaan untuk item ini?')) return;
    it.used = 0;
    saveDataToStorage();
    displayUsage();
    updateDashboard();
    showNotification('✓ Rekod penggunaan telah direset.', 'success');
}

// Usage modal handlers
function setupUsageModalListeners() {
    const modal = document.getElementById('usageModal');
    const closeBtn = document.getElementById('closeUsageModal');
    const cancelBtn = document.getElementById('cancelUsageBtn');
    const form = document.getElementById('usageForm');

    if (!modal || !form) return;

    closeBtn?.addEventListener('click', closeUsageModal);
    cancelBtn?.addEventListener('click', closeUsageModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeUsageModal(); });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const itemId = parseInt(form.dataset.itemId);
        const qty = parseInt(document.getElementById('usageQty').value) || 0;
        if (!itemId || qty <= 0) return;
        const it = inventory.find(x => x.id === itemId);
        if (!it) return;
        it.used = (it.used || 0) + qty;
        if (it.used > it.quantity) it.used = it.quantity;
        saveDataToStorage();
        displayUsage();
        updateDashboard();
        showNotification('✓ 1 Penggunaan direkod.', 'success');
        closeUsageModal();
    });

    function closeUsageModal() {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        form.reset();
        delete form.dataset.itemId;
    }
}

function openUsageModal(itemId) {
    const it = inventory.find(x => x.id === itemId);
    if (!it) return;
    const form = document.getElementById('usageForm');
    form.dataset.itemId = itemId;
    document.getElementById('usageItemName').value = it.name || '';
    document.getElementById('usageQty').value = 1;
    document.getElementById('usageModal').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function promptEditRequest(id) {
    const r = requests.find(x => x.id === id);
    if (!r) return;
    // open modal with data for editing permohonan user
    const form = document.getElementById('addRequestForm');
    if (!form) return;
    document.getElementById('reqCust').value = r.cust || '';
    document.getElementById('reqModel').value = r.model || '';
    document.getElementById('reqJenama').value = r.jenama || '';
    document.getElementById('reqNoSiri').value = r.nosiri || '';
    document.getElementById('reqRequestItem').value = r.Requestitem || '';
    document.getElementById('reqSiriGanti').value = r.nosiriganti || '';
    document.getElementById('reqStatus').value = r.status || 'Baru';
    document.getElementById('reqcatat').value = r.notes || ''; //reqcatat
    document.getElementById('reqDateEnd').value = r.dateend || '';
    document.getElementById('reqJuruteknik').value = r.juruteknik || '';
    
    form.dataset.editingId = id;
    document.getElementById('requestModal').classList.add('show');
    document.getElementById('requestModalTitle').textContent = '✏️ Edit Permohonan';
    document.body.style.overflow = 'hidden';
}

function deleteRequest(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus permohonan ini?')) return;
    requests = requests.filter(r => r.id !== id);
    saveDataToStorage();
    displayRequests();
    updateDashboard();
    showNotification('✓ Permohonan dihapus.', 'success');
}

// Setup Event Listeners
function setupEventListeners() {
    document.getElementById('addItemForm').addEventListener('submit', handleAddItem);
    document.getElementById('searchBox').addEventListener('input', filterInventory);
    document.getElementById('categoryFilter').addEventListener('change', filterInventory);
    document.getElementById('conditionFilter').addEventListener('change', filterInventory);
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
    document.getElementById('printBtn').addEventListener('click', printReport);
    // Budget controls
    const setBudgetBtn = document.getElementById('setBudgetBtn');
    const recordExpenseBtn = document.getElementById('recordExpenseBtn') || document.getElementById('recordExpenseBtn');
    if (setBudgetBtn) setBudgetBtn.addEventListener('click', () => setBudget(document.getElementById('budgetAmount').value));
    if (recordExpenseBtn) recordExpenseBtn.addEventListener('click', () => recordExpense(document.getElementById('expenseAmount').value));

    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('href').substring(1);
            showSection(sectionId);
        });
    });

    // Open Add Item button inside Inventory section
    const openAddItemBtn = document.getElementById('openAddItemBtn');
    if (openAddItemBtn) openAddItemBtn.addEventListener('click', () => showSection('add-item'));

    // Burger menu toggle (mobile)
    const burgerBtn = document.querySelector('.burger-btn');
    const burgerList = document.getElementById('burgerList');
    if (burgerBtn && burgerList) {
        burgerBtn.addEventListener('click', () => {
            burgerList.classList.toggle('open');
            const open = burgerList.classList.contains('open');
            burgerList.setAttribute('aria-hidden', String(!open));
        });

        document.querySelectorAll('.burger-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('href').substring(1);
                showSection(sectionId);
                burgerList.classList.remove('open');
                burgerList.setAttribute('aria-hidden', 'true');
            });
        });

        // Close burger if click outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.navbar')) {
                burgerList.classList.remove('open');
                burgerList.setAttribute('aria-hidden', 'true');
            }
        });
    }
}

// Add Item Handler
function handleAddItem(e) {
    e.preventDefault();

    const newItem = {
        id: itemIdCounter++,
        name: document.getElementById('itemName').value,
        category: document.getElementById('category').value,
        dateAdded: new Date().toLocaleDateString('id-ID')
    };

    inventory.push(newItem);
    // Also add to equipment list so it appears in the equipment/inventory group
    const newEquipment = {
        id: equipmentIdCounter++,
        name: newItem.name,
        category: newItem.category,
        quantity: newItem.quantity || 1,
        model: newItem.serialNumber || '',
        location: '',
        notes: newItem.notes || '',
        dateAdded: newItem.dateAdded
    };
    equipment.push(newEquipment);
    saveDataToStorage();
    
    // Reset form
    document.getElementById('addItemForm').reset();
    document.getElementById('quantity').value = '1';
    
    // Show success message
    showNotification('✓ Item ditambahkan ke Inventori dan Senarai Peralatan!', 'success');
    
    updateDashboard();
    displayInventory();
    displayEquipmentTable();
}

// Display Inventory
function displayInventory(filteredItems = inventory) {
    const tableBody = document.getElementById('inventoryTableBody');
    
    if (filteredItems.length === 0) {
        tableBody.innerHTML = '<tr class="empty-row"><td colspan="8" class="text-center">Belum ada data. Tambahkan item baru untuk memulai.</td></tr>';
        return;
    }

    tableBody.innerHTML = filteredItems.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td><strong>${item.name}</strong></td>
            <td>${item.category}</td>
                <div class="action-buttons">
                    <button class="btn btn-edit" onclick="editItem(${item.id})">✏️ Edit</button>
                    <button class="btn btn-danger" onclick="deleteItem(${item.id})">🗑️ Hapus</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Filter Inventory
function filterInventory() {
    const searchTerm = document.getElementById('searchBox').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const conditionFilter = document.getElementById('conditionFilter').value;

    const filtered = inventory.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm) ||
                            item.serialNumber.toLowerCase().includes(searchTerm);
        const matchesCategory = categoryFilter === '' || item.category === categoryFilter;
        const matchesCondition = conditionFilter === '' || item.condition === conditionFilter;

        return matchesSearch && matchesCategory && matchesCondition;
    });

    displayInventory(filtered);
}

// Delete Item
function deleteItem(id) {
    if (confirm('Apakah Anda yakin ingin menghapus item ini?')) {
        inventory = inventory.filter(item => item.id !== id);
        saveDataToStorage();
        showNotification('✓ Item berhasil dihapus!', 'success');
        updateDashboard();
        displayInventory();
    }
}

// Edit Item (Simple implementation)
function editItem(id) {
    const item = inventory.find(item => item.id === id);
    if (item) {
        document.getElementById('itemName').value = item.nama;
        document.getElementById('category').value = item.category;
        document.getElementById('quantity').value = item.quantity;
        document.getElementById('serialNumber').value = item.serialNumber;
        document.getElementById('condition').value = item.condition;
        document.getElementById('notes').value = item.notes;

        // Delete the old item
        deleteItem(id);
        
        // Scroll to form
        document.getElementById('add-item').scrollIntoView({ behavior: 'smooth' });
    }
}

// Update Dashboard Stats
function updateDashboard() {
    // bahagian dashboard alat ganti berada di senarai komputer
    const total = inventory.length;
    const available = inventory.filter(item => item.condition !== 'Rusak').length;
    const lowStock = inventory.filter(item => item.quantity <= 2).length;
    // delete const damage = inventory.filter(item => item.condition === 'Rusak').length;

    document.getElementById('totalItems').textContent = total;
    document.getElementById('availableItems').textContent = available;
    document.getElementById('lowStockItems').textContent = lowStock;
    // deleted elemtn .. document.getElementById('damageItems').textContent = damage;

    // Requests stats dashboard permohonan user
    const reqNew = requests.filter(r => r.status.toLowerCase() === 'baru').length;
    const reqInProgress = requests.filter(r => r.status.toLowerCase() === 'dalam proses').length;
    const reqDone = requests.filter(r => r.status.toLowerCase() === 'selesai').length;
    const reqRejected = requests.filter(r => r.status.toLowerCase() === 'ditolak').length;

    const elReqNew = document.getElementById('reqNew');
    if (elReqNew) elReqNew.textContent = reqNew;
    const elReqIn = document.getElementById('reqInProgress');
    if (elReqIn) elReqIn.textContent = reqInProgress;
    const elReqDone = document.getElementById('reqDone');
    if (elReqDone) elReqDone.textContent = reqDone;
    const elReqRejected = document.getElementById('reqRejected');
    if (elReqRejected) elReqRejected.textContent = reqRejected;
}

// ------------------
// Budget functions
// ------------------
function setBudget(amount) {
    budget = parseFloat(amount) || 0;
    saveDataToStorage();
    updateBudgetDisplay();
    showNotification('✓ Bajet disimpan.', 'success');
}

function recordExpense(amount) {
    const val = parseFloat(amount) || 0;
    if (val <= 0) { showNotification('⚠️ Masukkan jumlah yang sah.', 'warning'); return; }
    budgetUsed = (parseFloat(budgetUsed) || 0) + val;
    saveDataToStorage();
    updateBudgetDisplay();
    showNotification('✓ Perbelanjaan direkod.', 'success');
}

function updateBudgetDisplay() {
    const totalEl = document.getElementById('budgetTotal');
    const usedEl = document.getElementById('budgetUsed');
    const remEl = document.getElementById('budgetRemaining');
    const pctEl = document.getElementById('budgetPercent');

    const total = parseFloat(budget) || 0;
    const used = parseFloat(budgetUsed) || 0;
    const remaining = Math.max(0, total - used);
    const percent = total > 0 ? Math.round((used / total) * 100) + '%' : '0%';

    if (totalEl) totalEl.textContent = `RM ${total.toFixed(2)}`;
    if (usedEl) usedEl.textContent = `RM ${used.toFixed(2)}`;
    if (remEl) remEl.textContent = `RM ${remaining.toFixed(2)}`;
    if (pctEl) pctEl.textContent = percent;
}

// Export to CSV
function exportToCSV() {
    if (inventory.length === 0) {
        showNotification('⚠️ Belum ada data untuk diekspor!', 'warning');
        return;
    }

    let csv = 'No,Nama Perangkat,Kategori,Jumlah,Serial Number,Kondisi,Catatan,Tanggal Ditambahkan\n';
    
    inventory.forEach((item, index) => {
        csv += `${index + 1},"${item.name}",${item.category},${item.quantity},"${item.serialNumber}",${item.condition},"${item.notes}",${item.dateAdded}\n`;
    });

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('✓ Data berhasil diekspor!', 'success');
}

// Print Report
function printReport() {
    if (inventory.length === 0) {
        showNotification('⚠️ Belum ada data untuk dicetak!', 'warning');
        return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Laporan Inventori Alat Ganti Komputer</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #2c3e50; text-align: center; }
                    .summary { margin: 20px 0; }
                    .summary div { margin: 10px 0; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                    th { background-color: #2c3e50; color: white; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                    .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <h1>📊 Laporan Inventori Alat Ganti Komputer</h1>
                <p style="text-align: center; color: #666;">Tanggal: ${new Date().toLocaleDateString('id-ID')}</p>
                
                <div class="summary">
                    <h2>Ringkasan</h2>
                    <div>Total Item: <strong>${inventory.length}</strong></div>
                    <div>Total Stok: <strong>${inventory.reduce((sum, item) => sum + item.quantity, 0)}</strong></div>
                    <div>Item Tersedia: <strong>${inventory.filter(item => item.condition !== 'Rusak').length}</strong></div>
                    <div>Item Rusak/Diperbaiki: <strong>${inventory.filter(item => item.condition === 'Rusak').length}</strong></div>
                </div>

                <h2>Detail Inventori</h2>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Nama Perangkat</th>
                            <th>Kategori</th>
                            <th>Jumlah</th>
                            <th>Serial Number</th>
                            <th>Kondisi</th>
                            <th>Catatan</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${inventory.map((item, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${item.name}</td>
                                <td>${item.category}</td>
                                <td>${item.quantity}</td>
                                <td>${item.serialNumber || '-'}</td>
                                <td>${item.condition}</td>
                                <td>${item.notes || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="footer">
                    <p>Laporan ini dihasilkan oleh Dashboard Alat Ganti Komputer</p>
                    <p>© 2025 Sistem Manajemen Inventori IT</p>
                </div>
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
    showNotification('✓ Laporan siap dicetak!', 'success');
}

// Show Section
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });

    // Show selected section
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'block';
        section.scrollIntoView({ behavior: 'smooth' });
    }

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`.nav-link[href="#${sectionId}"]`)?.classList.add('active');
}

// Notification System
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background-color: ${type === 'success' ? '#2ecc71' : type === 'warning' ? '#f39c12' : '#3498db'};
        color: white;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Local Storage Functions
function saveDataToStorage() {
    localStorage.setItem('inventory', JSON.stringify(inventory));
    localStorage.setItem('itemIdCounter', itemIdCounter.toString());
    localStorage.setItem('equipment', JSON.stringify(equipment));
    localStorage.setItem('equipmentIdCounter', equipmentIdCounter.toString());
    localStorage.setItem('requests', JSON.stringify(requests));
    localStorage.setItem('requestIdCounter', requestIdCounter.toString());
    localStorage.setItem('budget', budget.toString());
    localStorage.setItem('budgetUsed', budgetUsed.toString());
}

function loadDataFromStorage() {
    const stored = localStorage.getItem('inventory');
    const storedCounter = localStorage.getItem('itemIdCounter');
    const storedEquipment = localStorage.getItem('equipment');
    const storedEquipmentCounter = localStorage.getItem('equipmentIdCounter');
    
    if (stored) {
        inventory = JSON.parse(stored);
    }
    if (storedCounter) {
        itemIdCounter = parseInt(storedCounter);
    }
    if (storedEquipment) {
        equipment = JSON.parse(storedEquipment);
    }
    if (storedEquipmentCounter) {
        equipmentIdCounter = parseInt(storedEquipmentCounter);
    }

    const storedRequests = localStorage.getItem('requests');
    const storedRequestCounter = localStorage.getItem('requestIdCounter');
    if (storedRequests) {
        try { requests = JSON.parse(storedRequests); } catch(e) { requests = []; }
    }
    if (storedRequestCounter) {
        requestIdCounter = parseInt(storedRequestCounter);
    }

    const storedBudget = localStorage.getItem('budget');
    const storedBudgetUsed = localStorage.getItem('budgetUsed');
    if (storedBudget) budget = parseFloat(storedBudget) || 0;
    if (storedBudgetUsed) budgetUsed = parseFloat(storedBudgetUsed) || 0;

    // ensure inventory items have used field
    inventory.forEach(it => { if (typeof it.used !== 'number') it.used = 0; });

    // Initialize with sample data if empty
    if (equipment.length === 0) {
        initializeSampleData();
    }
}
//DALAM SENARAI ALAT GANTI TABLE
// Initialize sample equipment data
function initializeSampleData() {
    const sampleEquipment = [
        
    ];
    
    equipment = sampleEquipment;
    saveDataToStorage();
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Equipment List Functions - Event delegation for Edit and Delete buttons
document.addEventListener('click', (e) => {
    if (e.target.closest('.btn-edit')) {
        const button = e.target.closest('.btn-edit');
        const row = button.closest('tr');
        const equipmentId = row.dataset.equipmentId;
        editEquipment(equipmentId);
    }
    if (e.target.closest('.btn-danger')) {
        const button = e.target.closest('.btn-danger');
        const row = button.closest('tr');
        const equipmentId = row.dataset.equipmentId;
        deleteEquipment(equipmentId);
    }
});

function displayEquipmentTable(filteredEquipment = equipment) {
    const tableBody = document.getElementById('equipmentTableBody');
    if (!tableBody) return;
    
    const dataToDisplay = filteredEquipment && filteredEquipment.length > 0 ? filteredEquipment : equipment;
    
    // Update category filters
    updateCategoryFilters();
    
    if (dataToDisplay.length === 0) {
        tableBody.innerHTML = '<tr class="empty-row"><td colspan="7" class="text-center">Belum ada data peralatan. Tambahkan peralatan baru untuk memulai.</td></tr>';
        return;
    }
    //Colour Senarai alat ganti table dan susunan table
    tableBody.innerHTML = dataToDisplay.map((item, index) => {
    const statusClass = item.catit === 'Baru' ? 'status-new' : item.catit === 'Rusak' ? 'status-damage' : 'status-good';
        const badgeColor = item.quantity <= 10 ? '#f31212ff' : '#2ecc71';  //kuantiti sebenar colour
        
        return `
        <tr data-equipment-id="${item.id}">
            <td>${index + 1}</td>
            
            <td><strong>${item.name}</strong></td>
            <td>${item.category}</td>
            <td style="text-align: center; font-size: 1.5rem;">${item.namamodell}</td>
            <td><span class="badge" style="background: ${badgeColor}; color: white; padding: 5px 10px; border-radius: 4px;">${item.quantity}</span></td>
            <td style="text-align: center; font-size: 1.5rem;">${item.notaganti}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-edit" onclick="editEquipment(${item.id})">✏️ Edit</button>
                    <button class="btn btn-danger" onclick="deleteEquipment(${item.id})">🗑️ Hapus</button>
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

function editEquipment(equipmentId) {
    const item = equipment.find(e => e.id == equipmentId);
    if (item) {
        // Fill form with equipment data
        //connect sama form new dan edit senarai alat ganti
        document.getElementById('komp1').value = item.name || ''; //ganti equipmentCategory kepada ModelKategori
        document.getElementById('NamaModel').value = item.namamodell || '';//name ganti kepada namaperalatan
        document.getElementById('NamaPeralatan').value = item.category || '';
        document.getElementById('EQuantity').value = item.quantity || 1;
        document.getElementById('CatitAlatGanti').value = item.notaganti || '';
        
        // Change modal title
        document.getElementById('modalTitle').textContent = '✏️ Edit Peralatan';
        
        // Store equipment ID for update
        const form = document.getElementById('addEquipmentForm');
        form.dataset.editingId = equipmentId;
        
        // Show modal
        const modal = document.getElementById('equipmentModal');
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function deleteEquipment(equipmentId) {
    if (confirm('Apakah Anda yakin ingin menghapus peralatan ini?')) {
        equipment = equipment.filter(e => e.id != equipmentId);
        saveDataToStorage();
        displayEquipmentTable();
        updateDashboard();
        showNotification('✓ Peralatan berhasil dihapus!', 'success');
    }
}

// Initialize
function initialize() {
    displayInventory();
    updateDashboard();
}


// After init, display usage and budget
displayUsage();
updateBudgetDisplay();
initialize();

//bahagian contoh kira

function Dashboardtest() {
  const cardContainer = document.getElementById("stokCards");
  const tableBody = document.getElementById("stokTable");
  const totalEl = document.getElementById("jumlahKeseluruhan");

  let total = 0;

  

  // buang card item lama (kekalkan card total)
  cardContainer.querySelectorAll(".item-card").forEach(card => card.remove());
  tableBody.innerHTML = "";

  for (const item in stok) {
    total += stok[item];

    // CARD ITEM
    const card = document.createElement("div");
    card.className = "card item-card";
    card.innerHTML = `
      <h3>${item}</h3>
      <p>${stok[item]}</p>
    `;
    cardContainer.appendChild(card);

    // TABLE
    tableBody.innerHTML += `
      <tr>
        <td>${item}</td>
        <td>${stok[item]}</td>
      </tr>
    `;
  }

  // UPDATE TOTAL
  totalEl.textContent = total;
}

let stok = {};

document.addEventListener("DOMContentLoaded", () => {
 
 // BUKA MODAL
document.getElementById("openRequestForm1").addEventListener("click", () => {
  document.getElementById("stokForm").style.display = "flex";
});

// TUTUP MODAL
document.getElementById("closeRequestModal1").addEventListener("click", () => {
  document.getElementById("stokForm").style.display = "none";
});

document.getElementById("cancelRequestBtn1").addEventListener("click", () => {
  document.getElementById("stokForm").style.display = "none";
});


// submit form tambah stok
  document.getElementById("tambahstok").addEventListener("submit", function(e) {
    e.preventDefault();
    console.log("SUBMIT FORM DIPANGGIL");

    const item = document.getElementById("item").value.trim();
    const qty = parseInt(document.getElementById("kuantiti").value);
    
   console.log("ITEM:", item);
   console.log("QTY:", qty);

    if (!stok[item]) stok[item] = 0;
    stok[item] += qty;

    console.log("STOK SEKARANG:", stok)
    // 🔍 DEBUG DI SINI
    console.log("STOK:", stok);
    console.log("SUBMIT DIKLIK");
    console.log("ITEM:", item, "QTY:", qty);


    Dashboardtest();

    this.reset();
    document.getElementById("stokForm").style.display = "none";
  });

 


});








//end of kira 
