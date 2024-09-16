document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('productForm');
    const searchForm = document.getElementById('searchForm');
    const inventoryDisplay = document.getElementById('inventoryDisplay');
    const searchResult = document.getElementById('searchResult');
    const lowStockDisplay = document.getElementById('lowStockDisplay');
    const submitBtn = document.getElementById('submitBtn');

    // Handle product form submission (Add/Edit)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const id = formData.get('id');

        // Determine action
        if (id) {
            formData.append('action', 'edit');
        } else {
            formData.append('action', 'add');
        }

        try {
            const response = await sendRequest('inventory_backend.php', formData);
            if (response && response.message) {
                showMessage(response.message);
            } else {
                showMessage('An unexpected error occurred.');
            }

            // Reload inventory after adding/editing
            loadInventory();
            resetForm();
        } catch (error) {
            console.error("Error submitting form:", error);
            showMessage('Failed to submit the form.');
        }
    });

    // Handle search form submission
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(searchForm);
        formData.append('action', 'search');

        const response = await sendRequest('inventory_backend.php', formData);

        if (response.search_results) {
            displaySearchResults(response.search_results);
        } else {
            searchResult.innerHTML = '<p>No products found.</p>';
        }
    });

    // Load inventory on page load
    loadInventory();

    // Function to load inventory
    async function loadInventory() {
        const formData = new FormData();
        formData.append('action', 'load_inventory');
        const response = await sendRequest('inventory_backend.php', formData);
        inventoryDisplay.innerHTML = response.inventory_table || 'No items in inventory';
        displayLowStockItems(response.lowStockItems);
    }

    // Send request to the server
    async function sendRequest(url, data) {
        const options = {
            method: 'POST',
            body: data,
        };
        try {
            const res = await fetch(url, options);
            return await res.json();
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Display search results
    function displaySearchResults(results) {
        let html = `<table class="inventory-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Quantity</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>`;
        results.forEach((item) => {
            html += `<tr>
                        <td>${item.id}</td>
                        <td>${item.name}</td>
                        <td>${item.category}</td>
                        <td>$${parseFloat(item.price).toFixed(2)}</td>
                        <td>${item.quantity}</td>
                        <td>
                            <div class="button-container">
                                <button class="edit-btn" onclick="editItem(${item.id})">Edit</button>
                                <button class="delete-btn" onclick="deleteItem(${item.id})">Delete</button>
                            </div>
                        </td>
                    </tr>`;
        });
        html += '</tbody></table>';
        searchResult.innerHTML = html;
    }

    // Edit an item
    window.editItem = async (id) => {
        const formData = new FormData();
        formData.append('id', id);
        formData.append('action', 'get_item');

        const response = await sendRequest('inventory_backend.php', formData);

        // Populate form with existing item data for editing
        if (response.item) {
            form.productId.value = response.item.id;
            form.productName.value = response.item.name;
            form.productCategory.value = response.item.category;
            form.productPrice.value = response.item.price;
            form.productQuantity.value = response.item.quantity;
            submitBtn.textContent = 'Update Item';
        }
    };

    // Delete an item
    window.deleteItem = async (id) => {
        if (confirm('Are you sure you want to delete this item?')) {
            const formData = new FormData();
            formData.append('id', id);
            formData.append('action', 'delete');

            const response = await sendRequest('inventory_backend.php', formData);
            if (response && response.message) {
                showMessage(response.message);
            }

            // Reload inventory after delete
            loadInventory();
        }
    };

    // Display low stock items
    function displayLowStockItems(items) {
        if (items && items.length > 0) {
            let html = '<ul>';
            items.forEach((item) => {
                html += `<li>${item.name} (Quantity: ${item.quantity})</li>`;
            });
            html += '</ul>';
            lowStockDisplay.innerHTML = html;
        } else {
            lowStockDisplay.innerHTML = '<p>No low stock items.</p>';
        }
    }

    // Reset the form after adding or editing an item
    function resetForm() {
        form.reset();
        form.productId.value = '';
        submitBtn.textContent = 'Add Item';
    }

    // Show message (alert)
    function showMessage(message) {
        alert(message);
    }
});
