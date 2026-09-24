/**
 * ROADS-ON Admin Portal, Role Management & Snapchat-Style Map Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const isLoginPage = document.getElementById('loginForm') !== null;
    const isDashboard = document.getElementById('docBuilderForm') !== null;
    const isPrintPage = document.getElementById('printDocSheet') !== null;

    if (isLoginPage) {
        initLoginPage();
    } else if (isDashboard) {
        initDashboard();
    } else if (isPrintPage) {
        initPrintPage();
    }
});

/* ==========================================================================
   1. LOGIN PAGE LOGIC
   ========================================================================== */
function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const alertBox = document.getElementById('loginAlert');
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');
    const passwordInput = document.getElementById('passwordInput');

    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', () => {
            const isPass = passwordInput.type === 'password';
            passwordInput.type = isPass ? 'text' : 'password';
            togglePasswordBtn.textContent = isPass ? '🔒' : '👁️';
        });
    }

    // Check if already logged in
    fetch('/api/auth/status')
        .then(res => res.json())
        .then(data => {
            if (data.loggedIn) {
                window.location.href = '/admin';
            }
        })
        .catch(() => {});

    // Submit Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        alertBox.style.display = 'none';
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Giriş Yapılıyor...';

        const username = document.getElementById('usernameInput').value.trim();
        const password = passwordInput.value;

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                window.location.href = '/admin';
            } else {
                alertBox.className = 'alert-box alert-danger';
                alertBox.textContent = data.error || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.';
                alertBox.style.display = 'block';
            }
        } catch (err) {
            alertBox.className = 'alert-box alert-danger';
            alertBox.textContent = 'Sunucuya bağlanılamadı. Lütfen sunucunun çalıştığından emin olun.';
            alertBox.style.display = 'block';
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Giriş Yap</span> <span>&rarr;</span>';
        }
    });
}

/* ==========================================================================
   2. DASHBOARD (DOCUMENTS, SNAPMAP, CONTACTS & WORKERS)
   ========================================================================== */
function initDashboard() {
    let currentUser = null;
    let editingDocId = null;

    // Contact & Map State
    let allContacts = [];
    let snapMap = null;
    let mapMarkers = [];
    let isPickingLocation = false;
    let selectedAvatarColor = '#FF6500';

    // Elements
    const form = document.getElementById('docBuilderForm');
    const customFieldsContainer = document.getElementById('customFieldsContainer');
    const btnAddField = document.getElementById('btnAddField');
    const btnClearForm = document.getElementById('btnClearForm');
    const btnSaveAndPrint = document.getElementById('btnSaveAndPrint');
    const archiveTableBody = document.getElementById('archiveTableBody');
    const archiveSearchInput = document.getElementById('archiveSearchInput');
    const archiveStartDate = document.getElementById('archiveStartDate');
    const archiveEndDate = document.getElementById('archiveEndDate');

    // 1. Auth Guard & Role Setup
    fetch('/api/auth/status')
        .then(res => res.json())
        .then(data => {
            if (!data.loggedIn) {
                window.location.href = '/admin/login';
                return;
            }

            currentUser = data.user;
            setupUserRoleUI(currentUser);

            // Initial data loads
            loadNextDocNumber();
            loadArchiveDocuments();

            if (currentUser.role === 'admin') {
                loadContacts();
                loadWorkers();
            }
        })
        .catch(() => {
            window.location.href = '/admin/login';
        });

    function setupUserRoleUI(user) {
        const navUsername = document.getElementById('navUsername');
        const navRoleBadge = document.getElementById('navRoleBadge');

        if (navUsername) {
            navUsername.textContent = user.fullName || user.username;
        }

        if (navRoleBadge) {
            if (user.role === 'admin') {
                navRoleBadge.textContent = 'YÖNETİCİ (PATRON)';
                navRoleBadge.classList.remove('role-worker');
            } else {
                navRoleBadge.textContent = 'ÇALIŞAN (OPERASYON)';
                navRoleBadge.classList.add('role-worker');
            }
        }

        // Show admin-only tabs if admin
        const adminTabs = document.querySelectorAll('.admin-only-tab');
        adminTabs.forEach(tab => {
            tab.style.display = user.role === 'admin' ? 'inline-flex' : 'none';
        });
    }

    // 2. Tab Navigation
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabBuilder = document.getElementById('tabBuilder');
    const tabArchive = document.getElementById('tabArchive');
    const tabSnapmap = document.getElementById('tabSnapmap');
    const tabContacts = document.getElementById('tabContacts');
    const tabWorkers = document.getElementById('tabWorkers');

    function switchTab(targetTab) {
        tabBtns.forEach(b => b.classList.remove('active'));
        const activeBtn = document.querySelector(`.tab-btn[data-tab="${targetTab}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        if (tabBuilder) tabBuilder.style.display = targetTab === 'builder' ? 'block' : 'none';
        if (tabArchive) tabArchive.style.display = targetTab === 'archive' ? 'block' : 'none';
        if (tabSnapmap) tabSnapmap.style.display = targetTab === 'snapmap' ? 'block' : 'none';
        if (tabContacts) tabContacts.style.display = targetTab === 'contacts' ? 'block' : 'none';
        if (tabWorkers) tabWorkers.style.display = targetTab === 'workers' ? 'block' : 'none';

        if (targetTab === 'archive') {
            loadArchiveDocuments();
        } else if (targetTab === 'snapmap') {
            if (!snapMap) {
                initSnapMap();
            } else {
                setTimeout(() => snapMap.invalidateSize(), 150);
            }
        } else if (targetTab === 'contacts') {
            loadContacts();
        } else if (targetTab === 'workers') {
            loadWorkers();
        }
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // 3. Logout
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await fetch('/api/auth/logout', { method: 'POST' });
            } catch (err) {}
            window.location.href = '/admin/login';
        });
    }

    // 4. Current User Change Password Modal
    const passModal = document.getElementById('passwordModal');
    const btnChangePass = document.getElementById('btnChangePass');
    const btnClosePassModal = document.getElementById('btnClosePassModal');
    const passForm = document.getElementById('changePassForm');
    const passAlert = document.getElementById('passAlert');

    if (btnChangePass) {
        btnChangePass.addEventListener('click', () => {
            passModal.classList.add('active');
            passAlert.style.display = 'none';
            passForm.reset();
        });
    }

    if (btnClosePassModal) {
        btnClosePassModal.addEventListener('click', () => passModal.classList.remove('active'));
    }

    if (passForm) {
        passForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            passAlert.style.display = 'none';

            const currentPassword = document.getElementById('currentPassInput').value;
            const newPassword = document.getElementById('newPassInput').value;
            const newPasswordConfirm = document.getElementById('newPassConfirmInput').value;

            if (newPassword !== newPasswordConfirm) {
                passAlert.className = 'alert-box alert-danger';
                passAlert.textContent = 'Yeni şifreler birbiriyle eşleşmiyor. Lütfen kontrol ediniz.';
                passAlert.style.display = 'block';
                return;
            }

            try {
                const res = await fetch('/api/auth/change-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ currentPassword, newPassword })
                });
                const data = await res.json();

                if (res.ok && data.success) {
                    alert('Şifreniz başarıyla değiştirildi.');
                    passModal.classList.remove('active');
                } else {
                    passAlert.className = 'alert-box alert-danger';
                    passAlert.textContent = data.error || 'Şifre değiştirilemedi.';
                    passAlert.style.display = 'block';
                }
            } catch (err) {
                passAlert.className = 'alert-box alert-danger';
                passAlert.textContent = 'Bir hata oluştu.';
                passAlert.style.display = 'block';
            }
        });
    }

    // 5. Document Number Fetching
    async function loadNextDocNumber() {
        if (editingDocId) return;
        try {
            const res = await fetch('/api/documents/next-number');
            const data = await res.json();
            if (data.success && data.nextNumber) {
                document.getElementById('docNumberInput').value = data.nextNumber;
                updateLivePreview();
            }
        } catch (err) {
            console.error('Error fetching next doc number:', err);
        }
    }

    // 6. Dynamic Custom Fields Manager
    function addCustomFieldRow(key = '', val = '') {
        const row = document.createElement('div');
        row.className = 'custom-field-row';
        row.innerHTML = `
            <input type="text" class="form-input custom-field-key" placeholder="Başlık (Örn: Gümrük Mühür No)" value="${escapeHtml(key)}">
            <input type="text" class="form-input custom-field-val" placeholder="Değer (Örn: TR-998811)" value="${escapeHtml(val)}">
            <button type="button" class="btn-remove-field" title="Alanı Sil">✕</button>
        `;

        row.querySelector('.btn-remove-field').addEventListener('click', () => {
            row.remove();
            updateLivePreview();
        });

        row.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', updateLivePreview);
        });

        customFieldsContainer.appendChild(row);
        updateLivePreview();
    }

    if (btnAddField) {
        btnAddField.addEventListener('click', () => addCustomFieldRow());
    }

    function getCustomFieldsData() {
        const rows = customFieldsContainer.querySelectorAll('.custom-field-row');
        const fields = [];
        rows.forEach(row => {
            const key = row.querySelector('.custom-field-key').value.trim();
            const val = row.querySelector('.custom-field-val').value.trim();
            if (key) {
                fields.push({ key, val });
            }
        });
        return fields;
    }

    // 7. Live Preview Sync
    function updateLivePreview() {
        const docNo = document.getElementById('docNumberInput').value.trim() || 'RO-2026-0000';
        const docDate = document.getElementById('docDateInput').value || new Date().toISOString().split('T')[0];
        const company = document.getElementById('companyNameInput').value.trim() || '-';
        const fromLoc = document.getElementById('fromLocInput').value.trim() || '-';
        const toLoc = document.getElementById('toLocInput').value.trim() || '-';
        const plate = document.getElementById('plateInput').value.trim() || '-';
        const driver = document.getElementById('driverInput').value.trim() || '-';
        const price = document.getElementById('priceInput').value || '0';
        const currency = document.getElementById('currencySelect').value || 'TRY';
        const invoice = document.getElementById('invoiceInput').value.trim() || '-';
        const notes = document.getElementById('notesInput').value.trim();

        document.getElementById('prevDocNo').textContent = docNo;
        document.getElementById('prevDocDate').textContent = docDate;
        document.getElementById('prevCompany').textContent = company;
        document.getElementById('prevRoute').textContent = `${fromLoc} → ${toLoc}`;
        document.getElementById('prevPlate').textContent = plate;
        document.getElementById('prevDriver').textContent = driver;
        document.getElementById('prevPrice').textContent = `${parseFloat(price).toLocaleString('tr-TR')} ${currency}`;
        document.getElementById('prevInvoice').textContent = invoice;

        const customFields = getCustomFieldsData();
        const prevCustomTbody = document.getElementById('prevCustomFieldsTbody');
        prevCustomTbody.innerHTML = '';
        customFields.forEach(f => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<th>${escapeHtml(f.key)}</th><td>${escapeHtml(f.val || '-')}</td>`;
            prevCustomTbody.appendChild(tr);
        });

        const shippingScope = document.getElementById('shippingScopeSelect')?.value || 'yurtici';
        const isPaid = document.getElementById('isPaidSelect')?.value === '1';

        const prevScope = document.getElementById('prevScope');
        if (prevScope) {
            prevScope.innerHTML = shippingScope === 'yurtdisi'
                ? `<span class="doc-scope-toggle scope-intl" style="font-size:0.72rem; padding:2px 8px;">🌐 Yurtdışı</span>`
                : `<span class="doc-scope-toggle scope-dom" style="font-size:0.72rem; padding:2px 8px;">🇹🇷 Yurtiçi</span>`;
        }

        const prevPayment = document.getElementById('prevPayment');
        if (prevPayment) {
            prevPayment.innerHTML = isPaid
                ? `<span class="doc-payment-toggle payment-paid" style="font-size:0.72rem; padding:2px 8px;">🟢 Alındı</span>`
                : `<span class="doc-payment-toggle payment-unpaid" style="font-size:0.72rem; padding:2px 8px;">🔴 Alınmadı</span>`;
        }

        const prevNotesBox = document.getElementById('prevNotesBox');
        if (notes) {
            prevNotesBox.textContent = notes;
            prevNotesBox.style.display = 'block';
        } else {
            prevNotesBox.textContent = 'Ek açıklama veya operasyonel not girilmedi.';
        }
    }

    if (form) {
        form.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('input', updateLivePreview);
            input.addEventListener('change', updateLivePreview);
        });
    }

    // 8. Reset Builder Form
    function resetBuilderForm() {
        editingDocId = null;
        form.reset();
        document.getElementById('docDateInput').value = new Date().toISOString().split('T')[0];
        const scopeSelect = document.getElementById('shippingScopeSelect');
        if (scopeSelect) scopeSelect.value = 'yurtici';
        const paidSelect = document.getElementById('isPaidSelect');
        if (paidSelect) paidSelect.value = '0';
        customFieldsContainer.innerHTML = '';
        document.getElementById('builderFormTitle').innerHTML = '<span>➕ Yeni Belge Oluştur</span>';
        loadNextDocNumber();
        updateLivePreview();
    }

    if (btnClearForm) {
        btnClearForm.addEventListener('click', resetBuilderForm);
    }

    // 9. Save Document
    async function saveDocument(andPrint = false) {
        const company_name = document.getElementById('companyNameInput').value.trim();
        if (!company_name) {
            alert('Lütfen Müşteri / Firma Adı alanını doldurunuz.');
            document.getElementById('companyNameInput').focus();
            return;
        }

        const payload = {
            doc_number: document.getElementById('docNumberInput').value.trim(),
            doc_date: document.getElementById('docDateInput').value,
            company_name: company_name,
            from_location: document.getElementById('fromLocInput').value.trim(),
            to_location: document.getElementById('toLocInput').value.trim(),
            plate_number: document.getElementById('plateInput').value.trim(),
            driver_info: document.getElementById('driverInput').value.trim(),
            price: parseFloat(document.getElementById('priceInput').value) || 0,
            currency: document.getElementById('currencySelect').value,
            invoice_info: document.getElementById('invoiceInput').value.trim(),
            shipping_scope: document.getElementById('shippingScopeSelect')?.value || 'yurtici',
            is_paid: parseInt(document.getElementById('isPaidSelect')?.value || '0', 10),
            custom_fields: getCustomFieldsData(),
            notes: document.getElementById('notesInput').value.trim()
        };

        const url = editingDocId ? `/api/documents/${editingDocId}` : '/api/documents';
        const method = editingDocId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (res.ok && data.success) {
                const targetId = editingDocId || data.id;
                alert(editingDocId ? 'Belge başarıyla güncellendi.' : 'Yeni belge başarıyla oluşturuldu.');

                if (andPrint && targetId) {
                    window.open(`/admin/print?id=${targetId}`, '_blank');
                }

                resetBuilderForm();
                loadArchiveDocuments();
            } else {
                alert(data.error || 'Belge kaydedilirken bir hata oluştu.');
            }
        } catch (err) {
            alert('Sunucu hatası. Lütfen tekrar deneyin.');
        }
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            saveDocument(false);
        });
    }

    if (btnSaveAndPrint) {
        btnSaveAndPrint.addEventListener('click', () => saveDocument(true));
    }

    // 10. Archive List, Search & Status Quick Toggles
    const archiveScopeFilter = document.getElementById('archiveScopeFilter');
    const archivePaymentFilter = document.getElementById('archivePaymentFilter');

    async function loadArchiveDocuments() {
        const query = archiveSearchInput ? archiveSearchInput.value.trim() : '';
        const start = archiveStartDate ? archiveStartDate.value : '';
        const end = archiveEndDate ? archiveEndDate.value : '';
        const scope = archiveScopeFilter ? archiveScopeFilter.value : '';
        const payment = archivePaymentFilter ? archivePaymentFilter.value : '';

        const params = new URLSearchParams();
        if (query) params.append('search', query);
        if (start) params.append('startDate', start);
        if (end) params.append('endDate', end);
        if (scope) params.append('scope', scope);
        if (payment !== '') params.append('isPaid', payment);

        try {
            const res = await fetch(`/api/documents?${params.toString()}`);
            const data = await res.json();

            if (res.ok && data.success) {
                renderArchiveTable(data.data);
                const badge = document.getElementById('archiveCountBadge');
                if (badge) badge.textContent = `${data.data.length} Belge`;
            }
        } catch (err) {
            console.error('Error loading archive:', err);
        }
    }

    async function quickUpdateDocStatus(id, payload, btn) {
        if (btn) btn.disabled = true;
        try {
            const res = await fetch(`/api/documents/${id}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok && data.success) {
                await loadArchiveDocuments();
            } else {
                alert(data.error || 'Güncelleme yapılamadı.');
            }
        } catch (err) {
            alert('Sunucu hatası.');
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    function renderArchiveTable(docs) {
        if (!archiveTableBody) return;
        archiveTableBody.innerHTML = '';
        if (docs.length === 0) {
            archiveTableBody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 36px; color: var(--adm-text-muted);">
                        Kayıtlı belge bulunamadı.
                    </td>
                </tr>
            `;
            return;
        }

        const isAdmin = currentUser && currentUser.role === 'admin';

        docs.forEach(doc => {
            const tr = document.createElement('tr');
            const printInfo = doc.print_count > 0 
                ? `<span class="badge-print-count">🖨️ ${doc.print_count} Kez</span><br><small style="color:#94a3b8; font-size: 0.72rem;">${formatDate(doc.last_printed_at)}</small>`
                : `<span style="color:#64748b; font-size:0.8rem;">Yazdırılmadı</span>`;

            const deleteBtnHtml = isAdmin 
                ? `<button class="btn-icon-action btn-icon-delete btn-archive-delete" title="Sil" data-id="${doc.id}">🗑️</button>` 
                : '';

            const isIntl = doc.shipping_scope === 'yurtdisi';
            const scopeClass = isIntl ? 'scope-intl' : 'scope-dom';
            const scopeText = isIntl ? '🌐 Yurtdışı' : '🇹🇷 Yurtiçi';
            const scopeBtn = `<button type="button" class="doc-scope-toggle ${scopeClass} btn-toggle-scope" data-id="${doc.id}" data-scope="${escapeHtml(doc.shipping_scope || 'yurtici')}" title="Kapsamı değiştirmek için tıklayın (Yurtiçi ↔ Yurtdışı)">${scopeText}</button>`;

            const isPaid = doc.is_paid == 1;
            const paymentClass = isPaid ? 'payment-paid' : 'payment-unpaid';
            const paymentText = isPaid ? '🟢 Alındı' : '🔴 Alınmadı';
            const paymentBtn = `<button type="button" class="doc-payment-toggle ${paymentClass} btn-toggle-payment" data-id="${doc.id}" data-paid="${isPaid ? 1 : 0}" title="Ödeme durumunu değiştirmek için tıklayın (Alındı ↔ Alınmadı)">${paymentText}</button>`;

            tr.innerHTML = `
                <td><span class="doc-no-pill">${escapeHtml(doc.doc_number)}</span></td>
                <td>${escapeHtml(doc.doc_date)}</td>
                <td><strong>${escapeHtml(doc.company_name)}</strong></td>
                <td>${escapeHtml(doc.from_location || '-')} &rarr; ${escapeHtml(doc.to_location || '-')}</td>
                <td>${scopeBtn}</td>
                <td>${paymentBtn}</td>
                <td><strong>${parseFloat(doc.price).toLocaleString('tr-TR')} ${escapeHtml(doc.currency)}</strong></td>
                <td>${printInfo}</td>
                <td>
                    <div class="table-actions-cell">
                        <button class="btn-icon-action btn-archive-print" title="Yazdır / PDF Al" data-id="${doc.id}">🖨️</button>
                        <button class="btn-icon-action btn-archive-edit" title="Düzenle" data-id="${doc.id}">✏️</button>
                        ${deleteBtnHtml}
                    </div>
                </td>
            `;

            tr.querySelector('.btn-toggle-scope').addEventListener('click', async (e) => {
                const btn = e.currentTarget;
                const currentScope = btn.dataset.scope || 'yurtici';
                const nextScope = currentScope === 'yurtdisi' ? 'yurtici' : 'yurtdisi';
                await quickUpdateDocStatus(doc.id, { shipping_scope: nextScope }, btn);
            });

            tr.querySelector('.btn-toggle-payment').addEventListener('click', async (e) => {
                const btn = e.currentTarget;
                const currentPaid = btn.dataset.paid === '1';
                const nextPaid = currentPaid ? 0 : 1;
                await quickUpdateDocStatus(doc.id, { is_paid: nextPaid }, btn);
            });

            tr.querySelector('.btn-archive-print').addEventListener('click', () => {
                window.open(`/admin/print?id=${doc.id}`, '_blank');
            });

            tr.querySelector('.btn-archive-edit').addEventListener('click', () => {
                editDocument(doc);
            });

            const delBtn = tr.querySelector('.btn-archive-delete');
            if (delBtn) {
                delBtn.addEventListener('click', () => {
                    deleteDocument(doc.id, doc.doc_number);
                });
            }

            archiveTableBody.appendChild(tr);
        });
    }

    if (archiveSearchInput) archiveSearchInput.addEventListener('input', debounce(loadArchiveDocuments, 300));
    if (archiveStartDate) archiveStartDate.addEventListener('change', loadArchiveDocuments);
    if (archiveEndDate) archiveEndDate.addEventListener('change', loadArchiveDocuments);
    if (archiveScopeFilter) archiveScopeFilter.addEventListener('change', loadArchiveDocuments);
    if (archivePaymentFilter) archivePaymentFilter.addEventListener('change', loadArchiveDocuments);

    function editDocument(doc) {
        editingDocId = doc.id;
        document.getElementById('docNumberInput').value = doc.doc_number;
        document.getElementById('docDateInput').value = doc.doc_date;
        document.getElementById('companyNameInput').value = doc.company_name;
        document.getElementById('fromLocInput').value = doc.from_location || '';
        document.getElementById('toLocInput').value = doc.to_location || '';
        document.getElementById('plateInput').value = doc.plate_number || '';
        document.getElementById('driverInput').value = doc.driver_info || '';
        document.getElementById('priceInput').value = doc.price || 0;
        document.getElementById('currencySelect').value = doc.currency || 'TRY';
        document.getElementById('invoiceInput').value = doc.invoice_info || '';
        document.getElementById('notesInput').value = doc.notes || '';

        const scopeSelect = document.getElementById('shippingScopeSelect');
        if (scopeSelect) scopeSelect.value = doc.shipping_scope || 'yurtici';
        const paidSelect = document.getElementById('isPaidSelect');
        if (paidSelect) paidSelect.value = doc.is_paid == 1 ? '1' : '0';

        customFieldsContainer.innerHTML = '';
        let customFields = [];
        try {
            customFields = JSON.parse(doc.custom_fields_json || '[]');
        } catch (e) {}
        customFields.forEach(f => addCustomFieldRow(f.key, f.val));

        document.getElementById('builderFormTitle').innerHTML = `<span>✏️ Belge Düzenle: <span style="color:var(--adm-primary);">${escapeHtml(doc.doc_number)}</span></span>`;

        switchTab('builder');
        updateLivePreview();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function deleteDocument(id, docNumber) {
        if (confirm(`"${docNumber}" numaralı belgeyi silmek istediğinize emin misiniz?`)) {
            try {
                const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
                const data = await res.json();
                if (res.ok && data.success) {
                    loadArchiveDocuments();
                } else {
                    alert(data.error || 'Belge silinemedi.');
                }
            } catch (err) {
                alert('Silme sırasında hata oluştu.');
            }
        }
    }

    // Initialize Default Date
    const today = new Date().toISOString().split('T')[0];
    const docDateInput = document.getElementById('docDateInput');
    if (docDateInput) docDateInput.value = today;
    updateLivePreview();

    /* ==========================================================================
       11. SNAPCHAT-STYLE WORLD MAP (SNAPMAP)
       ========================================================================== */
    function initSnapMap() {
        const mapContainer = document.getElementById('snapWorldMap');
        if (!mapContainer || typeof L === 'undefined') return;

        // Create Leaflet Map with CartoDB Dark Matter tiles
        snapMap = L.map('snapWorldMap', {
            center: [41.0, 29.0],
            zoom: 5,
            minZoom: 2,
            maxZoom: 18,
            zoomControl: true
        });

        // Dark Base Canvas (Esri ArcGIS World Dark Gray Base - No API key needed, zero watermark, high performance)
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
            maxNativeZoom: 16,
            maxZoom: 18
        }).addTo(snapMap);

        // Labels, Borders and Major Roads Overlay
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
            attribution: '',
            maxNativeZoom: 16,
            maxZoom: 18
        }).addTo(snapMap);

        // Map Click Event (for Location Picking Mode)
        snapMap.on('click', (e) => {
            if (isPickingLocation) {
                const lat = e.latlng.lat.toFixed(4);
                const lng = e.latlng.lng.toFixed(4);

                document.getElementById('contactLatInput').value = lat;
                document.getElementById('contactLngInput').value = lng;
                const locNameInput = document.getElementById('contactLocNameInput');
                if (!locNameInput.value.trim()) {
                    locNameInput.value = `Konum (${lat}, ${lng})`;
                }

                cancelLocationPicker();
                document.getElementById('contactModal').classList.add('active');
            }
        });

        // Close Detail Card Button
        const btnCloseCard = document.getElementById('btnCloseCard');
        if (btnCloseCard) {
            btnCloseCard.addEventListener('click', () => {
                document.getElementById('mapContactDetailCard').style.display = 'none';
            });
        }

        // Reset View Button
        const btnResetMapView = document.getElementById('btnResetMapView');
        if (btnResetMapView) {
            btnResetMapView.addEventListener('click', () => {
                if (mapMarkers.length > 0) {
                    const group = L.featureGroup(mapMarkers.map(m => m.marker));
                    snapMap.fitBounds(group.getBounds().pad(0.2));
                } else {
                    snapMap.setView([41.0, 29.0], 5);
                }
            });
        }

        // Search Bar on Map
        const mapSearchInput = document.getElementById('mapSearchInput');
        if (mapSearchInput) {
            mapSearchInput.addEventListener('input', (e) => {
                filterMapMarkers(e.target.value.trim().toLowerCase());
            });
        }

        // Add Contact from Map Button
        const btnOpenAddContactFromMap = document.getElementById('btnOpenAddContactFromMap');
        if (btnOpenAddContactFromMap) {
            btnOpenAddContactFromMap.addEventListener('click', () => {
                openContactModal();
            });
        }

        // Render markers if contacts already loaded
        renderMapPins(allContacts);
    }

    function renderMapPins(contacts) {
        if (!snapMap || typeof L === 'undefined') return;

        // Clear existing markers
        mapMarkers.forEach(m => snapMap.removeLayer(m.marker));
        mapMarkers = [];

        let pinsCount = 0;

        contacts.forEach(contact => {
            if (contact.latitude && contact.longitude) {
                pinsCount++;
                const lat = parseFloat(contact.latitude);
                const lng = parseFloat(contact.longitude);

                // Initials
                const displayName = contact.name || contact.company_name || 'RO';
                const words = displayName.trim().split(/\s+/);
                const initials = words.length > 1
                    ? (words[0][0] + words[1][0]).toUpperCase()
                    : displayName.substring(0, 2).toUpperCase();

                // Status Icon
                let statusIcon = '🟢';
                if (contact.status === 'transit') statusIcon = '🚚';
                else if (contact.status === 'pending') statusIcon = '⏳';
                else if (contact.status === 'completed') statusIcon = '✅';

                const avatarColor = contact.avatar_color || '#FF6500';

                // Snapchat Pulsing Custom HTML DivIcon
                const iconHtml = `
                    <div class="snap-marker-container">
                        <div class="snap-marker-pulse" style="background:${avatarColor};"></div>
                        <div class="snap-marker-body" style="background:${avatarColor};">
                            ${escapeHtml(initials)}
                            <span class="snap-marker-badge">${statusIcon}</span>
                        </div>
                    </div>
                `;

                const customIcon = L.divIcon({
                    html: iconHtml,
                    className: 'snap-leaflet-marker',
                    iconSize: [44, 44],
                    iconAnchor: [22, 22]
                });

                const marker = L.marker([lat, lng], { icon: customIcon }).addTo(snapMap);

                marker.on('click', () => {
                    openContactDetailCard(contact);
                    snapMap.panTo([lat, lng], { animate: true });
                });

                mapMarkers.push({
                    contact,
                    marker
                });
            }
        });

        const badge = document.getElementById('mapPinsCountBadge');
        if (badge) badge.textContent = `${pinsCount} Konum`;
    }

    function filterMapMarkers(query) {
        let visibleCount = 0;
        mapMarkers.forEach(item => {
            const c = item.contact;
            const searchString = `${c.name || ''} ${c.company_name || ''} ${c.from_location || ''} ${c.to_location || ''} ${c.location_name || ''} ${c.notes || ''}`.toLowerCase();
            const matches = !query || searchString.includes(query);

            if (matches) {
                if (!snapMap.hasLayer(item.marker)) {
                    snapMap.addLayer(item.marker);
                }
                visibleCount++;
            } else {
                if (snapMap.hasLayer(item.marker)) {
                    snapMap.removeLayer(item.marker);
                }
            }
        });

        const badge = document.getElementById('mapPinsCountBadge');
        if (badge) badge.textContent = `${visibleCount} Konum`;
    }

    function openContactDetailCard(contact) {
        const card = document.getElementById('mapContactDetailCard');
        if (!card) return;

        const displayName = contact.name || contact.company_name || 'İsimsiz Kişi';
        const words = displayName.trim().split(/\s+/);
        const initials = words.length > 1
            ? (words[0][0] + words[1][0]).toUpperCase()
            : displayName.substring(0, 2).toUpperCase();

        const cardAvatar = document.getElementById('cardAvatar');
        cardAvatar.textContent = initials;
        cardAvatar.style.background = contact.avatar_color || '#FF6500';

        document.getElementById('cardName').textContent = displayName;
        document.getElementById('cardCompany').textContent = contact.company_name || 'Firma Belirtilmedi';

        // Status badge
        const statusBadge = document.getElementById('cardStatusBadge');
        if (contact.status === 'transit') {
            statusBadge.className = 'snapmap-card-status badge-status-transit';
            statusBadge.textContent = '🚚 Yolda / Sevkiyatta';
        } else if (contact.status === 'pending') {
            statusBadge.className = 'snapmap-card-status badge-status-pending';
            statusBadge.textContent = '⏳ Beklemede';
        } else if (contact.status === 'completed') {
            statusBadge.className = 'snapmap-card-status badge-status-completed';
            statusBadge.textContent = '✅ Tamamlandı';
        } else {
            statusBadge.className = 'snapmap-card-status badge-status-active';
            statusBadge.textContent = '🟢 Aktif Ortak';
        }

        // Route & details
        document.getElementById('cardFromLoc').textContent = contact.from_location || 'Belirtilmedi';
        document.getElementById('cardToLoc').textContent = contact.to_location || 'Belirtilmedi';
        document.getElementById('cardCargo').textContent = contact.cargo_type || '-';
        document.getElementById('cardPlate').textContent = contact.plate_number || '-';
        document.getElementById('cardLocationName').textContent = contact.location_name || `${contact.latitude || '-'}, ${contact.longitude || '-'}`;
        document.getElementById('cardPhone').textContent = contact.phone || '-';

        // Call Button
        const btnCardCall = document.getElementById('btnCardCall');
        if (contact.phone) {
            btnCardCall.href = `tel:${contact.phone.replace(/\s+/g, '')}`;
            btnCardCall.style.display = 'inline-flex';
        } else {
            btnCardCall.style.display = 'none';
        }

        // Notes
        const cardNotes = document.getElementById('cardNotes');
        cardNotes.textContent = contact.notes || 'Bu kişiyle alakalı herhangi bir özel operasyonel not girilmedi.';

        // Edit button
        const btnCardEditContact = document.getElementById('btnCardEditContact');
        btnCardEditContact.onclick = () => {
            openContactModal(contact);
        };

        card.style.display = 'block';
    }

    // Location Picker on Map
    const btnPickLocationOnMap = document.getElementById('btnPickLocationOnMap');
    const mapPickerBanner = document.getElementById('mapLocationPickerBanner');
    const btnCancelLocationPicker = document.getElementById('btnCancelLocationPicker');

    function startLocationPicker() {
        isPickingLocation = true;
        document.getElementById('contactModal').classList.remove('active');
        if (mapPickerBanner) mapPickerBanner.style.display = 'flex';
        switchTab('snapmap');
    }

    function cancelLocationPicker() {
        isPickingLocation = false;
        if (mapPickerBanner) mapPickerBanner.style.display = 'none';
    }

    if (btnPickLocationOnMap) {
        btnPickLocationOnMap.addEventListener('click', startLocationPicker);
    }

    if (btnCancelLocationPicker) {
        btnCancelLocationPicker.addEventListener('click', () => {
            cancelLocationPicker();
            document.getElementById('contactModal').classList.add('active');
        });
    }

    /* ==========================================================================
       12. CONTACTS & PARTNERS MANAGEMENT
       ========================================================================== */
    const contactsTableBody = document.getElementById('contactsTableBody');
    const contactsSearchInput = document.getElementById('contactsSearchInput');
    const contactModal = document.getElementById('contactModal');
    const btnNewContact = document.getElementById('btnNewContact');
    const btnCloseContactModal = document.getElementById('btnCloseContactModal');
    const contactForm = document.getElementById('contactForm');

    // Color picker
    const colorChoices = document.querySelectorAll('.color-choice');
    colorChoices.forEach(choice => {
        choice.addEventListener('click', () => {
            colorChoices.forEach(c => c.classList.remove('active'));
            choice.classList.add('active');
            selectedAvatarColor = choice.dataset.color;
        });
    });

    async function loadContacts() {
        const query = contactsSearchInput ? contactsSearchInput.value.trim() : '';
        const params = new URLSearchParams();
        if (query) params.append('search', query);

        try {
            const res = await fetch(`/api/contacts?${params.toString()}`);
            const data = await res.json();

            if (res.ok && data.success) {
                allContacts = data.data;
                renderContactsTable(allContacts);
                const badge = document.getElementById('contactsCountBadge');
                if (badge) badge.textContent = `${allContacts.length} Kişi`;

                if (snapMap) {
                    renderMapPins(allContacts);
                }
            }
        } catch (err) {
            console.error('Error loading contacts:', err);
        }
    }

    function renderContactsTable(contacts) {
        if (!contactsTableBody) return;
        contactsTableBody.innerHTML = '';

        if (contacts.length === 0) {
            contactsTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 36px; color: var(--adm-text-muted);">
                        Kayıtlı kişi veya iş ortağı bulunamadı.
                    </td>
                </tr>
            `;
            return;
        }

        contacts.forEach(c => {
            const tr = document.createElement('tr');
            const displayName = c.name || c.company_name || 'İsimsiz Kayıt';
            const words = displayName.trim().split(/\s+/);
            const initials = words.length > 1
                ? (words[0][0] + words[1][0]).toUpperCase()
                : displayName.substring(0, 2).toUpperCase();

            const locationBadge = (c.latitude && c.longitude)
                ? `<button class="btn-nav-outline btn-focus-map" data-id="${c.id}" style="padding: 4px 8px; font-size: 0.72rem;">📍 ${escapeHtml(c.location_name || 'Haritada Gör')}</button>`
                : `<span style="color:#64748b; font-size:0.75rem;">Konum Yok</span>`;

            tr.innerHTML = `
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 34px; height: 34px; border-radius: 50%; background: ${c.avatar_color || '#FF6500'}; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.8rem;">
                            ${escapeHtml(initials)}
                        </div>
                        <div>
                            <strong>${escapeHtml(c.name || '-')}</strong>
                            <div style="font-size:0.75rem; color:var(--adm-text-muted);">${escapeHtml(c.company_name || '-')}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div>${c.phone ? `<a href="tel:${c.phone}" style="color:var(--adm-primary); font-weight:600;">📞 ${escapeHtml(c.phone)}</a>` : '-'}</div>
                    <small style="color:var(--adm-text-muted);">${escapeHtml(c.email || '')}</small>
                </td>
                <td>
                    <strong>${escapeHtml(c.from_location || '-')}</strong> &rarr; <strong>${escapeHtml(c.to_location || '-')}</strong>
                </td>
                <td>
                    <div>${escapeHtml(c.cargo_type || '-')}</div>
                    <small style="color:var(--adm-text-muted);">${escapeHtml(c.plate_number || '')}</small>
                </td>
                <td>${locationBadge}</td>
                <td>
                    <div style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.8rem; color: #cbd5e1;" title="${escapeHtml(c.notes || '')}">
                        ${escapeHtml(c.notes || '-')}
                    </div>
                </td>
                <td>
                    <div class="table-actions-cell">
                        <button class="btn-icon-action btn-contact-edit" title="Düzenle" data-id="${c.id}">✏️</button>
                        <button class="btn-icon-action btn-icon-delete btn-contact-delete" title="Sil" data-id="${c.id}">🗑️</button>
                    </div>
                </td>
            `;

            // Focus on map action
            const mapBtn = tr.querySelector('.btn-focus-map');
            if (mapBtn) {
                mapBtn.addEventListener('click', () => {
                    switchTab('snapmap');
                    setTimeout(() => {
                        const targetMarkerObj = mapMarkers.find(m => m.contact.id === c.id);
                        if (targetMarkerObj && snapMap) {
                            snapMap.setView([parseFloat(c.latitude), parseFloat(c.longitude)], 9, { animate: true });
                            openContactDetailCard(c);
                        }
                    }, 300);
                });
            }

            // Edit
            tr.querySelector('.btn-contact-edit').addEventListener('click', () => {
                openContactModal(c);
            });

            // Delete
            tr.querySelector('.btn-contact-delete').addEventListener('click', () => {
                deleteContact(c.id, displayName);
            });

            contactsTableBody.appendChild(tr);
        });
    }

    if (contactsSearchInput) {
        contactsSearchInput.addEventListener('input', debounce(loadContacts, 300));
    }

    function openContactModal(contact = null) {
        contactForm.reset();
        document.getElementById('contactIdInput').value = contact ? contact.id : '';
        document.getElementById('contactModalTitle').textContent = contact ? '✏️ Kişi Bilgilerini Düzenle' : '👥 Yeni Kişi / İş Ortağı Ekle';

        selectedAvatarColor = (contact && contact.avatar_color) ? contact.avatar_color : '#FF6500';
        colorChoices.forEach(c => {
            c.classList.toggle('active', c.dataset.color.toLowerCase() === selectedAvatarColor.toLowerCase());
        });

        if (contact) {
            document.getElementById('contactNameInput').value = contact.name || '';
            document.getElementById('contactCompanyInput').value = contact.company_name || '';
            document.getElementById('contactPhoneInput').value = contact.phone || '';
            document.getElementById('contactEmailInput').value = contact.email || '';
            document.getElementById('contactFromLocInput').value = contact.from_location || '';
            document.getElementById('contactToLocInput').value = contact.to_location || '';
            document.getElementById('contactCargoInput').value = contact.cargo_type || '';
            document.getElementById('contactPlateInput').value = contact.plate_number || '';
            document.getElementById('contactStatusSelect').value = contact.status || 'active';
            document.getElementById('contactLocNameInput').value = contact.location_name || '';
            document.getElementById('contactLatInput').value = contact.latitude !== null ? contact.latitude : '';
            document.getElementById('contactLngInput').value = contact.longitude !== null ? contact.longitude : '';
            document.getElementById('contactNotesInput').value = contact.notes || '';
        }

        contactModal.classList.add('active');
    }

    if (btnNewContact) {
        btnNewContact.addEventListener('click', () => openContactModal());
    }

    if (btnCloseContactModal) {
        btnCloseContactModal.addEventListener('click', () => contactModal.classList.remove('active'));
    }

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const contactId = document.getElementById('contactIdInput').value;
            const latVal = document.getElementById('contactLatInput').value;
            const lngVal = document.getElementById('contactLngInput').value;

            const payload = {
                name: document.getElementById('contactNameInput').value.trim(),
                companyName: document.getElementById('contactCompanyInput').value.trim(),
                phone: document.getElementById('contactPhoneInput').value.trim(),
                email: document.getElementById('contactEmailInput').value.trim(),
                fromLocation: document.getElementById('contactFromLocInput').value.trim(),
                toLocation: document.getElementById('contactToLocInput').value.trim(),
                cargoType: document.getElementById('contactCargoInput').value.trim(),
                plateNumber: document.getElementById('contactPlateInput').value.trim(),
                status: document.getElementById('contactStatusSelect').value,
                avatarColor: selectedAvatarColor,
                locationName: document.getElementById('contactLocNameInput').value.trim(),
                latitude: latVal ? parseFloat(latVal) : null,
                longitude: lngVal ? parseFloat(lngVal) : null,
                notes: document.getElementById('contactNotesInput').value.trim()
            };

            const url = contactId ? `/api/contacts/${contactId}` : '/api/contacts';
            const method = contactId ? 'PUT' : 'POST';

            try {
                const res = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();

                if (res.ok && data.success) {
                    contactModal.classList.remove('active');
                    loadContacts();
                } else {
                    alert(data.error || 'Kayıt sırasında hata oluştu.');
                }
            } catch (err) {
                alert('Sunucu hatası.');
            }
        });
    }

    async function deleteContact(id, name) {
        if (confirm(`"${name}" kişisini silmek istediğinize emin misiniz?`)) {
            try {
                const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
                const data = await res.json();
                if (res.ok && data.success) {
                    loadContacts();
                    const card = document.getElementById('mapContactDetailCard');
                    if (card) card.style.display = 'none';
                } else {
                    alert(data.error || 'Silinemedi.');
                }
            } catch (err) {
                alert('Silme sırasında hata oluştu.');
            }
        }
    }

    /* ==========================================================================
       13. WORKER MANAGEMENT (ADMIN ONLY)
       ========================================================================== */
    const workersTableBody = document.getElementById('workersTableBody');
    const workerModal = document.getElementById('workerModal');
    const btnNewWorker = document.getElementById('btnNewWorker');
    const btnCloseWorkerModal = document.getElementById('btnCloseWorkerModal');
    const workerForm = document.getElementById('workerForm');
    const workerAlert = document.getElementById('workerAlert');

    const workerPassModal = document.getElementById('workerPassModal');
    const btnCloseWorkerPassModal = document.getElementById('btnCloseWorkerPassModal');
    const workerPassForm = document.getElementById('workerPassForm');
    const workerPassAlert = document.getElementById('workerPassAlert');

    async function loadWorkers() {
        if (!workersTableBody) return;
        try {
            const res = await fetch('/api/admin/workers');
            const data = await res.json();

            if (res.ok && data.success) {
                renderWorkersTable(data.data);
            }
        } catch (err) {
            console.error('Error loading workers:', err);
        }
    }

    function renderWorkersTable(workers) {
        if (!workersTableBody) return;
        workersTableBody.innerHTML = '';

        workers.forEach(w => {
            const tr = document.createElement('tr');
            const isSelf = currentUser && currentUser.id === w.id;
            const isAdminRole = w.role === 'admin';

            const statusClass = w.is_active === 1 ? 'is-active' : 'is-passive';
            const statusText = w.is_active === 1 ? '🟢 Aktif' : '🔴 Pasif';
            const statusDisabled = isSelf ? 'disabled title="Kendi hesabınızı pasife alamazsınız."' : '';

            const deleteBtnHtml = (!isSelf && !isAdminRole)
                ? `<button class="btn-icon-action btn-icon-delete btn-worker-delete" title="Hesabı Sil" data-id="${w.id}">🗑️</button>`
                : '';

            tr.innerHTML = `
                <td>
                    <strong>${escapeHtml(w.username)}</strong>
                    ${isSelf ? '<span class="tab-badge" style="margin-left:6px;">Siz</span>' : ''}
                </td>
                <td>${escapeHtml(w.full_name || '-')}</td>
                <td>
                    <span class="nav-user-role-badge ${w.role === 'worker' ? 'role-worker' : ''}">
                        ${w.role === 'admin' ? 'YÖNETİCİ' : 'ÇALIŞAN'}
                    </span>
                </td>
                <td>
                    <button class="worker-status-toggle ${statusClass} btn-toggle-status" data-id="${w.id}" data-status="${w.is_active}" ${statusDisabled}>
                        ${statusText}
                    </button>
                </td>
                <td><small style="color:var(--adm-text-muted);">${formatDate(w.created_at)}</small></td>
                <td>
                    <div class="table-actions-cell">
                        <button class="btn-icon-action btn-worker-reset-pass" title="Şifre Belirle / Sıfırla" data-id="${w.id}" data-username="${escapeHtml(w.username)}">🔑</button>
                        ${deleteBtnHtml}
                    </div>
                </td>
            `;

            // Toggle active status
            const toggleBtn = tr.querySelector('.btn-toggle-status');
            if (toggleBtn && !isSelf) {
                toggleBtn.addEventListener('click', async () => {
                    try {
                        const res = await fetch(`/api/admin/workers/${w.id}/toggle-status`, { method: 'PUT' });
                        const data = await res.json();
                        if (res.ok && data.success) {
                            loadWorkers();
                        } else {
                            alert(data.error || 'Durum değiştirilemedi.');
                        }
                    } catch (err) {
                        alert('Hata oluştu.');
                    }
                });
            }

            // Reset password
            tr.querySelector('.btn-worker-reset-pass').addEventListener('click', () => {
                document.getElementById('resetWorkerId').value = w.id;
                document.getElementById('resetWorkerNameSpan').textContent = `${w.username} (${w.full_name || ''})`;
                workerPassForm.reset();
                workerPassAlert.style.display = 'none';
                workerPassModal.classList.add('active');
            });

            // Delete
            const delBtn = tr.querySelector('.btn-worker-delete');
            if (delBtn) {
                delBtn.addEventListener('click', async () => {
                    if (confirm(`"${w.username}" çalışan hesabını silmek istediğinize emin misiniz?`)) {
                        try {
                            const res = await fetch(`/api/admin/workers/${w.id}`, { method: 'DELETE' });
                            const data = await res.json();
                            if (res.ok && data.success) {
                                loadWorkers();
                            } else {
                                alert(data.error || 'Silinemedi.');
                            }
                        } catch (err) {
                            alert('Hata oluştu.');
                        }
                    }
                });
            }

            workersTableBody.appendChild(tr);
        });
    }

    // New Worker Form
    if (btnNewWorker) {
        btnNewWorker.addEventListener('click', () => {
            workerForm.reset();
            workerAlert.style.display = 'none';
            workerModal.classList.add('active');
        });
    }

    if (btnCloseWorkerModal) {
        btnCloseWorkerModal.addEventListener('click', () => workerModal.classList.remove('active'));
    }

    if (workerForm) {
        workerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            workerAlert.style.display = 'none';

            const username = document.getElementById('workerUsernameInput').value.trim();
            const fullName = document.getElementById('workerFullNameInput').value.trim();
            const password = document.getElementById('workerPasswordInput').value;

            try {
                const res = await fetch('/api/admin/workers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, fullName, password })
                });
                const data = await res.json();

                if (res.ok && data.success) {
                    alert('Yeni çalışan başarıyla kaydedildi.');
                    workerModal.classList.remove('active');
                    loadWorkers();
                } else {
                    workerAlert.className = 'alert-box alert-danger';
                    workerAlert.textContent = data.error || 'Çalışan kaydedilemedi.';
                    workerAlert.style.display = 'block';
                }
            } catch (err) {
                workerAlert.className = 'alert-box alert-danger';
                workerAlert.textContent = 'Sunucu hatası oluştu.';
                workerAlert.style.display = 'block';
            }
        });
    }

    // Reset Worker Password Form
    if (btnCloseWorkerPassModal) {
        btnCloseWorkerPassModal.addEventListener('click', () => workerPassModal.classList.remove('active'));
    }

    if (workerPassForm) {
        workerPassForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            workerPassAlert.style.display = 'none';

            const workerId = document.getElementById('resetWorkerId').value;
            const newPassword = document.getElementById('resetNewPassInput').value;
            const newPasswordConfirm = document.getElementById('resetNewPassConfirmInput').value;

            if (newPassword !== newPasswordConfirm) {
                workerPassAlert.className = 'alert-box alert-danger';
                workerPassAlert.textContent = 'Şifreler birbiriyle eşleşmiyor.';
                workerPassAlert.style.display = 'block';
                return;
            }

            try {
                const res = await fetch(`/api/admin/workers/${workerId}/reset-password`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ newPassword })
                });
                const data = await res.json();

                if (res.ok && data.success) {
                    alert('Çalışanın şifresi başarıyla güncellendi.');
                    workerPassModal.classList.remove('active');
                } else {
                    workerPassAlert.className = 'alert-box alert-danger';
                    workerPassAlert.textContent = data.error || 'Şifre güncellenemedi.';
                    workerPassAlert.style.display = 'block';
                }
            } catch (err) {
                workerPassAlert.className = 'alert-box alert-danger';
                workerPassAlert.textContent = 'Sunucu hatası oluştu.';
                workerPassAlert.style.display = 'block';
            }
        });
    }
}

/* ==========================================================================
   3. PRINT / PDF VIEW LOGIC
   ========================================================================== */
function initPrintPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const docId = urlParams.get('id');

    if (!docId) {
        alert('Görüntülenecek belge bulunamadı.');
        window.location.href = '/admin';
        return;
    }

    fetch(`/api/documents/${docId}`)
        .then(res => res.json())
        .then(data => {
            if (!data.success || !data.data) {
                alert('Belge bulunamadı.');
                return;
            }
            renderPrintDocument(data.data);
            fetch(`/api/documents/${docId}/print-log`, { method: 'POST' }).catch(() => {});
        })
        .catch(() => {
            alert('Belge yüklenirken hata oluştu.');
        });

    const btnTriggerPrint = document.getElementById('btnTriggerPrint');
    if (btnTriggerPrint) {
        btnTriggerPrint.addEventListener('click', () => {
            window.print();
        });
    }
}

function renderPrintDocument(doc) {
    document.title = `${doc.doc_number} - Roads-on Operasyon Belgesi`;
    document.getElementById('printDocNo').textContent = doc.doc_number;
    document.getElementById('printDocDate').textContent = doc.doc_date;
    document.getElementById('printCompany').textContent = doc.company_name;
    document.getElementById('printRoute').textContent = `${doc.from_location || '-'} → ${doc.to_location || '-'}`;
    document.getElementById('printPlate').textContent = doc.plate_number || '-';
    document.getElementById('printDriver').textContent = doc.driver_info || '-';
    document.getElementById('printPrice').textContent = `${(parseFloat(doc.price) || 0).toLocaleString('tr-TR')} ${doc.currency || 'TRY'}`;
    document.getElementById('printInvoice').textContent = doc.invoice_info || '-';

    let customFields = [];
    try {
        customFields = JSON.parse(doc.custom_fields_json || '[]');
    } catch (e) {}

    const customFieldsTbody = document.getElementById('printCustomFieldsTbody');
    customFieldsTbody.innerHTML = '';
    customFields.forEach(f => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <th>${escapeHtml(f.key)}</th>
            <td colspan="3">${escapeHtml(f.val || '-')}</td>
        `;
        customFieldsTbody.appendChild(tr);
    });

    const notesContainer = document.getElementById('printNotes');
    notesContainer.textContent = doc.notes || 'Herhangi bir ek operasyonel şart belirtilmemiştir.';

    const now = new Date();
    document.getElementById('printTimestamp').textContent = `Yazdırma / Çıktı Tarihi: ${now.toLocaleDateString('tr-TR')} ${now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
}

/* Helper Functions */
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('tr-TR')} ${d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
