const placeOrderButton = document.getElementById('placeOrderButton');

function validateFullName() {
    const fullNameInput = document.querySelector('input[placeholder="Full Name"]');
    const errorMessage = document.getElementById('fullNameError');
    const isValid = fullNameInput.value.trim() !== '';

    errorMessage.textContent = isValid ? '' : 'Full Name is required.';
    checkFormValidity();
}

function validateAddress() {
    const addressInput = document.querySelector('textarea[placeholder="Address"]');
    const errorMessage = document.getElementById('addressError');
    const isValid = addressInput.value.trim() !== '';

    errorMessage.textContent = isValid ? '' : 'Address is required.';
    checkFormValidity();
}

function validatePincode() {
    const pincodeInput = document.querySelector('input[placeholder="Pincode"]');
    const errorMessage = document.getElementById('pincodeError');
    const isValid = /^\d{6}$/.test(pincodeInput.value);

    errorMessage.textContent = isValid ? '' : 'Please enter a valid 6-digit pincode.';
    checkFormValidity();
}

function validatePhone() {
    const phoneInput = document.querySelector('input[placeholder="Phone Number"]');
    const errorMessage = document.getElementById('phoneError');
    const isValid = /^\d{10}$/.test(phoneInput.value);

    errorMessage.textContent = isValid ? '' : 'Please enter a valid 10-digit phone number.';
    checkFormValidity();
}

function onPaymentMethodChange(){
    const selectedPaymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value
    validateFullName()
    validateAddress()
    validatePincode()
    validatePhone()
}

function checkFormValidity() {
    const fullNameValid = document.getElementById('fullNameError').textContent === '';
    const addressValid = document.getElementById('addressError').textContent === '';
    const pincodeValid = document.getElementById('pincodeError').textContent === '';
    const phoneValid = document.getElementById('phoneError').textContent === '';
    const selectedPaymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value !== ''
    
    placeOrderButton.disabled = !(fullNameValid && addressValid && pincodeValid && phoneValid && selectedPaymentMethod );
}

function populateAddress() {
    const addressSelect = document.getElementById('addressSelect');
    const fullnameInput = document.querySelector('input[placeholder="Full Name"]');
    const addressInput = document.querySelector('textarea[placeholder="Address"]');
    const pincodeInput = document.querySelector('input[placeholder="Pincode"]');
    const phoneInput = document.querySelector('input[placeholder="Phone Number"]');

    const selectedOption = addressSelect.options[addressSelect.selectedIndex];

    if (selectedOption.value) {
        fullnameInput.value = selectedOption.value;
        addressInput.value = selectedOption.getAttribute('data-address');
        pincodeInput.value = selectedOption.getAttribute('data-pincode');
        phoneInput.value = selectedOption.getAttribute('data-phone');
    } else {
        fullnameInput.value = '';
        addressInput.value = '';
        pincodeInput.value = '';
        phoneInput.value = '';
    }

    validateFullName();
    validateAddress();
    validatePincode();
    validatePhone();
}

async function fetchRazorpayKey() {
    try {
        const response = await fetch('/get-razorpay-key');
        const data = await response.json();
        return data.key;
    } catch (error) {
        console.error('Error fetching Razorpay key:', error);
    }
}

async function placeOrder() {
const fullName = document.querySelector('input[placeholder="Full Name"]').value;
const address = document.querySelector('textarea[placeholder="Address"]').value;
const pincode = document.querySelector('input[placeholder="Pincode"]').value;
const phoneNumber = document.querySelector('input[placeholder="Phone Number"]').value;
const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
const couponCode = document.getElementById('couponCode').value || null;
let couponDiscount = document.getElementById('couponDiscount').innerHTML || 0;
let offerDiscount = document.getElementById('offerDiscount').innerHTML || 0;

couponDiscount = parseFloat(couponDiscount.replace(/[₹\s]/g, ''));
offerDiscount = parseFloat(offerDiscount.replace(/[₹\s]/g, ''));

const cartElement = document.getElementById('cartData');
const cart = JSON.parse(cartElement.getAttribute('data-cart'));

if(cart.products.length === 0){
    Swal.fire({
        icon:'error',
        title:'Oops..!',
        confirmButtonText:'Ok',
        confirmButtonColor:'#000',
        text:'No products to creata a order',
    })
    return 
}

const items = cart.products.map(item => ({
    productId: item.productId._id,
    sizeId: item.sizeId,
    offerId:item.bestOffer ? item.bestOffer._id : null,
    quantity: item.quantity,
    price: item.productId.price
}))

let totalAmount = cart.products.reduce((acc, item) => acc + (item.productId.price * item.quantity), 0);
totalAmount -= couponDiscount + offerDiscount;

const shippingAddress = {
    fullname: fullName,
    address,
    pincode,
    phone: phoneNumber
};

const orderData = {
    items,
    totalAmount,
    shippingAddress,
    paymentMethod,
    couponCode,
    offerDiscount,
    couponDiscount
};

try {

    if(paymentMethod === 'cashOnDelivery' && totalAmount > 1000){
        Swal.fire({
            title: 'COD limit exceed',
            text: "COD orders can't exceed ₹1000.",
            icon: 'error',
            confirmButtonText: 'OK',
        });
        return;
    }
    const response = await fetch('/cart/checkout/confirm-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
    });

    const order = await response.json();
    
    if(order.success === false){
        Toastify({
            text: order.message,
            duration: 1000,
            close: true,
            gravity: "top",
            position: 'right',
            style:{ background: "linear-gradient(to right, #ff5f5f, #ff1a1a)" }
        }).showToast();
        return;
    }
    
    if (paymentMethod === 'razorpay') {
        launchRazorpay(order._id, orderData);
    } else {
        showSuccessToast('Order placed successfully!');
        redirectToOrdersPage(order._id);
    }
} catch (error) {
    console.error('Error creating order:', error);
    alert('Failed to create order. Please try again.');
}

}

function redirectToOrdersPage(orderId) {
    window.location.href = `/cart/checkout/order-created/${orderId}`
}

function showSuccessToast(message) {
Toastify({
    text: message,
    duration: 3000,
    close: true,
    gravity: "top",
    position: 'center',
    backgroundColor: "#4CAF50",
}).showToast();
}

async function launchRazorpay(orderId, orderData) {
const razorpayKey = await fetchRazorpayKey();
const options = {
    key: razorpayKey,
    amount: orderData.totalAmount * 100,
    currency: "INR",
    name: "SHOEZIE",
    description: "Order Payment",
    handler: async function (response) {
        await updateOrderStatus(orderId, response, 'Paid',orderData);
    },
    prefill: {
        name: orderData.shippingAddress.fullname,
        contact: orderData.shippingAddress.phone,
    },
    theme: { color: "#3399cc" },
    modal: {
        ondismiss: async function () {
            await updateOrderStatus(orderId, null, 'Failed',orderData);
        },
    }
}
const rzp = new Razorpay(options);
rzp.open();
}

async function updateOrderStatus(orderId, razorpayResponse, status,orderData) {
const data = { status, razorpayResponse }
try {
    const response = await fetch(`/cart/checkout/update-order/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    
    const res = await response.json()
    
    if (res.success) {
        Swal.fire({
            icon:'success',
            title:'Success',
            text: res.message,
            confirmButtonText: 'Ok',
            confirmButtonColor: '#000' 
        })
        .then(()=>{
            redirectToOrdersPage(orderId);
        })
    } else {
            Swal.fire({
            title: 'Payment Failed',
            text: res.message,
            icon: 'error',
            showCancelButton: true, 
            confirmButtonText: 'Try Again',
            confirmButtonColor: '#000',
            cancelButtonText:'cancel' ,
            cancelButtonColor:'#000',
        })
        .then((result) =>{
            if(result.isConfirmed){
                launchRazorpay(orderId, orderData)
            }else{
                redirectToOrdersPage(orderId);
            }
        })
        
    }
} catch (error) {
    console.error('Error updating order status:', error);

    Swal.fire({
        title: 'Error',
        text: 'error'+ error,
        icon: 'error', 
        confirmButtonText: 'Ok',
        confirmButtonColor: '#000' 
    })
}
}


document.getElementById('placeOrderButton').addEventListener('click', function (e) {
e.preventDefault();
placeOrder();
});

function applyCoupon(total) {
const couponCode = document.getElementById('couponCode').value.trim();
let subtotal = document.getElementById('total').innerText;
subtotal = subtotal.replace(/[₹\s]/g, '');
subtotal = parseFloat(subtotal);

if (!couponCode) {
    Toastify({
        text: 'Please enter a coupon code',
        duration: 3000,
        backgroundColor: "#f44336"
    }).showToast();
    return;
}

fetch(`/cart/coupon/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: couponCode, subtotal })
})
.then(response => response.json())
.then(data => {
    if (data.success) {
        document.getElementById('couponDiscount').innerText = `₹ ${data.discountAmount.toFixed(2)}`;
        const total = subtotal - data.discountAmount;
        document.getElementById('total').innerText = `₹ ${total.toFixed(2)}`;

        const applyButton = document.getElementById('applyButton');
        applyButton.innerText = 'Remove';
        applyButton.style.backgroundColor = ' #DC4C64'
        applyButton.setAttribute('onclick', 'removeCoupon()');

        Toastify({
            text: 'Coupon applied successfully!',
            duration: 3000,
            backgroundColor: "#4CAF50"
        }).showToast();
    } else {
        Toastify({
            text: data.message,
            duration: 3000,
            backgroundColor: "#f44336"
        }).showToast();
    }
})
.catch(error => {
    console.error('Error:', error);
    Toastify({
        text: 'An error occurred. Please try again.',
        duration: 3000,
        backgroundColor: "#f44336"
    }).showToast();
});
}

function removeCoupon() {
document.getElementById('couponDiscount').innerText = '₹ 0.00';
const subtotal = document.getElementById('subtotal').innerText;
const originalTotal = parseFloat(subtotal.replace(/[₹\s]/g, ''));
let offerDiscount = document.getElementById('offerDiscount').innerText
offerDiscount = parseFloat(offerDiscount.replace(/[₹\s]/g, ''));
document.getElementById('total').innerText = `₹ ${(originalTotal-offerDiscount).toFixed(2)}`;

const applyButton = document.getElementById('applyButton');
applyButton.innerText = 'Apply';
applyButton.style.backgroundColor = '#3B71CA'
applyButton.setAttribute('onclick', 'applyCoupon()');

Toastify({
    text: 'Coupon removed.',
    duration: 3000,
    backgroundColor: "#FF9800"
}).showToast();
}
