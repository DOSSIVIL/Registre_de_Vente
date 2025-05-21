document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si l'utilisateur est connecté
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // Afficher les informations de l'utilisateur
    document.getElementById('username-display').textContent = currentUser.username;
    document.getElementById('user-email').textContent = currentUser.email;

    // Vérifier si c'est un admin
    if (currentUser.username === 'admin') {
        document.getElementById('admin-link').style.display = 'block';
    }

    // Initialiser IndexedDB
    let db;
    const DB_NAME = 'SalesDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'sales';

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = function(event) {
        console.error('Erreur IndexedDB:', event.target.error);
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        loadSales();
    };

    request.onupgradeneeded = function(event) {
        const db = event.target.result;
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('client', 'client', { unique: false });
    };

   // Navigation entre les sections
    document.querySelectorAll('.sidebar nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Met à jour l'élément actif dans la sidebar
            document.querySelector('.sidebar nav li.active').classList.remove('active');
            this.parentElement.classList.add('active');
            
            // Récupère l'ID de la section cible
            const sectionId = this.getAttribute('href').substring(1);
            
            // Masque toutes les sections
            document.querySelectorAll('.content-section').forEach(section => {
                section.style.display = 'none';
            });

            // Affiche la section correspondante
            switch(sectionId) {
                case 'sales':
                    document.getElementById('sales-section').style.display = 'block';
                    document.getElementById('page-title').textContent = 'Gestion des Ventes';
                    loadSales(); // Fonction à définir si ce n'est pas encore fait
                    break;
                case 'add-sale':
                    document.getElementById('add-sale-section').style.display = 'block';
                    document.getElementById('page-title').textContent = 'Nouvelle Vente';
                    loadDraft(); // Fonction à définir si ce n'est pas encore fait
                    break;
                case 'customers':
                    document.getElementById('add-customer-section').style.display = 'block';
                    document.getElementById('page-title').textContent = 'Gestion des Clients';
                    loadCustomers?.(); // Si tu as une fonction pour charger les clients
                    break;
                case 'reports':
                    document.getElementById('reports-section').style.display = 'block';
                    document.getElementById('page-title').textContent = 'Rapports et Statistiques';
                    loadReports?.(); // Si tu as une fonction de génération de rapports
                    break;
                case 'admin':
                    document.getElementById('admin-section').style.display = 'block';
                    document.getElementById('page-title').textContent = 'Administration';
                    break;
            }
        });
    });

    // Calcul du total automatique
    document.getElementById('product-quantity').addEventListener('input', calculateTotal);
    document.getElementById('unit-price').addEventListener('input', calculateTotal);

    function calculateTotal() {
        const quantity = parseFloat(document.getElementById('product-quantity').value) || 0;
        const unitPrice = parseFloat(document.getElementById('unit-price').value) || 0;
        const total = quantity * unitPrice;
        document.getElementById('total-price').value = total.toFixed(2);
    }

    // Gestion du formulaire de vente
    document.getElementById('sale-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveSale(false);
    });

    // Sauvegarder brouillon
    document.getElementById('save-draft').addEventListener('click', function() {
        saveSale(true);
    });

    function saveSale(isDraft) {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const sale = {
            product: document.getElementById('product-name').value,
            quantity: parseFloat(document.getElementById('product-quantity').value),
            unitPrice: parseFloat(document.getElementById('unit-price').value),
            total: parseFloat(document.getElementById('total-price').value),
            client: document.getElementById('client-name').value,
            date: document.getElementById('sale-date').value || new Date().toISOString(),
            isDraft: isDraft
        };

        const request = store.add(sale);

        request.onsuccess = function() {
            if (isDraft) {
                sessionStorage.setItem('saleDraft', JSON.stringify(sale));
                showNotification('Brouillon sauvegardé', 'success');
            } else {
                sessionStorage.removeItem('saleDraft');
                showNotification('Vente enregistrée avec succès', 'success');
                resetForm();
                document.querySelector('.sidebar nav li:nth-child(1)').click();
            }
        };

        request.onerror = function(event) {
            console.error('Erreur:', event.target.error);
            showNotification('Erreur lors de l\'enregistrement', 'error');
        };
    }

    function loadDraft() {
        const draft = sessionStorage.getItem('saleDraft');
        if (draft) {
            const sale = JSON.parse(draft);
            document.getElementById('product-name').value = sale.product;
            document.getElementById('product-quantity').value = sale.quantity;
            document.getElementById('unit-price').value = sale.unitPrice;
            document.getElementById('total-price').value = sale.total;
            document.getElementById('client-name').value = sale.client;
            document.getElementById('sale-date').value = sale.date;
        }
    }

    function resetForm() {
        document.getElementById('sale-form').reset();
        document.getElementById('total-price').value = '';
    }

    // Charger les ventes
    function loadSales() {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = function(event) {
            const sales = event.target.result.filter(sale => !sale.isDraft);
            displaySales(sales);
        };
    }

   function displaySales(sales) {
        const tbody = document.querySelector('#sales-table tbody');
        tbody.innerHTML = '';

        sales.sort((a, b) => new Date(b.date) - new Date(a.date));

        sales.forEach(sale => {
            const row = document.createElement('tr');

            const date = new Date(sale.date);
            const formattedDate = date.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            row.innerHTML = `
                <td>${sale.id}</td>
                <td>${sale.product}</td>
                <td>${sale.quantity}</td>
                <td>${sale.unitPrice.toFixed(2)} €</td>
                <td>${sale.total.toFixed(2)} €</td>
                <td>${formattedDate}</td>
                <td>${sale.client || '-'}</td>
                <td class="action-btns">
                    <button class="action-btn edit-btn" data-id="${sale.id}">
                        <i class='bx bx-edit'></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${sale.id}">
                        <i class='bx bx-trash'></i>
                    </button>
                    <button class="action-btn download-btn" data-id="${sale.id}">
                        <i class='bx bx-download'></i>
                    </button>
                </td>
            `;

            tbody.appendChild(row);
        });

        // ✅ Ouvre le modal de téléchargement
        function openDownloadModal(saleId) {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(saleId);

            request.onsuccess = function (event) {
                const sale = event.target.result;
                if (sale) {
                    // Remplir les infos du modal
                    document.getElementById('download-sale-id').textContent = sale.id;
                    document.getElementById('download-product-name').textContent = sale.product;
                    document.getElementById('download-client-name').textContent = sale.client || '-';
                    document.getElementById('download-modal').dataset.id = sale.id;

                    document.getElementById('download-modal').style.display = 'flex';
                }
            };
        }

        // ✅ Génère le PDF avec jsPDF
       async function downloadSale(saleId) {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(saleId);

            request.onsuccess = function (event) {
                const sale = event.target.result;
                if (!sale) {
                    alert("Vente non trouvée !");
                    return;
                }

                // Récupérer jsPDF depuis la variable UMD
                const { jsPDF } = window.jspdf;

                const doc = new jsPDF();

                doc.setFontSize(18);
                doc.text("Facture de Vente", 70, 20);

                // Préparation des données du tableau
                const tableColumn = ["Détail", "Valeur"];
                const tableRows = [
                    ["ID Vente", sale.id],
                    ["Produit", sale.product],
                    ["Quantité", sale.quantity],
                    ["Prix Unitaire", `${sale.unitPrice.toFixed(2)} €`],
                    ["Client", sale.client || "-"],
                    ["Date", new Date(sale.date).toLocaleString()],
                    ["Total", `${sale.total.toFixed(2)} €`]
                ];

                // La méthode autoTable est attachée au prototype de doc
                doc.autoTable({
                    startY: 30,
                    head: [tableColumn],
                    body: tableRows,
                    styles: { fontSize: 12 },
                    headStyles: { fillColor: [22, 160, 133] },
                    alternateRowStyles: { fillColor: [238, 238, 238] }
                });

                doc.save(`Vente_${sale.id}.pdf`);
                document.getElementById('download-modal').style.display = 'none';
            };
        }

        // Actions
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                openEditModal(parseInt(this.getAttribute('data-id')));
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                if (confirm('Voulez-vous vraiment supprimer cette vente ?')) {
                    deleteSale(parseInt(this.getAttribute('data-id')));
                }
            });
        });

        // ✅ Ouvre le modal de confirmation de téléchargement
        document.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const saleId = parseInt(this.getAttribute('data-id'));
                openDownloadModal(saleId);
            });
        });

        // ✅ Bouton de confirmation dans le modal
        document.getElementById('confirm-download-btn').addEventListener('click', function () {
            const saleId = parseInt(document.getElementById('download-modal').dataset.id);
            downloadSale(saleId);
        });

        // ✅ Ferme le modal de téléchargement
        document.querySelector('.close-download-modal').addEventListener('click', function () {
            document.getElementById('download-modal').style.display = 'none';
        });
    }


    // Ouvrir le modal d'édition
    function openEditModal(saleId) {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(saleId);

        request.onsuccess = function(event) {
            const sale = event.target.result;
            if (sale) {
                document.getElementById('edit-sale-id').value = sale.id;
                document.getElementById('edit-product-name').value = sale.product;
                document.getElementById('edit-product-quantity').value = sale.quantity;
                document.getElementById('edit-unit-price').value = sale.unitPrice;
                document.getElementById('edit-client-name').value = sale.client || '';
                
                const date = new Date(sale.date);
                const formattedDate = date.toISOString().slice(0, 16);
                document.getElementById('edit-sale-date').value = formattedDate;
                
                document.getElementById('edit-modal').style.display = 'flex';
            }
        };
    }

    // Fermer le modal
    document.querySelector('.close-modal').addEventListener('click', function() {
        document.getElementById('edit-modal').style.display = 'none';
    });

    // Gestion du formulaire de modification
    document.getElementById('edit-sale-form').addEventListener('submit', function(e) {
        e.preventDefault();
        updateSale();
    });

    function updateSale() {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const sale = {
            id: parseInt(document.getElementById('edit-sale-id').value),
            product: document.getElementById('edit-product-name').value,
            quantity: parseFloat(document.getElementById('edit-product-quantity').value),
            unitPrice: parseFloat(document.getElementById('edit-unit-price').value),
            total: parseFloat(document.getElementById('edit-product-quantity').value) * 
                   parseFloat(document.getElementById('edit-unit-price').value),
            client: document.getElementById('edit-client-name').value,
            date: document.getElementById('edit-sale-date').value,
            isDraft: false
        };

        const request = store.put(sale);

        request.onsuccess = function() {
            showNotification('Vente modifiée avec succès', 'success');
            document.getElementById('edit-modal').style.display = 'none';
            loadSales();
        };

        request.onerror = function(event) {
            console.error('Erreur:', event.target.error);
            showNotification('Erreur lors de la modification', 'error');
        };
    }

    // Supprimer une vente
    document.getElementById('delete-sale').addEventListener('click', function() {
        if (confirm('Voulez-vous vraiment supprimer cette vente ?')) {
            const saleId = parseInt(document.getElementById('edit-sale-id').value);
            deleteSale(saleId);
            document.getElementById('edit-modal').style.display = 'none';
        }
    });

    function deleteSale(saleId) {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(saleId);

        request.onsuccess = function() {
            showNotification('Vente supprimée avec succès', 'success');
            loadSales();
        };

        request.onerror = function(event) {
            console.error('Erreur:', event.target.error);
            showNotification('Erreur lors de la suppression', 'error');
        };
    }

    // Filtrer les ventes par date
    document.getElementById('apply-filter').addEventListener('click', function() {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;

        if (!startDate || !endDate) {
            showNotification('Veuillez sélectionner une plage de dates', 'warning');
            return;
        }

        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = function(event) {
            const sales = event.target.result.filter(sale => {
                if (sale.isDraft) return false;
                
                const saleDate = new Date(sale.date);
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setDate(end.getDate() + 1); // Inclure le jour de fin
                
                return saleDate >= start && saleDate <= end;
            });
            
            displaySales(sales);
        };
    });

    // Actualiser les ventes
    document.getElementById('refresh-sales').addEventListener('click', loadSales);

    // Déconnexion
    document.getElementById('logout-btn').addEventListener('click', function() {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });

    // Afficher une notification
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    // Initialiser la date du formulaire
    document.getElementById('sale-date').value = new Date().toISOString().slice(0, 16);
});