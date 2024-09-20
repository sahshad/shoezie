




    // Sidebar toggle functionality
    document.getElementById('menuToggle').addEventListener('click', function () {
        document.getElementById('sidebar').classList.toggle('active');
        document.getElementById('page-content-wrapper').classList.toggle('toggled');
    });

    // Variables to handle modal actions
    let productToDelete = null;

function showConfirmDeleteModal(productId,productName) {
    document.getElementById('delete-target').innerHTML=productName
    productToDelete = productId; // Store the product ID
    $('#confirmDeleteModal').modal('show'); // Show the modal
    
}

document.getElementById('confirmDeleteButton').addEventListener('click', function () {
    if (productToDelete) {
        // Send a DELETE request to your server
        fetch(`/admin/products/delete/${productToDelete}`, {
            method: 'DELETE',
        })
        .then(response => {
            if (response.ok) {
                console.log('Product deleted:', productToDelete);
                $('#confirmDeleteModal').modal('hide'); // Hide the modal
                // Optionally refresh the product list or remove the product from the UI
                // For example, you could remove the product row from the table
                location.reload();
            } else {
                console.error('Error deleting product:', response.statusText);
            }
        })
        .catch(error => {
            console.error('Error deleting:', error);
        });
    }
});
 
 let originalData={}
 let newImages = []; 

    document.getElementById('confirmDeleteButton').addEventListener('click', function () {
        if (productToDelete) {
            console.log('Product deleted:', productToDelete);
            $('#confirmDeleteModal').modal('hide');
        }
    });

    function populateEditModal(name, description,category, price, stock, imageUrl,id) {
    const imageUrls = JSON.parse(imageUrl);
    
    price = parseInt(price);
    document.getElementById('editProductName').value = name;
    document.getElementById('editProductDescription').value = description;
    document.getElementById('editProductCategory').value = category;
    document.getElementById('editProductPrice').value = price;
    document.getElementById('editProductStock').value = stock;
    document.getElementById('editProductId').value = id

    originalData = {
        name: name,
        description:description,
        category: category,
        price: parseInt(price),
        stock: stock,
        images: imageUrls,
        id

    };

    // Clear existing images
    let imagesContainer = document.getElementById('editProductImageView');
    imagesContainer.innerHTML = '';

    // Append existing images
    imageUrls.forEach(url => {
        appendImage(imagesContainer, url);
    });
}

// Function to append image with delete button
function appendImage(container, url) {
    const imageWrapper = document.createElement('div');
    imageWrapper.classList.add('image-wrapper');
    imageWrapper.setAttribute('data-url', url);

    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Product image';
    img.style = 'margin-right:10px; max-width: 100px;';
    img.classList.add('img-fluid');

    const deleteButton = document.createElement('button');
    deleteButton.innerText = 'Delete';
    deleteButton.classList.add('btn', 'btn-danger', 'delete-button');
    deleteButton.style.display = 'none'; // Hidden by default

    // Show the delete button on hover
    imageWrapper.onmouseenter = () => {
        deleteButton.style.display = 'block';
    };
    imageWrapper.onmouseleave = () => {
        deleteButton.style.display = 'none';
    };

    // Delete image logic
    deleteButton.onclick = () => {
        imageWrapper.remove(); // Remove the image wrapper
        // Add additional logic to handle removal from the product data if needed
    };

    imageWrapper.appendChild(img);
    imageWrapper.appendChild(deleteButton);
    container.appendChild(imageWrapper);
}

// Function to handle new image uploads
document.getElementById('editProductImage').addEventListener('change', function(event) {
    const files = event.target.files;
    const imagesContainer = document.getElementById('editProductImageView');

    // Display new images
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            // Use appendImage to add the new image with a delete button
            appendImage(imagesContainer, e.target.result);
            newImages.push(e.target.result);
        };

        reader.readAsDataURL(file);
    }

    // Reset the file input to allow the same files to be selected again
    event.target.value = '';
});



let cropper;
const imageInput = document.getElementById('productImage');
const imagePreview = document.getElementById('imagePreview');
const cropImageButton = document.getElementById('cropImageButton');
let croppedFiles = [];
const originalFiles = []; // To store original files
const imageGroup = document.querySelector('.img-group');

imageInput.addEventListener('change', function (event) {
    imageGroup.innerHTML = '';
    imageGroup.style.display = 'block';

    const files = event.target.files;
    console.log(files);
    
    // Loop through the selected files and display them
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        originalFiles[i] = file; // Store the original files
        const reader = new FileReader();

        reader.onload = function (e) {
            // Create a new image element
            const img = document.createElement('img');
            img.src = e.target.result;
            img.alt = `Image ${i + 1}`;
            img.style.maxWidth = '100px';
            img.style.marginRight = '10px';
            img.style.border = '1px solid #ccc';

            // Append the image to the image group
            imageGroup.appendChild(img);

            // Add click event to open in cropper
            img.addEventListener('click', function () {
                // Destroy existing cropper instance if it exists
                if (cropper) {
                    cropper.destroy();
                }

                // Show the clicked image in the preview
                imagePreview.src = img.src;
                imagePreview.style.display = 'block';
                cropImageButton.style.display = 'block';

                // Initialize Cropper.js with the selected image
                cropper = new Cropper(imagePreview, {
                    aspectRatio: 1,
                    viewMode: 1,
                    autoCrop: true,
                    autoCropArea: 1,
                    background: false,
                    cropBoxResizable: true,
                    cropBoxMovable: true,
                    minCropBoxWidth: 80,
                    minCropBoxHeight: 80,
                });

                // Update the cropped file on cropping
                cropImageButton.onclick = function () {
                    const canvas = cropper.getCroppedCanvas();
                    canvas.toBlob((blob) => {
                        const croppedFile = new File([blob], 'croppedImage.png', {
                            type: 'image/png',
                            lastModified: Date.now(),
                        });
                        // Replace the original image source with the cropped image
                        img.src = URL.createObjectURL(croppedFile);

                        // Store cropped file in the array
                        croppedFiles[i] = croppedFile; // Save cropped image to array
                    });
                };
            });
        };

        // Read the file as a data URL 
        reader.readAsDataURL(file); 
    }
});

// Event listener for the Add Product button
document.getElementById('addProductButton').addEventListener('click', function (event) {
    event.preventDefault(); // Prevent the default form submission
    const formData = new FormData(); 
    
    croppedFiles.forEach((file, index) => {   // Append cropped files or original files to FormData
        formData.append('productImage[]', file, `croppedImage${index}.png`);
    });

    // Append original files if they were not cropped
    originalFiles.forEach((file, index) => {
        if (!croppedFiles[index]) { // If no cropped version exists
            formData.append('productImage[]', file);
        }
    });

    // Append other form fields
    formData.append('productName', document.getElementById('productName').value);
    formData.append('productDescription', document.getElementById('productDescription').value);
    formData.append('productCategory', document.getElementById('productCategory').value);
    formData.append('productPrice', document.getElementById('productPrice').value);
    formData.append('productStock', document.getElementById('productStock').value);

    // Upload to your backend
    fetch('/admin/products/add', {
        method: 'POST',
        body: formData,
    }).then(response => {
        if (response.ok) {
            console.log('Product added successfully');
            $('#addProductModal').modal('hide'); // Close the modal on success
            // Optionally refresh the product list or update the UI
            location.reload()
        } else {
            console.error('Error adding product:', response.statusText);
        }
    }).catch(error => {
        console.error('Error uploading:', error);
    });
});


// document.getElementById('editProductButton').addEventListener('click', function (event) {
//     event.preventDefault(); // Prevent the default form submission
//     const formData = new FormData(); 
    
//     // croppedFiles.forEach((file, index) => {   // Append cropped files or original files to FormData
//     //     formData.append('productImage[]', file, `croppedImage${index}.png`);
//     // });

//     // Append original files if they were not cropped
//     // originalFiles.forEach((file, index) => {
//     //     if (!croppedFiles[index]) { // If no cropped version exists
//     //         formData.append('productImage[]', file);
//     //     }
//     // });

//     const imageWrappers = document.querySelectorAll('#editProductImageView .image-wrapper');
//     const imageUrls = [];

//     imageWrappers.forEach(wrapper => {
//         const imageUrl = wrapper.getAttribute('data-url'); // Get the stored URL
//         imageUrls.push(imageUrl); // Add to the array
//     });
// console.log(imageUrls);

//     imageUrls.forEach((file, index) => {

//             formData.append('productImage[]', file);
//     });

//     // Append other form fields
//     formData.append('editProductName', document.getElementById('editProductName').value);
//     formData.append('editProductDescription', document.getElementById('editProductDescription').value);
//     formData.append('editProductCategory', document.getElementById('editProductCategory').value);
//     formData.append('editProductPrice', document.getElementById('editProductPrice').value);
//     formData.append('editProductStock', document.getElementById('editProductStock').value);


//     // Upload to your backend
//     fetch('/admin/products/edit', {
//         method: 'POST',
//         body: formData,
//     }).then(response => {
//         if (response.ok) {
//             console.log('Product added successfully');
//             $('#addProductModal').modal('hide'); // Close the modal on success
//             // Optionally refresh the product list or update the UI
//             location.reload()
//         } else {
//             console.error('Error adding product:', response.statusText);
//         }
//     }).catch(error => {
//         console.error('Error uploading:', error);
//     });
// })


document.getElementById('editProductButton').addEventListener('click', function() {
    const currentName = document.getElementById('editProductName').value;
    const currentCategory = document.getElementById('editProductCategory').value;
    const currentPrice = parseInt(document.getElementById('editProductPrice').value);
    const currentStock = document.getElementById('editProductStock').value;

    const payload = {}; // Object to hold only edited data

    // Check if any field has changed and add to payload
    if (currentName !== originalData.name) {
        payload.name = currentName;
    }
    if (currentCategory !== originalData.category) {
        payload.category = currentCategory;
    }
    if (currentPrice !== originalData.price) {
        payload.price = currentPrice;
    }
    if (currentStock !== originalData.stock) {
        payload.stock = currentStock;
    }

    // Check if new images have been added
    if (newImages.length > 0) {
        payload.newImages = newImages; // Only include new images
    }

    // Only send payload if there are any changes
    if (Object.keys(payload).length > 0) {
        console.log('Sending data to backend:', payload);
       payload.id = originalData.id
        // Example: AJAX request (replace with your actual logic)
        fetch('/admin/products/edit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        }).then(response => {
            if (response.ok) {
                $('#editProductModal').modal('hide'); 
                // Optionally, close the modal or refresh the product list
                location.reload()
            } else {
                location.reload()
            }
        });
    } else {
 
    }

    newImages = [];
});