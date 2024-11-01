
let cropper;

document.getElementById('categoryImage').addEventListener('change', function(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('imagePreview');

    if (cropper) {
        cropper.destroy();
        cropper = null; 
        preview.innerHTML = ''; 
    }

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img id="cropImage" src="${e.target.result}" alt="Category Image" class="img-thumbnail" style="max-width: 100px;">`;
            const image = document.getElementById('cropImage');
            cropper = new Cropper(image, {
                aspectRatio: 1, 
                viewMode: 1,
                ready: function () {
                    console.log('Cropper is ready');
                },
            });
        };
        reader.readAsDataURL(file);
    }
});

function editCategory(id, name, imageUrl) {
    document.getElementById('editCategoryId').value = id;
    document.getElementById('editCategoryName').value = name;

    const preview = document.getElementById('editImagePreview');
    
    if (cropper) {
        cropper.destroy();
        cropper = null; 
    }

    preview.innerHTML = `<img id="editCropImage" src="${imageUrl}" alt="Category Image" class="img-thumbnail" style="max-width: 100px;">`;
    const image = document.getElementById('editCropImage');
    cropper = new Cropper(image, {
        aspectRatio: 1, 
        viewMode: 1,
        ready: function () {
            console.log('Edit cropper is ready');
        },
    });

    const editImageInput = document.getElementById('editCategoryImage');
    editImageInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        const editPreview = document.getElementById('editImagePreview');

        if (cropper) {
            cropper.destroy();
            cropper = null; 
            editPreview.innerHTML = ''; 
        }

        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                editPreview.innerHTML = `<img id="editCropImage" src="${e.target.result}" alt="Category Image" class="img-thumbnail" style="max-width: 100px;">`;
                const image = document.getElementById('editCropImage');
                cropper = new Cropper(image, {
                    aspectRatio: 1, 
                    viewMode: 1,
                    ready: function () {
                        console.log('Edit cropper is ready');
                    },
                });
            };
            reader.readAsDataURL(file);
        }
    });

    $('#editCategoryModal').modal('show');
}

document.getElementById('addCategoryForm').addEventListener('submit', function(event) {
    event.preventDefault(); 
    const formData = new FormData();

    const categoryName = document.getElementById('categoryName').value;
    const croppedCanvas = cropper.getCroppedCanvas();
    
    formData.append('categoryName', categoryName);
    
    if (croppedCanvas) {
        croppedCanvas.toBlob(function(blob) {
            formData.append('categoryImage', blob);
            fetch('/admin/category/add', {
                method: 'POST',
                body: formData,
            })
            .then(response => {
                return response.json()
            })
            .then(data =>{
             if(data.success){
                    Swal.fire({
                    title: 'Category Added!',
                    text: data.message,
                    icon: 'success',
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: 'OK',
                  })
                  .then(()=>{
                    window.location.reload()
                  })

             }else{
                    Swal.fire({
                    title: 'Failed!',
                    text: data.message,
                    icon: 'error',
                    confirmButtonColor: '#000',
                    confirmButtonText: 'Close',
                })
                .then(()=>{
                    $('#addCategoryModal').modal('hide');
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
        });
    }
});

document.getElementById('editCategoryForm').addEventListener('submit', function(event) {
    event.preventDefault(); 
    const formData = new FormData();

    const categoryId = document.getElementById('editCategoryId').value;
    const categoryName = document.getElementById('editCategoryName').value;
    const croppedCanvas = cropper.getCroppedCanvas();
    formData.append('categoryName', categoryName)
    
    if (croppedCanvas) {
        croppedCanvas.toBlob(function(blob) {
            formData.append('categoryImage', blob);

            fetch(`/admin/category/edit/${categoryId}`, {
                method: 'PUT',
                body: formData,
            })
            .then(response => {
                return response.json()
            })
            .then(data =>{
             if(data.success){
                    Swal.fire({
                    title: 'Category Edited!',
                    text: data.message,
                    icon: 'success',
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: 'OK',
                  })
                  .then(()=>{
                    window.location.reload()
                  })

             }else{
                    Swal.fire({
                    title: 'Failed!',
                    text: data.message,
                    icon: 'error',
                    confirmButtonColor: '#000',
                    confirmButtonText: 'Close',
                })
                .then(()=>{
                    $('#editCategoryModal').modal('hide');
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
        });
    }
});

function changeCategoryStatus(id, button) {

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
    fetch(`/admin/category/${id}/${currentStatus ? 'unlist' : 'list'}`, {
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
