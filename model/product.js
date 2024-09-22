const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId,ref:'Category', required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    imageUrls: { type: [String], required: true },
    status: { type: Boolean, default: true }
}, {
    timestamps: true,
});

module.exports = mongoose.model('Product', productSchema);





// imageInput.addEventListener('change', function (event) {
        
//     imageGroup.innerHTML = '';
// imageGroup.style='display=block'
//     const files = event.target.files
//   // Loop through the selected files and display them
// for (let i = 0; i < files.length; i++) {
//     const file = files[i];
//     const reader = new FileReader();

//     reader.onload = function (e) {
//         // Create a new image element
//         const img = document.createElement('img');
//         img.src = e.target.result;
//         img.alt = `Image ${i + 1}`;
//         img.style.maxWidth = '100px'; // Set a fixed width
//         img.style.marginRight = '10px'; // Add some spacing
//         img.style.border = '1px solid #ccc'; // Optional: add a border

//         // Append the image to the img-group
//         imageGroup.appendChild(img);

//         // Add click event to open in cropper
//         img.addEventListener('click', function () {
//             // Destroy existing cropper instance if it exists
//             if (cropper) {
//                 cropper.destroy();
//             }

//             // Show the clicked image in the preview
//             imagePreview.src = img.src;
//             imagePreview.style.display = 'block';
//             cropImageButton.style.display = 'block';

//             // Initialize Cropper.js with the selected image
//             cropper = new Cropper(imagePreview, {
//                 aspectRatio: 1,
//                 viewMode: 1,
//             });
//         });
//     };

//     // Read the file as a data URL
//     reader.readAsDataURL(file);
// }
// });