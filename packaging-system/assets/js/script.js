document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    function loadData() {
    // In a real app, you would fetch this from a server
    // For this demo, we'll use the sample data structure
    if (!localStorage.getItem('corrugatedBoxData')) {
        localStorage.setItem('corrugatedBoxData', JSON.stringify(database));
    }
    appData = JSON.parse(localStorage.getItem('corrugatedBoxData'));
}
    initApp();
});

function initApp() {
    // Setup navigation tabs
    setupNavigation();
    
    // Initialize data
    initData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load initial data
    loadDashboardData();
    loadOrdersData();
    loadProductionData();
    loadInventoryData();
    loadReportsData();
    
    // Check for low inventory notifications
    checkInventoryNotifications();
}

// Data structure to hold all application data
let appData = {
    orders: [],
    production: [],
    inventory: [],
    notifications: []
};

function setupNavigation() {
    const tabs = ['dashboard', 'orders', 'production', 'inventory', 'reports'];
    
    tabs.forEach(tab => {
        document.getElementById(`${tab}-tab`).addEventListener('click', function() {
            // Hide all content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.add('d-none');
            });
            
            // Show selected content
            document.getElementById(`${tab}-content`).classList.remove('d-none');
            
            // Update active tab
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            this.classList.add('active');
        });
    });
}

function initData() {
    // Check if there's data in localStorage
    const savedData = localStorage.getItem('corrugatedBoxData');
    
    if (savedData) {
        appData = JSON.parse(savedData);
    } else {
        // Initialize with sample data
        appData = {
            orders: [
                {
                    srNo: 1,
                    jobCard: 'JC-2023-001',
                    date: '2023-12-01',
                    partyName: 'ABC Electronics',
                    partyPo: 'PO-1234',
                    ply: 3,
                    gsmType: 'B',
                    gsmValue: 150,
                    boxSize: {
                        length: 300,
                        width: 200,
                        height: 150,
                        thickness: 5
                    },
                    itemName: 'TV Packaging Box',
                    boxQty: 1000,
                    deliveryDate: '2023-12-15',
                    status: 'Pending',
                    hasDecal: 'no',
                    decalDetails: ''
                },
                {
                    srNo: 2,
                    jobCard: 'JC-2023-002',
                    date: '2023-12-03',
                    partyName: 'XYZ Appliances',
                    partyPo: 'PO-5678',
                    ply: 5,
                    gsmType: 'F',
                    gsmValue: 180,
                    boxSize: {
                        length: 400,
                        width: 300,
                        height: 200,
                        thickness: 7
                    },
                    itemName: 'Refrigerator Box',
                    boxQty: 500,
                    deliveryDate: '2023-12-20',
                    status: 'In Production',
                    hasDecal: 'yes',
                    decalDetails: 'Brand logo and handling instructions'
                }
            ],
            production: [
                {
                    jobCard: 'JC-2023-001',
                    cutterDate: '',
                    corrogationDate: '',
                    deliveryDate: '2023-12-15',
                    status: 'Pending'
                },
                {
                    jobCard: 'JC-2023-002',
                    cutterDate: '2023-12-05',
                    corrogationDate: '',
                    deliveryDate: '2023-12-20',
                    status: 'Cutting'
                }
            ],
            inventory: [
                {
                    materialId: 'MAT-001',
                    materialName: 'Kraft Paper - Bottom',
                    gsmType: 'B',
                    gsmValue: 150,
                    quantity: 500,
                    minStock: 200
                },
                {
                    materialId: 'MAT-002',
                    materialName: 'Flute Paper',
                    gsmType: 'F',
                    gsmValue: 180,
                    quantity: 300,
                    minStock: 150
                },
                {
                    materialId: 'MAT-003',
                    materialName: 'White Top',
                    gsmType: 'T',
                    gsmValue: 200,
                    quantity: 100,
                    minStock: 150
                }
            ],
            notifications: []
        };
        
        saveData();
    }
}

async function saveData() {
  try {
    await db.collection("productionData").doc("main").set(appData);
    localStorage.setItem('corrugatedBoxData', JSON.stringify(appData)); // Fallback
  } catch (error) {
    console.error("Firebase save error:", error);
  }
}

function setupEventListeners() {
    // Add Order button
    document.getElementById('add-order-btn').addEventListener('click', function() {
        const modal = new bootstrap.Modal(document.getElementById('orderModal'));
        resetOrderForm();
        document.getElementById('print-order-btn').classList.add('d-none');
        modal.show();
    });
    
    // Save Order button
    document.getElementById('save-order-btn').addEventListener('click', saveOrder);
    
    // Print Order button
    document.getElementById('print-order-btn').addEventListener('click', printOrder);
    
    // Has Decal select change
    document.getElementById('has-decal').addEventListener('change', function() {
        const decalContainer = document.getElementById('decal-details-container');
        if (this.value === 'yes') {
            decalContainer.style.display = 'block';
        } else {
            decalContainer.style.display = 'none';
        }
    });
    
    // Add Material button
    document.getElementById('add-material-btn').addEventListener('click', function() {
        const modal = new bootstrap.Modal(document.getElementById('materialModal'));
        resetMaterialForm();
        modal.show();
    });
    
    // Save Material button
    document.getElementById('save-material-btn').addEventListener('click', saveMaterial);
    
    // Notification bell
    document.getElementById('notification-bell').addEventListener('click', toggleNotifications);
    
    // Close notifications
    document.getElementById('close-notifications').addEventListener('click', toggleNotifications);
    
    // Export buttons
    document.getElementById('export-orders').addEventListener('click', () => exportData('orders'));
    document.getElementById('export-production').addEventListener('click', () => exportData('production'));
    document.getElementById('export-inventory').addEventListener('click', () => exportData('inventory'));
}

function resetOrderForm() {
    document.getElementById('order-form').reset();
    document.getElementById('decal-details-container').style.display = 'none';
    document.getElementById('order-date').valueAsDate = new Date();
    
    // Generate next SR NO
    const nextSrNo = appData.orders.length > 0 ? 
        Math.max(...appData.orders.map(order => order.srNo)) + 1 : 1;
    document.getElementById('job-card').value = `JC-${new Date().getFullYear()}-${nextSrNo.toString().padStart(3, '0')}`;
}

function saveOrder() {
    // Get form values
    const form = document.getElementById('order-form');
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }
    
    const order = {
        srNo: appData.orders.length > 0 ? 
            Math.max(...appData.orders.map(order => order.srNo)) + 1 : 1,
        jobCard: document.getElementById('job-card').value,
        date: document.getElementById('order-date').value,
        partyName: document.getElementById('party-name').value,
        partyPo: document.getElementById('party-po').value,
        ply: parseInt(document.getElementById('ply').value),
        gsmType: document.getElementById('gsm-type').value,
        gsmValue: parseInt(document.getElementById('gsm-value').value),
        boxSize: {
            length: parseFloat(document.getElementById('box-length').value),
            width: parseFloat(document.getElementById('box-width').value),
            height: parseFloat(document.getElementById('box-height').value),
            thickness: parseFloat(document.getElementById('box-thickness').value)
        },
        itemName: document.getElementById('item-name').value,
        boxQty: parseInt(document.getElementById('box-qty').value),
        deliveryDate: document.getElementById('delivery-date').value,
        status: 'Pending',
        hasDecal: document.getElementById('has-decal').value,
        decalDetails: document.getElementById('has-decal').value === 'yes' ? 
            document.getElementById('decal-details').value : ''
    };
    
    // Add to orders
    appData.orders.push(order);
    
    // Add to production tracking
    appData.production.push({
        jobCard: order.jobCard,
        cutterDate: '',
        corrogationDate: '',
        deliveryDate: order.deliveryDate,
        status: 'Pending'
    });
    
    // Save data
    saveData();
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('orderModal'));
    modal.hide();
    
    // Show print button for next time
    document.getElementById('print-order-btn').classList.remove('d-none');
    
    // Reload data
    loadOrdersData();
    loadProductionData();
    loadDashboardData();
    
    // Check inventory
    checkInventoryForOrder(order);
}

function printOrder() {
    // In a real app, this would open a print dialog with a formatted order
    alert('Order print functionality would open a print dialog with order details');
}

function saveMaterial() {
    // Get form values
    const form = document.getElementById('material-form');
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }
    
    const material = {
        materialId: `MAT-${(appData.inventory.length + 1).toString().padStart(3, '0')}`,
        materialName: document.getElementById('material-name').value,
        gsmType: document.getElementById('material-gsm-type').value,
        gsmValue: parseInt(document.getElementById('material-gsm-value').value),
        quantity: parseFloat(document.getElementById('material-quantity').value),
        minStock: parseFloat(document.getElementById('material-min-stock').value)
    };
    
    // Add to inventory
    appData.inventory.push(material);
    
    // Save data
    saveData();
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('materialModal'));
    modal.hide();
    
    // Reload data
    loadInventoryData();
    
    // Check notifications
    checkInventoryNotifications();
}

function resetMaterialForm() {
    document.getElementById('material-form').reset();
}

function loadDashboardData() {
    // Count orders by status
    const pendingOrders = appData.orders.filter(order => order.status === 'Pending').length;
    const inProduction = appData.orders.filter(order => 
        order.status === 'In Production' || order.status === 'Cutting' || order.status === 'Corrogation').length;
    const readyForDelivery = appData.orders.filter(order => order.status === 'Ready for Delivery').length;
    
    // Update counts
    document.getElementById('pending-orders').textContent = pendingOrders;
    document.getElementById('in-production').textContent = inProduction;
    document.getElementById('ready-delivery').textContent = readyForDelivery;
    
    // Load upcoming deliveries
    const deliveryTable = document.getElementById('delivery-table').getElementsByTagName('tbody')[0];
    deliveryTable.innerHTML = '';
    
    // Get upcoming deliveries (next 7 days)
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    const upcomingOrders = appData.orders.filter(order => {
        const deliveryDate = new Date(order.deliveryDate);
        return deliveryDate >= today && deliveryDate <= nextWeek;
    }).sort((a, b) => new Date(a.deliveryDate) - new Date(b.deliveryDate));
    
    upcomingOrders.forEach(order => {
        const row = deliveryTable.insertRow();
        row.insertCell().textContent = order.jobCard;
        row.insertCell().textContent = order.partyName;
        row.insertCell().textContent = order.boxQty.toLocaleString();
        row.insertCell().textContent = formatDate(order.deliveryDate);
        
        const statusCell = row.insertCell();
        const badge = document.createElement('span');
        badge.className = `badge bg-${getStatusBadgeColor(order.status)}`;
        badge.textContent = order.status;
        statusCell.appendChild(badge);
    });
}

function loadOrdersData() {
    const ordersTable = document.getElementById('orders-table').getElementsByTagName('tbody')[0];
    ordersTable.innerHTML = '';
    
    appData.orders.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(order => {
        const row = ordersTable.insertRow();
        row.insertCell().textContent = order.srNo;
        row.insertCell().textContent = order.jobCard;
        row.insertCell().textContent = formatDate(order.date);
        row.insertCell().textContent = order.partyName;
        row.insertCell().textContent = `${order.boxSize.length}×${order.boxSize.width}×${order.boxSize.height} (${order.boxSize.thickness}mm)`;
        row.insertCell().textContent = order.boxQty.toLocaleString();
        row.insertCell().textContent = formatDate(order.deliveryDate);
        
        const statusCell = row.insertCell();
        const badge = document.createElement('span');
        badge.className = `badge bg-${getStatusBadgeColor(order.status)}`;
        badge.textContent = order.status;
        statusCell.appendChild(badge);
        
        const actionsCell = row.insertCell();
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-sm btn-outline-primary me-1';
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', () => editOrder(order.jobCard));
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-sm btn-outline-danger';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteOrder(order.jobCard));
        
        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(deleteBtn);
    });
}

function loadProductionData() {
    const productionTable = document.getElementById('production-table').getElementsByTagName('tbody')[0];
    productionTable.innerHTML = '';
    
    appData.production.forEach(prod => {
        const order = appData.orders.find(o => o.jobCard === prod.jobCard);
        if (!order) return;
        
        const row = productionTable.insertRow();
        row.insertCell().textContent = prod.jobCard;
        row.insertCell().textContent = order.partyName;
        row.insertCell().textContent = `${order.boxSize.length}×${order.boxSize.width}×${order.boxSize.height}`;
        row.insertCell().textContent = order.boxQty.toLocaleString();
        
        // Calculate bundle quantity based on box size
        const bundleQty = calculateBundleQuantity(order.boxSize);
        row.insertCell().textContent = bundleQty;
        
        // Calculate total weight
        const totalWeight = calculateTotalWeight(order);
        row.insertCell().textContent = totalWeight.toFixed(2);
        
        row.insertCell().textContent = prod.cutterDate ? formatDate(prod.cutterDate) : '-';
        row.insertCell().textContent = prod.corrogationDate ? formatDate(prod.corrogationDate) : '-';
        row.insertCell().textContent = formatDate(prod.deliveryDate);
        
        const statusCell = row.insertCell();
        const badge = document.createElement('span');
        badge.className = `badge bg-${getStatusBadgeColor(prod.status)}`;
        badge.textContent = prod.status;
        statusCell.appendChild(badge);
        
        const actionsCell = row.insertCell();
        if (prod.status === 'Pending') {
            const startBtn = document.createElement('button');
            startBtn.className = 'btn btn-sm btn-success me-1';
            startBtn.textContent = 'Start Production';
            startBtn.addEventListener('click', () => updateProductionStatus(prod.jobCard, 'Cutting'));
            actionsCell.appendChild(startBtn);
        } else if (prod.status === 'Cutting') {
            const completeBtn = document.createElement('button');
            completeBtn.className = 'btn btn-sm btn-success me-1';
            completeBtn.textContent = 'Complete Cutting';
            completeBtn.addEventListener('click', () => updateProductionStatus(prod.jobCard, 'Corrogation'));
            actionsCell.appendChild(completeBtn);
        } else if (prod.status === 'Corrogation') {
            const completeBtn = document.createElement('button');
            completeBtn.className = 'btn btn-sm btn-success me-1';
            completeBtn.textContent = 'Complete Corrogation';
            completeBtn.addEventListener('click', () => updateProductionStatus(prod.jobCard, 'Ready for Delivery'));
            actionsCell.appendChild(completeBtn);
        } else if (prod.status === 'Ready for Delivery') {
            const deliverBtn = document.createElement('button');
            deliverBtn.className = 'btn btn-sm btn-primary me-1';
            deliverBtn.textContent = 'Mark Delivered';
            deliverBtn.addEventListener('click', () => updateProductionStatus(prod.jobCard, 'Delivered'));
            actionsCell.appendChild(deliverBtn);
        }
    });
}

function loadInventoryData() {
    const inventoryTable = document.getElementById('inventory-table').getElementsByTagName('tbody')[0];
    inventoryTable.innerHTML = '';
    
    appData.inventory.forEach(material => {
        const row = inventoryTable.insertRow();
        row.insertCell().textContent = material.materialId;
        row.insertCell().textContent = material.materialName;
        row.insertCell().textContent = `${material.gsmType}-${material.gsmValue}`;
        row.insertCell().textContent = material.gsmValue;
        row.insertCell().textContent = material.quantity.toFixed(2);
        row.insertCell().textContent = material.minStock.toFixed(2);
        
        const statusCell = row.insertCell();
        const status = material.quantity <= material.minStock ? 'Low Stock' : 'In Stock';
        const badge = document.createElement('span');
        badge.className = material.quantity <= material.minStock ? 'badge bg-warning' : 'badge bg-success';
        badge.textContent = status;
        statusCell.appendChild(badge);
        
        const actionsCell = row.insertCell();
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-sm btn-outline-primary me-1';
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', () => editMaterial(material.materialId));
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-sm btn-outline-danger';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteMaterial(material.materialId));
        
        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(deleteBtn);
    });
}

function loadReportsData() {
    // Monthly report table
    const monthlyTable = document.getElementById('monthly-report-table').getElementsByTagName('tbody')[0];
    monthlyTable.innerHTML = '';
    
    // Group orders by month
    const monthlyData = {};
    
    appData.orders.forEach(order => {
        const date = new Date(order.date);
        const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        
        if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = {
                month: `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`,
                totalOrders: 0,
                totalBoxes: 0,
                totalWeight: 0,
                ply3: 0,
                ply5: 0,
                ply7: 0
            };
        }
        
        monthlyData[monthYear].totalOrders++;
        monthlyData[monthYear].totalBoxes += order.boxQty;
        
        const weight = calculateTotalWeight(order);
        monthlyData[monthYear].totalWeight += weight;
        
        if (order.ply === 3) monthlyData[monthYear].ply3++;
        else if (order.ply === 5) monthlyData[monthYear].ply5++;
        else if (order.ply === 7) monthlyData[monthYear].ply7++;
    });
    
    // Add rows to table
    Object.values(monthlyData).forEach(data => {
        const row = monthlyTable.insertRow();
        row.insertCell().textContent = data.month;
        row.insertCell().textContent = data.totalOrders;
        row.insertCell().textContent = data.totalBoxes.toLocaleString();
        row.insertCell().textContent = data.totalWeight.toFixed(2);
        row.insertCell().textContent = data.ply3;
        row.insertCell().textContent = data.ply5;
        row.insertCell().textContent = data.ply7;
    });
    
    // Charts
    createMaterialChart();
    createOrderStatusChart();
}

function createMaterialChart() {
    const ctx = document.getElementById('materialChart').getContext('2d');
    
    // Group materials by type and calculate total quantity
    const materialTypes = {};
    appData.inventory.forEach(material => {
        const type = material.gsmType;
        if (!materialTypes[type]) {
            materialTypes[type] = 0;
        }
        materialTypes[type] += material.quantity;
    });
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(materialTypes).map(type => {
                if (type === 'B') return 'Bottom';
                if (type === 'F') return 'Flute';
                if (type === 'T') return 'Top';
                return type;
            }),
            datasets: [{
                data: Object.values(materialTypes),
                backgroundColor: [
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Material Distribution by Type'
                }
            }
        }
    });
}

function createOrderStatusChart() {
    const ctx = document.getElementById('orderChart').getContext('2d');
    
    // Count orders by status
    const statusCounts = {
        'Pending': 0,
        'In Production': 0,
        'Ready for Delivery': 0,
        'Delivered': 0
    };
    
    appData.orders.forEach(order => {
        if (order.status in statusCounts) {
            statusCounts[order.status]++;
        }
    });
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{
                label: 'Orders by Status',
                data: Object.values(statusCounts),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Orders by Status'
                }
            }
        }
    });
}

function calculateBundleQuantity(boxSize) {
    const volume = boxSize.length * boxSize.width * boxSize.height;
    
    if (volume < 500000) return 100;     // Very small boxes
    else if (volume < 1000000) return 50; // Small boxes
    else if (volume < 3000000) return 30; // Medium-small
    else if (volume < 7000000) return 25; // Medium-large ← Your target value
    else if (volume < 10000000) return 15; // Large boxes
    else return 10;                       // Extra large
}
// In your order form JavaScript
function updateBundleQtyPreview() {
    const length = document.getElementById('box-length').value;
    const width = document.getElementById('box-width').value;
    const height = document.getElementById('box-height').value;
    
    if (length && width && height) {
        const boxSize = { length, width, height };
        const bundleQty = calculateBundleQuantity(boxSize);
        document.getElementById('bundle-qty-preview').textContent = 
            `Estimated bundle quantity: ${bundleQty} boxes`;
    }
}

// Call this whenever dimensions change
document.getElementById('box-length').addEventListener('input', updateBundleQtyPreview);
document.getElementById('box-width').addEventListener('input', updateBundleQtyPreview);
document.getElementById('box-height').addEventListener('input', updateBundleQtyPreview);

function calculateTotalWeight(order) {
     // Get basic dimensions in meters
    const lengthM = order.boxSize.length / 1000;
    const widthM = order.boxSize.width / 1000;
    const heightM = order.boxSize.height / 1000;
    
    // Calculate surface area (for both sides)
    const surfaceArea = 2 * (lengthM * widthM + lengthM * heightM + widthM * heightM);
    
    // Calculate weight based on ply type
    let totalWeight;
    switch(order.ply) {
        case 3: // 3-ply: 1 liner + 1 flute + 1 liner
            totalWeight = surfaceArea * (
                (order.gsmValue / 1000) +       // Bottom liner
                (order.gsmValue / 1000 * 1.4) + // Flute (1.4x multiplier)
                (order.gsmValue / 1000)         // Top liner
            );
            break;
            
        case 5: // 5-ply: 2 liners + 2 flutes + 1 middle liner
            totalWeight = surfaceArea * (
                (order.gsmValue / 1000) +       // Bottom liner
                (order.gsmValue / 1000 * 1.4) + // First flute
                (order.gsmValue / 1000 * 0.8) + // Middle liner (often lighter)
                (order.gsmValue / 1000 * 1.4) + // Second flute
                (order.gsmValue / 1000)         // Top liner
            );
            break;
            
        case 7: // 7-ply: 3 liners + 3 flutes + 1 middle liner
            totalWeight = surfaceArea * (
                (order.gsmValue / 1000) +       // Bottom liner
                (order.gsmValue / 1000 * 1.4) + // First flute
                (order.gsmValue / 1000 * 0.8) + // First middle liner
                (order.gsmValue / 1000 * 1.4) + // Second flute
                (order.gsmValue / 1000 * 0.8) + // Second middle liner
                (order.gsmValue / 1000 * 1.4) + // Third flute
                (order.gsmValue / 1000)         // Top liner
            );
            break;
            
        default:
            // Default to simple calculation if ply not recognized
            totalWeight = surfaceArea * (order.gsmValue / 1000) * 1.4;
    }
    
    // Multiply by quantity and add 10% wastage
    return totalWeight * order.boxQty * 1.1;
}

/**
 * Calculate detailed material breakdown for an order
 */
function calculateMaterialBreakdown(order) {
    const breakdown = {
        liners: { totalGSM: 0, layers: [] },
        flutes: { totalGSM: 0, layers: [] },
        totalGSM: 0,
        weightPerBox: 0,
        totalWeight: 0
    };
    
    // Common conversions
    const lengthM = order.boxSize.length / 1000;
    const widthM = order.boxSize.width / 1000;
    const heightM = order.boxSize.height / 1000;
    const surfaceArea = 2 * (lengthM * widthM + lengthM * heightM + widthM * heightM);
    
    // Calculate based on ply type
    switch(order.ply) {
        case 3:
            // 3-ply structure: Liner + Flute + Liner
            breakdown.liners.layers.push({ gsm: order.gsmValue, position: 'Bottom' });
            breakdown.liners.layers.push({ gsm: order.gsmValue, position: 'Top' });
            breakdown.flutes.layers.push({ gsm: order.gsmValue * 1.4, position: 'Single Flute' });
            break;
            
        case 5:
            // 5-ply structure: Liner + Flute + Liner + Flute + Liner
            breakdown.liners.layers.push({ gsm: order.gsmValue, position: 'Bottom' });
            breakdown.liners.layers.push({ gsm: order.gsmValue * 0.8, position: 'Middle' });
            breakdown.liners.layers.push({ gsm: order.gsmValue, position: 'Top' });
            breakdown.flutes.layers.push({ gsm: order.gsmValue * 1.4, position: 'Outer Flute' });
            breakdown.flutes.layers.push({ gsm: order.gsmValue * 1.4, position: 'Inner Flute' });
            break;
            
        case 7:
            // 7-ply structure: Liner + Flute + Liner + Flute + Liner + Flute + Liner
            breakdown.liners.layers.push({ gsm: order.gsmValue, position: 'Bottom' });
            breakdown.liners.layers.push({ gsm: order.gsmValue * 0.8, position: 'First Middle' });
            breakdown.liners.layers.push({ gsm: order.gsmValue * 0.8, position: 'Second Middle' });
            breakdown.liners.layers.push({ gsm: order.gsmValue, position: 'Top' });
            breakdown.flutes.layers.push({ gsm: order.gsmValue * 1.4, position: 'Outer Flute' });
            breakdown.flutes.layers.push({ gsm: order.gsmValue * 1.4, position: 'Middle Flute' });
            breakdown.flutes.layers.push({ gsm: order.gsmValue * 1.4, position: 'Inner Flute' });
            break;
    }
    
    // Calculate totals
    breakdown.liners.totalGSM = breakdown.liners.layers.reduce((sum, layer) => sum + layer.gsm, 0);
    breakdown.flutes.totalGSM = breakdown.flutes.layers.reduce((sum, layer) => sum + layer.gsm, 0);
    breakdown.totalGSM = breakdown.liners.totalGSM + breakdown.flutes.totalGSM;
    
    // Calculate weights
    breakdown.weightPerBox = (breakdown.totalGSM / 1000) * surfaceArea;
    breakdown.totalWeight = breakdown.weightPerBox * order.boxQty * 1.1; // Including 10% wastage
    
    return breakdown;
}

/**
 * Update the print template to show detailed material breakdown
 */
function updatePrintTemplateWithMaterialDetails(order, printWindow) {
    const breakdown = calculateMaterialBreakdown(order);
    
    // Create material details HTML
    let materialHTML = `
        <h3>Detailed Material Composition</h3>
        <table class="order-details">
            <tr>
                <th>Layer Type</th>
                <th>Position</th>
                <th>GSM</th>
                <th>Weight Contribution</th>
            </tr>
    `;
    
    // Add liner layers
    breakdown.liners.layers.forEach(layer => {
        materialHTML += `
            <tr>
                <td>Liner</td>
                <td>${layer.position}</td>
                <td>${layer.gsm}</td>
                <td>${(layer.gsm / breakdown.totalGSM * 100).toFixed(1)}%</td>
            </tr>
        `;
    });
    
    // Add flute layers
    breakdown.flutes.layers.forEach(layer => {
        materialHTML += `
            <tr>
                <td>Flute</td>
                <td>${layer.position}</td>
                <td>${layer.gsm}</td>
                <td>${(layer.gsm / breakdown.totalGSM * 100).toFixed(1)}%</td>
            </tr>
        `;
    });
    
    materialHTML += `
            <tr class="total-row">
                <td colspan="2"><strong>Total</strong></td>
                <td><strong>${breakdown.totalGSM.toFixed(0)}</strong></td>
                <td><strong>100%</strong></td>
            </tr>
        </table>
        
        <div class="weight-summary">
            <p><strong>Weight per box:</strong> ${breakdown.weightPerBox.toFixed(3)} kg</p>
            <p><strong>Total order weight (including 10% wastage):</strong> ${breakdown.totalWeight.toFixed(1)} kg</p>
        </div>
    `;
    
    // Inject into print template
    printWindow.postMessage({
        action: 'updateMaterialDetails',
        html: materialHTML,
        totalWeight: breakdown.totalWeight
    }, window.location.origin);
}

function checkInventoryForOrder(order) {
    // Calculate required material
    const requiredMaterial = calculateTotalWeight(order) * 1.1; // Add 10% buffer
    
    // Find matching material
    const material = appData.inventory.find(m => 
        m.gsmType === order.gsmType && m.gsmValue === order.gsmValue);
    
    if (material) {
        if (material.quantity < requiredMaterial) {
            addNotification(`Low stock for ${material.materialName} (${material.gsmType}-${material.gsmValue}). 
                Required: ${requiredMaterial.toFixed(2)}kg, Available: ${material.quantity.toFixed(2)}kg`, 'warning');
        }
    } else {
        addNotification(`No inventory found for material ${order.gsmType}-${order.gsmValue} required for order ${order.jobCard}`, 'danger');
    }
}

function checkInventoryNotifications() {
    appData.inventory.forEach(material => {
        if (material.quantity <= material.minStock) {
            addNotification(`${material.materialName} (${material.gsmType}-${material.gsmValue}) is low on stock. 
                Current: ${material.quantity.toFixed(2)}kg, Minimum: ${material.minStock.toFixed(2)}kg`, 'warning');
        }
    });
}

function addNotification(message, type = 'info') {
    const notification = {
        id: Date.now(),
        message,
        type,
        date: new Date().toISOString(),
        read: false
    };
    
    appData.notifications.push(notification);
    saveData();
    
    updateNotificationBadge();
    showNotification(notification);
}

function updateNotificationBadge() {
    const unreadCount = appData.notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notification-count');
    
    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.classList.remove('d-none');
    } else {
        badge.classList.add('d-none');
    }
}

function showNotification(notification) {
    // In a real app, this might show a toast notification
    console.log(`New ${notification.type} notification: ${notification.message}`);
}

function toggleNotifications() {
    const panel = document.getElementById('notification-panel');
    panel.classList.toggle('show');
    
    if (panel.classList.contains('show')) {
        loadNotifications();
        markNotificationsAsRead();
    }
}

function loadNotifications() {
    const list = document.getElementById('notification-list');
    list.innerHTML = '';
    
    // Show recent notifications first
    const recentNotifications = [...appData.notifications].reverse().slice(0, 20);
    
    recentNotifications.forEach(notification => {
        const item = document.createElement('div');
        item.className = `notification-item ${notification.type}`;
        
        const message = document.createElement('div');
        message.textContent = notification.message;
        
        const date = document.createElement('div');
        date.className = 'text-muted small';
        date.textContent = formatDateTime(notification.date);
        
        item.appendChild(message);
        item.appendChild(date);
        list.appendChild(item);
    });
}

function markNotificationsAsRead() {
    appData.notifications.forEach(notification => {
        notification.read = true;
    });
    saveData();
    updateNotificationBadge();
}

function editOrder(jobCard) {
    const order = appData.orders.find(o => o.jobCard === jobCard);
    if (!order) return;
    
    const modal = new bootstrap.Modal(document.getElementById('orderModal'));
    
    // Fill form with order data
    document.getElementById('job-card').value = order.jobCard;
    document.getElementById('order-date').value = order.date;
    document.getElementById('party-name').value = order.partyName;
    document.getElementById('party-po').value = order.partyPo;
    document.getElementById('ply').value = order.ply;
    document.getElementById('gsm-type').value = order.gsmType;
    document.getElementById('gsm-value').value = order.gsmValue;
    document.getElementById('box-length').value = order.boxSize.length;
    document.getElementById('box-width').value = order.boxSize.width;
    document.getElementById('box-height').value = order.boxSize.height;
    document.getElementById('box-thickness').value = order.boxSize.thickness;
    document.getElementById('item-name').value = order.itemName;
    document.getElementById('box-qty').value = order.boxQty;
    document.getElementById('delivery-date').value = order.deliveryDate;
    document.getElementById('has-decal').value = order.hasDecal;
    document.getElementById('decal-details').value = order.decalDetails;
    
    if (order.hasDecal === 'yes') {
        document.getElementById('decal-details-container').style.display = 'block';
    } else {
        document.getElementById('decal-details-container').style.display = 'none';
    }
    
    document.getElementById('print-order-btn').classList.remove('d-none');
    modal.show();
}

function deleteOrder(jobCard) {
    if (confirm('Are you sure you want to delete this order?')) {
        appData.orders = appData.orders.filter(o => o.jobCard !== jobCard);
        appData.production = appData.production.filter(p => p.jobCard !== jobCard);
        saveData();
        
        loadOrdersData();
        loadProductionData();
        loadDashboardData();
    }
}

function editMaterial(materialId) {
    const material = appData.inventory.find(m => m.materialId === materialId);
    if (!material) return;
    
    const modal = new bootstrap.Modal(document.getElementById('materialModal'));
    
    // Fill form with material data
    document.getElementById('material-name').value = material.materialName;
    document.getElementById('material-gsm-type').value = material.gsmType;
    document.getElementById('material-gsm-value').value = material.gsmValue;
    document.getElementById('material-quantity').value = material.quantity;
    document.getElementById('material-min-stock').value = material.minStock;
    
    modal.show();
}

function deleteMaterial(materialId) {
    if (confirm('Are you sure you want to delete this material?')) {
        appData.inventory = appData.inventory.filter(m => m.materialId !== materialId);
        saveData();
        loadInventoryData();
    }
}

function updateProductionStatus(jobCard, newStatus) {
    const production = appData.production.find(p => p.jobCard === jobCard);
    if (!production) return;
    
    const order = appData.orders.find(o => o.jobCard === jobCard);
    if (!order) return;
    
    // Update status
    production.status = newStatus;
    order.status = newStatus;
    
    // Set dates
    const today = new Date().toISOString().split('T')[0];
    if (newStatus === 'Cutting') {
        production.cutterDate = today;
    } else if (newStatus === 'Corrogation') {
        production.corrogationDate = today;
    } else if (newStatus === 'Delivered') {
        production.deliveredDate = today;
        
        // Deduct material from inventory
        deductMaterialForOrder(order);
    }
    
    saveData();
    loadProductionData();
    loadOrdersData();
    loadDashboardData();
}

function deductMaterialForOrder(order) {
    // Find matching material
    const material = appData.inventory.find(m => 
        m.gsmType === order.gsmType && m.gsmValue === order.gsmValue);
    
    if (material) {
        const requiredMaterial = calculateTotalWeight(order);
        material.quantity = Math.max(0, material.quantity - requiredMaterial);
        saveData();
        loadInventoryData();
        
        // Check if this made the stock low
        if (material.quantity <= material.minStock) {
            addNotification(`${material.materialName} (${material.gsmType}-${material.gsmValue}) is now low on stock after fulfilling order ${order.jobCard}`, 'warning');
        }
    }
}

function exportData(type) {
    let data, filename;
    
    switch (type) {
        case 'orders':
            data = appData.orders;
            filename = 'orders-export.csv';
            break;
        case 'production':
            data = appData.production;
            filename = 'production-export.csv';
            break;
        case 'inventory':
            data = appData.inventory;
            filename = 'inventory-export.csv';
            break;
        default:
            return;
    }
    
    if (data.length === 0) {
        alert('No data to export');
        return;
    }
    
    // Convert to CSV
    const headers = Object.keys(data[0]);
    let csv = headers.join(',') + '\n';
    
    data.forEach(item => {
        const row = headers.map(header => {
            if (typeof item[header] === 'object') {
                return JSON.stringify(item[header]);
            }
            return item[header];
        }).join(',');
        csv += row + '\n';
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function formatDateTime(dateTimeString) {
    if (!dateTimeString) return '-';
    const date = new Date(dateTimeString);
    return date.toLocaleString();
}

function getStatusBadgeColor(status) {
    switch (status) {
        case 'Pending': return 'warning';
        case 'In Production': 
        case 'Cutting':
        case 'Corrogation': return 'info';
        case 'Ready for Delivery': return 'primary';
        case 'Delivered': return 'success';
        default: return 'secondary';
    }
}
function printOrder() {
    const orderData = getCurrentOrderData();
    
    // Convert order data to URL parameters
    const params = new URLSearchParams();
    
    // Flatten the order data object
    for (const [key, value] of Object.entries(orderData)) {
        if (typeof value === 'object') {
            for (const [subKey, subValue] of Object.entries(value)) {
                params.append(`${key}.${subKey}`, subValue);
            }
        } else {
            params.append(key, value);
        }
    }
    
    // Open the print template with parameters
    const printWindow = window.open(`templates/order-print-template.html?${params.toString()}`, '_blank');
    
    // Focus the window after a short delay to ensure it's loaded
    setTimeout(() => {
        printWindow.focus();
    }, 500);
}

function getCurrentOrderData() {
    // Get form values
    return {
        jobCard: document.getElementById('job-card').value,
        date: document.getElementById('order-date').value,
        partyName: document.getElementById('party-name').value,
        partyPo: document.getElementById('party-po').value,
        ply: parseInt(document.getElementById('ply').value),
        gsmType: document.getElementById('gsm-type').value,
        gsmValue: parseInt(document.getElementById('gsm-value').value),
        boxSize: {
            length: parseFloat(document.getElementById('box-length').value),
            width: parseFloat(document.getElementById('box-width').value),
            height: parseFloat(document.getElementById('box-height').value),
            thickness: parseFloat(document.getElementById('box-thickness').value)
        },
        itemName: document.getElementById('item-name').value,
        boxQty: parseInt(document.getElementById('box-qty').value),
        deliveryDate: document.getElementById('delivery-date').value,
        status: document.getElementById('order-form').dataset.status || 'Pending',
        hasDecal: document.getElementById('has-decal').value,
        decalDetails: document.getElementById('has-decal').value === 'yes' ? 
            document.getElementById('decal-details').value : ''
    };
}

// Add message listener for print template communication
window.addEventListener('message', function(event) {
    if (event.origin !== window.location.origin) return;
    
    // Handle messages from print template if needed
    console.log('Message from print window:', event.data);
});
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-app",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();