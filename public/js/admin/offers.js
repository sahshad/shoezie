const createOfferButton = document.querySelector('#createOfferForm button[type="submit"]');
        createOfferButton.disabled = true;
    
        document.getElementById('createOfferForm').addEventListener('submit', function (event) {
            event.preventDefault();
    
            const offerData = {
                targetName: document.getElementById('targetName').value,
                offerFor: document.getElementById('offerFor').value,
                offerType: document.getElementById('offerType').value,
                value: parseFloat(document.getElementById('value').value),
                minProductPrice: parseFloat(document.getElementById('minProductPrice').value) || null,
                maxDiscount: parseFloat(document.getElementById('maxDiscount').value) || null,
                expiresAt: document.getElementById('expiresAt').value,
            };
            console.log(new Date() , new Date(offerData.expiresAt) );
            
            if(new Date(offerData.expiresAt) < new Date() ){
                Swal.fire('Error!', 'Expire date must be futue date', 'error');
                return;
            }
    
            fetch('/admin/offers/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(offerData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Swal.fire('Success!', 'Offer created successfully.', 'success').then(() => location.reload());
                } else {
                    Swal.fire('Error!', data.message || 'Failed to create offer.', 'error');
                }
            })
            .catch(error => Swal.fire('Error!', 'An error occurred.', 'error'));
        });
    
        function toggleOfferStatus(offerId, button) {
    const isActive = button.innerText === 'Unlist';
    const row = button.closest('tr');
    const badge = row.querySelector('.status-badge');

    Swal.fire({
        title: isActive ? 'Unlist Offer?' : 'Activate Offer?',
        text: `Are you sure you want to ${isActive ? 'unlist' : 'activate'} this offer?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: isActive ? 'Yes, unlist it!' : 'Yes, activate it!',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            badge.className = `badge status-badge ${isActive ? 'badge-danger' : 'badge-success'}`;
            badge.textContent = isActive ? 'Inactive' : 'Active';
            button.textContent = isActive ? 'Activate' : 'Unlist';
            button.setAttribute('data-active', isActive);

            fetch(`/admin/offers/${!isActive}/${offerId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' }
            })
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    badge.className = `badge ${isActive ? 'badge-success' : 'badge-danger'}`;
                    badge.textContent = isActive ? 'Active' : 'Inactive';
                    button.textContent = isActive ? 'Unlist' : 'Activate';
                    button.setAttribute('data-active', isActive);

                    Swal.fire('Error!', data.message || 'Failed to update offer status.', 'error');
                } else {
                    Swal.fire('Success!', `Offer ${isActive ? 'unlisted' : 'activated'} successfully.`, 'success');
                }
            })
            .catch(error => {
                badge.className = `badge ${isActive ? 'badge-success' : 'badge-danger'}`;
                badge.textContent = isActive ? 'Active' : 'Inactive';
                button.textContent = isActive ? 'Unlist' : 'Activate';
                button.setAttribute('data-active', isActive);

                Swal.fire('Error!', 'An error occurred.', 'error');
            });
        }
    });
}

        document.getElementById('offerType').addEventListener('change', function () {
            const maxDiscountField = document.getElementById('maxDiscount').parentElement;
            const minProductPriceField = document.getElementById('minProductPriceField');
    
            maxDiscountField.style.display = this.value === 'percentage' ? 'block' : 'none';
            
            if (document.getElementById('offerFor').value === 'Category' && this.value === 'flat') {
                minProductPriceField.style.display = 'block';
            } else {
                minProductPriceField.style.display = 'none';
            }
        });
    
        document.getElementById('offerFor').addEventListener('change', function () {
            document.getElementById('offerType').dispatchEvent(new Event('change'));
        });
    
        const validateInput = (input) => {
            const value = input.value;
            let errorMessage = '';
    
            if (input.id === 'value' || input.id === 'minProductPrice') {
                if (value < 0) {
                    errorMessage = 'Value must be positive';
                }
            }
    
            let errorContainer = input.nextElementSibling;
            if (!errorContainer || !errorContainer.classList.contains('error-message')) {
                errorContainer = document.createElement('div');
                errorContainer.className = 'error-message text-danger';
                input.parentNode.insertBefore(errorContainer, input.nextSibling);
            }
    
            errorContainer.textContent = errorMessage;
            input.setCustomValidity(errorMessage ? errorMessage : '');
            toggleCreateOfferButton();
        };
    
        const toggleCreateOfferButton = () => {
            const inputs = document.querySelectorAll('#createOfferForm input');
            let allValid = true;
    
            inputs.forEach(input => {
                if (input.checkValidity() === false) {
                    allValid = false;
                }
            });
    
            createOfferButton.disabled = !allValid;
        };
    
        document.querySelectorAll('#createOfferForm input').forEach(input => {
            input.addEventListener('input', () => validateInput(input));
        });
    
        document.querySelectorAll('#createOfferForm input').forEach(input => {
            input.addEventListener('focus', () => {
                const errorContainer = input.nextElementSibling;
                if (errorContainer && errorContainer.classList.contains('error-message')) {
                    errorContainer.textContent = '';
                }
            });
        });

        const editOfferButton = document.querySelector('#editOfferForm button[type="submit"]');
    editOfferButton.disabled = true;

    document.getElementById('editOfferForm').addEventListener('submit', function (event) {
        event.preventDefault();

        const offerData = {
            id: document.getElementById('editOfferId').value,
            targetName: document.getElementById('editTargetName').value,
            offerFor: document.getElementById('editOfferFor').value,
            offerType: document.getElementById('editOfferType').value,
            value: parseFloat(document.getElementById('editValue').value),
            minProductPrice: parseFloat(document.getElementById('editMinProductPrice').value) || null,
            maxDiscount: parseFloat(document.getElementById('editMaxDiscount').value) || null,
            expiresAt: document.getElementById('editExpiresAt').value,
        };

        if(new Date(offerData.expiresAt) < new Date() ){
                Swal.fire('Error!', 'Expire date must be futue date', 'error');
                return;
            }

        fetch(`/admin/offers/update/${offerData.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(offerData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                Swal.fire('Success!', 'Offer updated successfully.', 'success').then(() => location.reload());
            } else {
                Swal.fire('Error!', data.message || 'Failed to update offer.', 'error');
            }
        })
        .catch(error => Swal.fire('Error!', 'An error occurred.', 'error'));
    });

    const validateEditInput = (input) => {
        const value = input.value;
        let errorMessage = '';

        if (input.id === 'editValue' || input.id === 'editMinProductPrice') {
            if (value < 0) {
                errorMessage = 'Value must be positive';
            }
        }

        let errorContainer = input.nextElementSibling;
        if (!errorContainer || !errorContainer.classList.contains('error-message')) {
            errorContainer = document.createElement('div');
            errorContainer.className = 'error-message text-danger';
            input.parentNode.insertBefore(errorContainer, input.nextSibling);
        }

        errorContainer.textContent = errorMessage;
        input.setCustomValidity(errorMessage ? errorMessage : '');
        toggleEditOfferButton();
    };

    const toggleEditOfferButton = () => {
        const inputs = document.querySelectorAll('#editOfferForm input');
        let allValid = true;

        inputs.forEach(input => {
            if (input.checkValidity() === false) {
                allValid = false;
            }
        });

        editOfferButton.disabled = !allValid;
    };

    document.querySelectorAll('#editOfferForm input').forEach(input => {
        input.addEventListener('input', () => validateEditInput(input));
    });

    document.querySelectorAll('#editOfferForm input').forEach(input => {
        input.addEventListener('focus', () => {
            const errorContainer = input.nextElementSibling;
            if (errorContainer && errorContainer.classList.contains('error-message')) {
                errorContainer.textContent = '';
            }
        });
    });

    document.getElementById('editOfferType').addEventListener('change', function () {
        const editMinProductPriceField = document.getElementById('editMinProductPriceField');
        editMinProductPriceField.style.display = (document.getElementById('editOfferFor').value === 'Category' && this.value === 'flat') ? 'block' : 'none';
        toggleEditOfferButton(); 
    });

    document.getElementById('editOfferFor').addEventListener('change', function () {
        document.getElementById('editOfferType').dispatchEvent(new Event('change'));
    });

    function openEditModal(offerId, offerFor, targetName, offerType, value, expiresAt, minProductPrice) {
        document.getElementById('editOfferId').value = offerId;
        document.getElementById('editOfferFor').value = offerFor;
        document.getElementById('editTargetName').value = targetName;
        document.getElementById('editOfferType').value = offerType;
        document.getElementById('editValue').value = value;
        document.getElementById('editExpiresAt').value = new Date(expiresAt).toISOString().slice(0, 16);
        document.getElementById('editMinProductPrice').value = minProductPrice;

        const editMinProductPriceField = document.getElementById('editMinProductPriceField');
        editMinProductPriceField.style.display = (offerFor === 'Category' && offerType === 'flat') ? 'block' : 'none';

        toggleEditOfferButton();
        $('#editOfferModal').modal('show');
    }