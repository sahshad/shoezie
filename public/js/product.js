




    // Sidebar toggle functionality
    document.getElementById('menuToggle').addEventListener('click', function () {
        document.getElementById('sidebar').classList.toggle('active');
        document.getElementById('page-content-wrapper').classList.toggle('toggled');
    });
 let deletedImages = [];
 let originalData={}
 let newImages = []; 
 let deletedSizes = [];
//populate edit fields with existing data
function populateEditModal(name, description,category, price, sizes, imageUrl,id) {
     sizes =JSON.parse(sizes)
    const imageUrls = JSON.parse(imageUrl);
    console.log(sizes);
    
    price = parseInt(price);
    document.getElementById('editProductName').value = name;
    document.getElementById('editProductDescription').value = description;
    document.getElementById('editProductCategory').value = category;
    document.getElementById('editProductPrice').value = price;
    document.getElementById('editProductId').value = id

    originalData = {
        name: name,
        description:description,
        category: category,
        price: parseInt(price),
        sizes: sizes,
        images: imageUrls,
        id

    };

    const sizeStockContainer = document.getElementById('editSizeStockContainer');
    sizeStockContainer.innerHTML = ''; 

    sizes.forEach((sizeStock,index) => {
        if(index===0){
            const newPair = document.createElement('div');
        newPair.className = 'row align-items-center size-stock-pair mt-2';
        newPair.innerHTML = `
            <div class="col-md-5">
                <input type="number" class="form-control" name="editProductSize[]" value="${sizeStock.size}" placeholder="Enter size" required>
            </div>
            <div class="col-md-5">
                <input type="number" class="form-control" name="editProductStock[]" value="${sizeStock.stock}" placeholder="Enter stock" min="1" required>
            </div>
            <div class="col-md-2">
                <button type="button" class="btn btn-success add-size-stock">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `;
        sizeStockContainer.appendChild(newPair);

        // Add event listener for the new remove button
        newPair.querySelector('.add-size-stock').addEventListener('click', function() {
            const container = document.getElementById('sizeStockContainer');
        const newPair = document.createElement('div');
        newPair.className = 'row align-items-center size-stock-pair mt-2';
        newPair.innerHTML = `
            <div class="col-md-5">
                <input type="number" class="form-control" name="editProductSize[]" value="" placeholder="Enter size" required>
            </div>
            <div class="col-md-5">
                <input type="number" class="form-control" name="editProductStock[]" value="" placeholder="Enter stock" min="1" required>
            </div>
            <div class="col-md-2">
                <button type="button" class="btn btn-danger remove-size-stock">
                    <i class="fas fa-minus"></i>
                </button>
            </div>
        `;
        sizeStockContainer.appendChild(newPair);
        
        // Add event listener for the new remove button
        newPair.querySelector('.remove-size-stock').addEventListener('click', function() {
            deletedSizes.push(sizeStock._id)
            sizeStockContainer.removeChild(newPair);
        });
        
        });
        }else{
        const newPair = document.createElement('div');
        newPair.className = 'row align-items-center size-stock-pair mt-2';
        newPair.innerHTML = `
            <div class="col-md-5">
                <input type="number" class="form-control" name="editProductSize[]" value="${sizeStock.size}" placeholder="Enter size" required>
            </div>
            <div class="col-md-5">
                <input type="number" class="form-control" name="editProductStock[]" value="${sizeStock.stock}" placeholder="Enter stock" min="1" required>
            </div>
            <div class="col-md-2">
                <button type="button" class="btn btn-danger remove-size-stock">
                    <i class="fas fa-minus"></i>
                </button>
            </div>
        `;
        sizeStockContainer.appendChild(newPair);

        // Add event listener for the new remove button
        newPair.querySelector('.remove-size-stock').addEventListener('click', function() {
            deletedSizes.push(sizeStock._id)
            sizeStockContainer.removeChild(newPair);
        });}
    });

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
    img.style = 'margin-right:10px; max-width: 70px; border: 1px solid #ccc; margin-bottom:10px';
    img.classList.add('img-fluid');

    const deleteButton = document.createElement('button');
    deleteButton.classList.add('btn', 'btn-danger', 'btn-sm', 'delete-button', 'mt-2');
    deleteButton.style.display = 'none'; // Hidden by default
    deleteButton.style.zIndex = '100';
    
    // Create the icon element
    const deleteIcon = document.createElement('i');
    deleteIcon.classList.add('fas', 'fa-trash'); // Font Awesome trash icon
    
    // Append the icon to the button
    deleteButton.appendChild(deleteIcon);

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
        deletedImages.push(url);
    };

    img.onclick = () => {
        openCropper(url,imageWrapper);
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

function openCropper(imageUrl, imageWrapper) {
    const cropperContainer = document.getElementById('cropperContainer');
    const cropImage = document.getElementById('cropImage');

    cropImage.src = imageUrl; // Set the image source for cropping
    cropperContainer.style.display = 'block'; // Show cropping container

    if (cropper) {
        cropper.destroy(); // Destroy previous cropper instance
    }

    cropper = new Cropper(cropImage, {
        aspectRatio: 1,
        viewMode: 1,
        autoCropArea: 1,
    });

    currentImageWrapper = imageWrapper; // Store the current image wrapper for later replacement

    document.getElementById('editCropImageButton').onclick = function() {
        if (cropper) {
            const canvas = cropper.getCroppedCanvas();
            const croppedImageUrl = canvas.toDataURL(); // Get the cropped image

            // Replace the original image
            const imgElement = currentImageWrapper.querySelector('img');
            imgElement.src = croppedImageUrl; // Update the image source

            cropper.destroy(); // Clean up
            cropper = null;
            cropperContainer.style.display = 'none'; // Hide cropping container
        }
    };
}


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
    // formData.append('productStock', document.getElementById('productStock').value);
      // Get all size and stock inputs
      const sizes = document.querySelectorAll('input[name="productSize[]"]');
      const stocks = document.querySelectorAll('input[name="productStock[]"]');
  
      // Append sizes and stocks to FormData
      sizes.forEach(sizeInput => {
          formData.append('productSize[]', sizeInput.value);
      });
      stocks.forEach(stockInput => {
          formData.append('productStock[]', stockInput.value);
      });
console.log(formData);

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
    const currentDescription = document.getElementById('editProductDescription').value;
    const currentPrice = parseInt(document.getElementById('editProductPrice').value);

    const payload = {}; // Object to hold only edited data

    // Check if sizes and stocks have changed
    const sizeInputs = document.querySelectorAll('input[name="editProductSize[]"]');
    const stockInputs = document.querySelectorAll('input[name="editProductStock[]"]');

    const updatedSizes = Array.from(sizeInputs).map((input, index) => {
        return {
            size: input.value,
            stock: stockInputs[index].value,
            id: originalData.sizes[index] ? originalData.sizes[index]._id : null // Include ObjectId if it exists
        };
    });

    // Compare sizes with original data
    const sizeChanged = JSON.stringify(updatedSizes) !== JSON.stringify(originalData.sizes.map(size => ({
        size: size.size,
        stock: size.stock,
        id: size._id // Adjust to include ObjectId comparison
    })));

    if (sizeChanged) {
        payload.sizes = updatedSizes; // Just assign the updated sizes directly
    }

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
    if (currentDescription !== originalData.description) {
        payload.description = currentDescription;
    }

    // Check if new images have been added
    if (newImages.length > 0) {
        payload.newImages = newImages; // Only include new images
    }
    if (deletedImages.length > 0) {
        payload.deletedImages = deletedImages; // Only include deleted images
    }

    if (deletedSizes.length > 0) {
        payload.deletedSizes = deletedSizes; // Include deleted sizes in the payload
    }

    // Only send payload if there are any changes
    if (Object.keys(payload).length > 0) {
        console.log('Sending data to backend:', payload);
        payload.id = originalData.id; // Include the product ID

        // Example: AJAX request (replace with your actual logic)
        fetch('/admin/products/edit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) {
                // Log the response status and message if not ok
                console.error('Server error:', response.status, response.statusText);
                return response.json().then(err => {
                    console.error('Error details:', err);
                });
            }
            return response.json(); // Assuming you expect a JSON response
        })
        .then(data => {
            console.log('Success:', data);
            $('#editProductModal').modal('hide'); 
            location.reload(); // Reload the page or update UI accordingly
        })
        .catch(error => {
            // Log network errors or any other errors
            console.error('Fetch error:', error);
        });
        
    } else {
        console.log('No changes detected.');
    }

    newImages = [];
});


function toggleProductStatus(productId, button) {
    const currentStatus = button.innerText === 'Unlist'; // Determine current status

    fetch(`/admin/products/${currentStatus ? 'unlist' : 'list'}/${productId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => {
        if (response.ok) {
            // Toggle button properties
            button.classList.toggle('btn-danger', !currentStatus);
            button.classList.toggle('btn-success', currentStatus);
            button.innerText = currentStatus ? 'List' : 'Unlist';
        } else {
            alert('Failed to toggle product status.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while toggling the product status.');
    });
}
