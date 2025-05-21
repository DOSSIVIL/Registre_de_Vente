document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let currentSection = 'sales';
    let currentUser = JSON.parse(localStorage.getItem('currentUser'));
    let salesChart, productsChart;

    // Sélecteurs
    const sections = {
        sales: document.getElementById('sales-section'),
        addSale: document.getElementById('add-sale-section'),
        customers: document.getElementById('customers-section'),
        addCustomer: document.getElementById('add-customer-section'),
        reports: document.getElementById('reports-section')
    };

    // Initialisation de l'utilisateur
    if (currentUser) {
        document.getElementById('username-display').textContent = currentUser.username;
        document.getElementById('user-email').textContent = currentUser.email;
        
        if (currentUser.role === 'admin') {
            document.getElementById('admin-link').style.display = 'block';
        }
    }

    // Navigation
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('href').substring(1);
            showSection(target);
        });
    });

    function showSection(section) {
        // Masquer toutes les sections
        Object.values(sections).forEach(sec => {
            if (sec) sec.style.display = 'none';
        });
        
        // Afficher la section demandée
        currentSection = section;
        document.getElementById('page-title').textContent = getSectionTitle(section);
        
        switch(section) {
            case 'sales':
                sections.sales.style.display = 'block';
                loadSales();
                break;
            case 'add-sale':
                sections.addSale.style.display = 'block';
                break;
            case 'customers':
                sections.customers.style.display = 'block';
                loadCustomers();
                break;
            case 'reports':
                sections.reports.style.display = 'block';
                generateReport();
                break;
        }
    }

    function getSectionTitle(section) {
        const titles = {
            'sales': 'Gestion des Ventes',
            'add-sale': 'Nouvelle Vente',
            'customers': 'Gestion des Clients',
            'reports': 'Rapports et Statistiques'
        };
        return titles[section] || 'Tableau de Bord';
    }

    // Gestion des clients
    document.getElementById('add-customer')?.addEventListener('click', function() {
        document.getElementById('customer-form').reset();
        document.getElementById('customer-id').value = '';
        document.getElementById('customer-form-title').textContent = 'Nouveau Client';
        sections.customers.style.display = 'none';
        sections.addCustomer.style.display = 'block';
    });

    document.getElementById('cancel-customer')?.addEventListener('click', function() {
        sections.addCustomer.style.display = 'none';
        sections.customers.style.display = 'block';
    });

    document.getElementById('customer-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        saveCustomer();
    });

    function loadCustomers() {
        const userId = currentUser.id;
        const customersKey = `customers_${userId}`;
        const customers = JSON.parse(localStorage.getItem(customersKey)) || [];
        
        const tbody = document.querySelector('#customers-table tbody');
        tbody.innerHTML = '';
        
        customers.forEach(customer => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${customer.id}</td>
                <td>${customer.nom}</td>
                <td>${customer.prenom}</td>
                <td>${customer.email}</td>
                <td>${customer.telephone}</td>
                <td>${customer.entreprise}</td>
                <td>
                    <button class="edit-btn" data-id="${customer.id}"><i class='bx bx-edit'></i></button>
                    <button class="delete-btn" data-id="${customer.id}"><i class='bx bx-trash'></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        // Ajout des événements aux boutons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                editCustomer(parseInt(this.getAttribute('data-id')));
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                deleteCustomer(parseInt(this.getAttribute('data-id')));
            });
        });
    }

    function editCustomer(id) {
        const userId = currentUser.id;
        const customersKey = `customers_${userId}`;
        const customers = JSON.parse(localStorage.getItem(customersKey)) || [];
        const customer = customers.find(c => c.id === id);
        
        if (customer) {
            document.getElementById('customer-id').value = customer.id;
            document.getElementById('customer-lastname').value = customer.nom;
            document.getElementById('customer-firstname').value = customer.prenom;
            document.getElementById('customer-email').value = customer.email;
            document.getElementById('customer-phone').value = customer.telephone;
            document.getElementById('customer-company').value = customer.entreprise;
            document.getElementById('customer-form-title').textContent = 'Modifier Client';
            
            sections.customers.style.display = 'none';
            sections.addCustomer.style.display = 'block';
        }
    }

    function saveCustomer() {
        const userId = currentUser.id;
        const customersKey = `customers_${userId}`;
        let customers = JSON.parse(localStorage.getItem(customersKey)) || [];
        
        const customerData = {
            id: document.getElementById('customer-id').value ? parseInt(document.getElementById('customer-id').value) : generateId(customers),
            nom: document.getElementById('customer-lastname').value,
            prenom: document.getElementById('customer-firstname').value,
            email: document.getElementById('customer-email').value,
            telephone: document.getElementById('customer-phone').value,
            entreprise: document.getElementById('customer-company').value
        };
        
        if (document.getElementById('customer-id').value) {
            // Mise à jour
            const index = customers.findIndex(c => c.id == customerData.id);
            if (index !== -1) {
                customers[index] = customerData;
            }
        } else {
            // Nouveau client
            customers.push(customerData);
        }
        
        localStorage.setItem(customersKey, JSON.stringify(customers));
        
        // Retour à la liste
        sections.addCustomer.style.display = 'none';
        sections.customers.style.display = 'block';
        loadCustomers();
    }

    function deleteCustomer(id) {
        if (confirm('Voulez-vous vraiment supprimer ce client ?')) {
            const userId = currentUser.id;
            const customersKey = `customers_${userId}`;
            let customers = JSON.parse(localStorage.getItem(customersKey)) || [];
            
            customers = customers.filter(c => c.id !== id);
            localStorage.setItem(customersKey, JSON.stringify(customers));
            loadCustomers();
        }
    }

    // Gestion des ventes (existant)
    function loadSales() {
        const userId = currentUser.id;
        const salesKey = `sales_${userId}`;
        const sales = JSON.parse(localStorage.getItem(salesKey)) || [];
        
        const tbody = document.querySelector('#sales-table tbody');
        tbody.innerHTML = '';
        
        sales.forEach(sale => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${sale.id}</td>
                <td>${sale.product}</td>
                <td>${sale.quantity}</td>
                <td>€${sale.unitPrice.toFixed(2)}</td>
                <td>€${(sale.quantity * sale.unitPrice).toFixed(2)}</td>
                <td>${formatDate(sale.date)}</td>
                <td>${sale.client || '-'}</td>
                <td>
                    <button class="edit-btn" data-id="${sale.id}"><i class='bx bx-edit'></i></button>
                    <button class="delete-btn" data-id="${sale.id}"><i class='bx bx-trash'></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        // Ajout des événements aux boutons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                editSale(parseInt(this.getAttribute('data-id')));
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                deleteSale(parseInt(this.getAttribute('data-id')));
            });
        });
    }

    // Gestion des rapports
    document.getElementById('report-period')?.addEventListener('change', function() {
        document.getElementById('custom-period').style.display = 
            this.value === 'custom' ? 'block' : 'none';
    });

    document.getElementById('generate-report')?.addEventListener('click', function() {
        generateReport();
    });

    function generateReport() {
        const userId = currentUser.id;
        const salesKey = `sales_${userId}`;
        const sales = JSON.parse(localStorage.getItem(salesKey)) || [];
        const customersKey = `customers_${userId}`;
        const customers = JSON.parse(localStorage.getItem(customersKey)) || [];
        
        // Calcul des métriques
        const revenue = sales.reduce((sum, sale) => sum + (sale.quantity * sale.unitPrice), 0);
        const salesCount = sales.length;
        const newCustomers = customers.length;
        
        // Mise à jour des cartes de résumé
        document.getElementById('revenue-amount').textContent = `€${revenue.toFixed(2)}`;
        document.getElementById('sales-count').textContent = salesCount;
        document.getElementById('customers-count').textContent = newCustomers;
        
        // Graphique des ventes (groupées par mois)
        const monthlySales = groupSalesByMonth(sales);
        
        const salesCtx = document.getElementById('sales-chart').getContext('2d');
        if (salesChart) salesChart.destroy();
        salesChart = new Chart(salesCtx, {
            type: 'line',
            data: {
                labels: Object.keys(monthlySales),
                datasets: [{
                    label: 'Ventes',
                    data: Object.values(monthlySales),
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
        
        // Graphique des produits (top 5)
        const productSales = groupSalesByProduct(sales);
        const topProducts = Object.entries(productSales)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        const productsCtx = document.getElementById('products-chart').getContext('2d');
        if (productsChart) productsChart.destroy();
        productsChart = new Chart(productsCtx, {
            type: 'bar',
            data: {
                labels: topProducts.map(p => p[0]),
                datasets: [{
                    label: 'Quantité vendue',
                    data: topProducts.map(p => p[1]),
                    backgroundColor: [
                        'rgba(52, 152, 219, 0.7)',
                        'rgba(155, 89, 182, 0.7)',
                        'rgba(46, 204, 113, 0.7)',
                        'rgba(241, 196, 15, 0.7)',
                        'rgba(231, 76, 60, 0.7)'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
        
        // Détails des ventes
        const detailsTbody = document.querySelector('#report-details-table tbody');
        detailsTbody.innerHTML = '';
        
        sales.forEach(sale => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${formatDate(sale.date)}</td>
                <td>${sale.client || '-'}</td>
                <td>${sale.product}</td>
                <td>${sale.quantity}</td>
                <td>€${(sale.quantity * sale.unitPrice).toFixed(2)}</td>
            `;
            detailsTbody.appendChild(tr);
        });
    }

    // Fonctions utilitaires
    function generateId(items) {
        return items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1;
    }

    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('fr-FR', options);
    }

    function groupSalesByMonth(sales) {
        const months = {};
        
        sales.forEach(sale => {
            const date = new Date(sale.date);
            const monthYear = `${date.toLocaleString('fr-FR', { month: 'short' })} ${date.getFullYear()}`;
            
            if (!months[monthYear]) {
                months[monthYear] = 0;
            }
            
            months[monthYear] += sale.quantity * sale.unitPrice;
        });
        
        return months;
    }

    function groupSalesByProduct(sales) {
        const products = {};
        
        sales.forEach(sale => {
            if (!products[sale.product]) {
                products[sale.product] = 0;
            }
            
            products[sale.product] += sale.quantity;
        });
        
        return products;
    }

    // Déconnexion
    document.getElementById('logout-btn')?.addEventListener('click', function() {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });

    // Initialisation
    showSection(currentSection);
});
// Gestion de l'avatar
document.getElementById('avatar-upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        
        reader.onload = function(event) {
            // Mettre à jour l'avatar visuellement
            document.getElementById('user-avatar').style.backgroundImage = `url(${event.target.result})`;
            
            // Sauvegarder dans le localStorage
            const user = JSON.parse(localStorage.getItem('currentUser'));
            user.avatar = event.target.result;
            localStorage.setItem('currentUser', JSON.stringify(user));
        };
        
        reader.readAsDataURL(file);
    }
});

// Au chargement de la page, charger l'avatar s'il existe
window.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user && user.avatar) {
        document.getElementById('user-avatar').style.backgroundImage = `url(${user.avatar})`;
    } else if (user) {
        // Afficher les initiales si pas d'avatar
        const initials = user.username.split(' ').map(name => name[0]).join('').toUpperCase();
        document.getElementById('user-avatar').textContent = initials;
    }
});
