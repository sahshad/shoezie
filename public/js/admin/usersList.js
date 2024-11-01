function toggleUserStatus(UserId, button) {
    const currentStatus = button.innerText === 'Unlist';
    const row = button.closest('tr');
    const badge = row.querySelector('.badge');

    Swal.fire({
title: 'Are you sure?',
text: `You are about to ${currentStatus ? 'unlist' : 'list'} this category.`,
icon: 'warning',
showCancelButton: true,
confirmButtonColor: '#000',
cancelButtonColor: '#d33',
confirmButtonText: 'Yes, Proceed !',
cancelButtonText: 'No, Cancel!',
}).then((result) => {

if (result.isConfirmed) {
    fetch(`/admin/users/${UserId}/${currentStatus ? 'unlist' : 'list'}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => {
        return response.json()
    })
    .then(data =>{
    if(data.success){
        
         Swal.fire({
         title: 'Status Changed!',
         text: data.message,
         icon: 'success',
         confirmButtonColor: '#3085d6',
         confirmButtonText: 'OK',
         })
         .then(()=>{
            button.classList.toggle('btn-danger', !currentStatus);
            button.classList.toggle('btn-success', currentStatus);
            button.innerText = currentStatus ? 'List' : 'Unlist';

            badge.classList.toggle('bg-danger', currentStatus);
            badge.classList.toggle('bg-success', !currentStatus);
            badge.innerText = currentStatus ? 'Incative' : 'Active';
         })

     }else{
        Swal.fire({
        title: 'Failed!',
        text: data.message,
        icon: 'error',
        confirmButtonColor: '#000',
        confirmButtonText: 'Close',
        })
    }
    })
    .catch(error =>{
        Swal.fire({
        title: 'Error!',
        text: + error.message,
        icon: 'error',
        confirmButtonColor: '#d33',
        confirmButtonText: 'Try Again',
        });
    console.error('Error:', error);
    })
} 
});
}