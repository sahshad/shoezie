
function openReturnApprovalModal(orderId,reason) {
    document.getElementById('returnOrderId').innerText = orderId;
    document.getElementById('returnReason').innerText = reason
    $('#returnApprovalModal').modal('show');
}

function approveReturn(action) {
    const orderId = document.getElementById('returnOrderId').innerText;

    fetch(`/admin/orders/return/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }) 
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: data.message,
            }).then(() => {
                location.reload(); 
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Failed',
                text: data.message,
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Something went wrong. Please try again later.',
        });
    });
}

        function viewOrder(orderId, products) {
            
            document.getElementById('orderId').innerText=orderId
            $('#viewOrderModal').modal('show');
        }

        function changeOrderStatus() {
            const newStatus = document.getElementById('orderStatusSelect').value;
            console.log(`Changing order status to ${newStatus}`);
        }

        document.getElementById('menuToggle').addEventListener('click', function() {
            document.getElementById('sidebar').classList.toggle('active');
            document.getElementById('page-content-wrapper').classList.toggle('toggled');
        });


        function openChangeStatusModal(orderId) {
    document.getElementById('changeOrderId').innerText = orderId;
    $('#changeStatusModal').modal('show');
}

function submitChangeStatus() {
    const orderId = document.getElementById('changeOrderId').innerText;
    const newStatus = document.getElementById('changeOrderStatusSelect').value;
    
    console.log(`Changing order ${orderId} status to ${newStatus}`);

    fetch(`/admin/orders/status/${orderId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderStatus: newStatus })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Order status changed successfully:', data);
        location.reload();
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
    });
}
