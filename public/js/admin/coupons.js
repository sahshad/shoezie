
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('createCouponForm');
    const submitBtn = document.getElementById('submitBtn');
    const discountTypeSelect = document.getElementById('discountType');
    const maxDiscountInput = document.getElementById('maxDiscount');
    let isUserInteracted = false; 

    submitBtn.disabled = true;

    function toggleMaxDiscountField() {
        if (discountTypeSelect.value === 'percentage') {
            maxDiscountInput.parentElement.style.display = 'block';
        } else {
            maxDiscountInput.parentElement.style.display = 'none';
            maxDiscountInput.value = '';
        }
    }

    toggleMaxDiscountField();
    function validateAllFields() {
        let isValid = true;

        document.querySelectorAll('.text-danger').forEach(el => el.textContent = '');

        const code = document.getElementById('code').value;
        if (isUserInteracted && !code) {
            document.getElementById('codeError').textContent = 'Coupon code is required.';
            isValid = false;
        }

        const discountAmount = document.getElementById('discountAmount').value;
        if (isUserInteracted && discountAmount <= 0) {
            document.getElementById('discountAmountError').textContent = 'Discount amount must be greater than 0.';
            isValid = false;
        }

        const discountType = discountTypeSelect.value;
        if (isUserInteracted && !discountType) {
            document.getElementById('discountTypeError').textContent = 'Discount type is required.';
            isValid = false;
        }

        const maxDiscount = maxDiscountInput.value;
        if (discountType === 'percentage' && isUserInteracted && (maxDiscount === '' || maxDiscount < 0)) {
            document.getElementById('maxDiscountError').textContent = 'Max discount must be a non-negative number.';
            isValid = false;
        }

        const minOrderValue = document.getElementById('minOrderValue').value;
        if (isUserInteracted && (minOrderValue === '' || minOrderValue < 0)) {
            document.getElementById('minOrderValueError').textContent = 'Minimum order value must be a non-negative number.';
            isValid = false;
        }

        const usageLimit = document.getElementById('usageLimit').value;
        if (isUserInteracted && usageLimit < 1) {
            document.getElementById('usageLimitError').textContent = 'Usage limit must be at least 1.';
            isValid = false;
        }

        const expiresAt = document.getElementById('expiresAt').value;
        if (isUserInteracted && !expiresAt) {
            document.getElementById('expiresAtError').textContent = 'Expiration date is required.';
            isValid = false;
        }
        submitBtn.disabled = !isValid;
    }

    form.addEventListener('input', function(event) {
        isUserInteracted = true; 
        validateAllFields();
    });
    form.addEventListener('change', function(event) {
        isUserInteracted = true; 
        validateAllFields(); 
    });


    
    discountTypeSelect.addEventListener('change', function() {
        toggleMaxDiscountField();
        validateAllFields(); 
    });

    document.getElementById('createCouponForm').addEventListener('submit', function(event) {
        event.preventDefault(); 
        const formData = new FormData();
            formData.code = document.getElementById('code').value
            formData.discountAmount= document.getElementById('discountAmount').value
            formData.discountType= document.getElementById('discountType').value
            formData.maxDiscount= document.getElementById('maxDiscount').value
            formData.minOrderValue= document.getElementById('minOrderValue').value
            formData.expiresAt= document.getElementById('expiresAt').value
            formData.usageLimit= document.getElementById('usageLimit').value

            if(new Date(formData.expiresAt) < new Date() ){
                Swal.fire('Error!', 'Expire date must be futue date', 'error');
                return;
            }

        fetch('/admin/coupons/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({formData})
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Coupon Created!',
                    text: 'Your coupon has been created successfully.',
                }).then(() => {
                    location.reload();
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: data.message || 'An error occurred. Please try again.',
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: 'An error occurred while creating the coupon.',
            });
        });
    });

    $('#createCouponModal').on('show.bs.modal', function () {
        submitBtn.disabled = true;
        isUserInteracted = false;
        document.querySelectorAll('.text-danger').forEach(el => el.textContent = '');
        form.reset(); 
        toggleMaxDiscountField(); 
    });
});


document.addEventListener('DOMContentLoaded', function () {

    document.querySelectorAll('.editCouponBtn').forEach(button => {
        const maxDiscountInput = document.getElementById('editMaxDiscount');
        button.addEventListener('click', function() {
            const coupon = JSON.parse(this.dataset.coupon);
            document.getElementById('editCouponId').value = coupon._id;
            document.getElementById('editCode').value = coupon.code;
            document.getElementById('editDiscountAmount').value = coupon.discountAmount;
            document.getElementById('editDiscountType').value = coupon.discountType;
            if(coupon.maxDiscount){
                maxDiscountInput.parentElement.style.display = 'block';
                document.getElementById('editMaxDiscount').value = coupon.maxDiscount;
            }else{
                maxDiscountInput.parentElement.style.display = 'none';
            }
            document.getElementById('editMinOrderValue').value = coupon.minOrderValue;
            document.getElementById('editExpiresAt').value = new Date(coupon.expiresAt).toISOString().split('T')[0];
            document.getElementById('editUsageLimit').value = coupon.usageLimit;

            $('#editCouponModal').modal('show');
        });
    });

    document.getElementById('editCouponForm').addEventListener('submit', function(event) {
        event.preventDefault();
        
        const id = document.getElementById('editCouponId').value;
        const formData = {
            code: document.getElementById('editCode').value,
            discountAmount: document.getElementById('editDiscountAmount').value,
            discountType: document.getElementById('editDiscountType').value,
            maxDiscount: document.getElementById('editMaxDiscount').value,
            minOrderValue: document.getElementById('editMinOrderValue').value,
            expiresAt: document.getElementById('editExpiresAt').value,
            usageLimit: document.getElementById('editUsageLimit').value
        };

        if(new Date(formData.expiresAt) < new Date() ){
                Swal.fire('Error!', 'Expire date must be futue date', 'error');
                return;
            }

        fetch(`/admin/coupons/update/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Coupon Updated!',
                    text: 'Your coupon has been updated successfully.',
                }).then(() => {
                    location.reload();
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: data.message || 'An error occurred. Please try again.',
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: 'An error occurred while updating the coupon.',
            });
        });
    });

});


async function changeStatus(id, button) {
    const isActive = button.dataset.status === 'true'; 
    const newStatus = !isActive; 

    const result = await Swal.fire({
        title: 'Are you sure?',
        text: `You are about to ${newStatus ? 'list' : 'unlist'} this coupon.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, proceed!',
        cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
        button.innerText = newStatus ? 'Unlist' : 'List';
        button.dataset.status = newStatus;

        button.classList.toggle('btn-danger', newStatus);
        button.classList.toggle('btn-success', !newStatus);

        try {
            const response = await fetch(`/admin/coupons/${newStatus}/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Status Updated!',
                    text: `Coupon has been ${newStatus ? 'listed' : 'unlisted'}.`,
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: data.message || 'An error occurred. Please try again.',
                });
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: 'An error occurred while toggling the coupon status.',
            });
        }
    }
}
