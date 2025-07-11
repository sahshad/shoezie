let deletedImages = [];
let originalData = {};
let newImages = [];
let croppedImages = [];
let deletedSizes = [];
let currentImagesLength;

function populateEditModal(name, category, price, sizes, imageUrl, id, button) {
  const row = button.closest("tr");
  const descriptionElement = row.querySelector(".product-description");
  const description = descriptionElement.getAttribute("data-description");

  sizes = JSON.parse(sizes);
  const imageUrls = JSON.parse(imageUrl);

  price = parseInt(price);
  document.getElementById("editProductName").value = name;
  document.getElementById("editProductDescription").value = description;
  document.getElementById("editProductCategory").value = category;
  document.getElementById("editProductPrice").value = price;
  document.getElementById("editProductId").value = id;

  originalData = {
    name: name,
    description: description,
    category: category,
    price: parseInt(price),
    sizes: sizes,
    images: imageUrls,
    id,
  };

  const sizeStockContainer = document.getElementById("editSizeStockContainer");
  sizeStockContainer.innerHTML = "";

  sizes.forEach((sizeStock, index) => {
    if (index === 0) {
      const newPair = document.createElement("div");
      newPair.className = "row align-items-center size-stock-pair mt-2";
      newPair.innerHTML = `
            <div class="col-md-5">
                <input type="text" class="form-control" name="editProductSize[]" value="${sizeStock.size}" placeholder="Enter size" onkeypress="return event.charCode >= 48 && event.charCode <= 57"  required>
            </div>
            <div class="col-md-5">
                <input type="text" class="form-control" name="editProductStock[]" value="${sizeStock.stock}" placeholder="Enter stock" min="1" onkeypress="return event.charCode >= 48 && event.charCode <= 57"  required>
            </div>
            <div class="col-md-2">
                <button type="button" class="btn btn-success add-size-stock" value="${sizeStock._id}">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `;
      sizeStockContainer.appendChild(newPair);

      newPair.querySelector(".add-size-stock").addEventListener("click", function () {
        const container = document.getElementById("sizeStockContainer");
        const newPair = document.createElement("div");
        newPair.className = "row align-items-center size-stock-pair mt-2";
        newPair.innerHTML = `
            <div class="col-md-5">
                <input type="text" class="form-control" name="editProductSize[]" value="" placeholder="Enter size" onkeypress="return event.charCode >= 48 && event.charCode <= 57"  required>
            </div>
            <div class="col-md-5">
                <input type="text" class="form-control" name="editProductStock[]" value="" placeholder="Enter stock" min="1" onkeypress="return event.charCode >= 48 && event.charCode <= 57"  required>
            </div>
            <div class="col-md-2">
                <button type="button" class="btn btn-danger remove-size-stock">
                    <i class="fas fa-minus"></i>
                </button>
            </div>
        `;
        sizeStockContainer.appendChild(newPair);

        newPair.querySelector(".remove-size-stock").addEventListener("click", function () {
          if (this.value !== "") {
            console.log(this.value);
            deletedSizes.push(this.value);
          }
          sizeStockContainer.removeChild(newPair);
        });
      });
    } else {
      const newPair = document.createElement("div");
      newPair.className = "row align-items-center size-stock-pair mt-2";
      newPair.innerHTML = `
            <div class="col-md-5">
                <input type="text" class="form-control" name="editProductSize[]" value="${sizeStock.size}" placeholder="Enter size" onkeypress="return event.charCode >= 48 && event.charCode <= 57"  required>
            </div>
            <div class="col-md-5">
                <input type="text" class="form-control" name="editProductStock[]" value="${sizeStock.stock}" placeholder="Enter stock" min="1" onkeypress="return event.charCode >= 48 && event.charCode <= 57"  required>
            </div>
            <div class="col-md-2">
                <button type="button" class="btn btn-danger remove-size-stock" value="${sizeStock._id}">
                    <i class="fas fa-minus"></i>
                </button>
            </div>
        `;
      sizeStockContainer.appendChild(newPair);

      newPair.querySelector(".remove-size-stock").addEventListener("click", function () {
        if (this.value !== "") {
          console.log(this.value);
          deletedSizes.push(this.value);
        }
        sizeStockContainer.removeChild(newPair);
      });
    }
  });

  let imagesContainer = document.getElementById("editProductImageView");
  imagesContainer.innerHTML = "";

  currentImagesLength = imageUrls.length;

  imageUrls.forEach((url) => {
    appendImage(imagesContainer, url);
  });
}

function appendImage(container, url) {
  const imageWrapper = document.createElement("div");
  imageWrapper.classList.add("image-wrapper");
  imageWrapper.setAttribute("data-url", url);

  const img = document.createElement("img");
  img.src = url;
  img.alt = "Product image";
  img.style = "margin-right:10px; max-width: 70px; border: 1px solid #ccc; margin-bottom:10px; border-radius:6px;";
  img.classList.add("img-fluid");

  const deleteButton = document.createElement("button");
  deleteButton.innerHTML = "✕";
  deleteButton.classList.add("product-image-remove-button");

  const deleteIcon = document.createElement("i");
  deleteButton.appendChild(deleteIcon);

  imageWrapper.onmouseenter = () => {
    deleteButton.style.display = "block";
  };
  imageWrapper.onmouseleave = () => {
    deleteButton.style.display = "none";
  };

  deleteButton.onclick = () => {
    imageWrapper.remove();
    deletedImages.push(url);
  };

  img.onclick = () => {
    openCropper(url, imageWrapper);
  };

  imageWrapper.appendChild(img);
  imageWrapper.appendChild(deleteButton);
  container.appendChild(imageWrapper);
}

document.getElementById("editProductImage").addEventListener("change", function (event) {
  const files = event.target.files;
  const imagesContainer = document.getElementById("editProductImageView");

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const reader = new FileReader();

    reader.onload = function (e) {
      appendImage(imagesContainer, e.target.result);
      newImages.push(e.target.result);
    };

    reader.readAsDataURL(file);
  }
  event.target.value = "";
});

let cropper;

function openCropper(imageUrl, imageWrapper) {
  const cropperContainer = document.getElementById("cropperContainer");
  const cropImage = document.getElementById("cropImage");

  cropImage.src = imageUrl;
  cropperContainer.style.display = "block";

  if (cropper) {
    cropper.destroy();
  }

  cropper = new Cropper(cropImage, {
    aspectRatio: 1,
    viewMode: 1,
    autoCropArea: 1,
  });

  currentImageWrapper = imageWrapper;

  document.getElementById("editCropImageButton").onclick = function () {
    if (imageUrl.startsWith("https://res.cloudinary.com/")) {
      deletedImages.push(imageUrl);
    }
    if (cropper) {
      const canvas = cropper.getCroppedCanvas();
      const croppedImageUrl = canvas.toDataURL();

      const imgElement = currentImageWrapper.querySelector("img");
      imgElement.src = croppedImageUrl;

      imgElement.onclick = () => {
        openCropper(croppedImageUrl, imageWrapper);
      };

      newImages = newImages.filter((url) => url !== imageUrl);
      newImages.push(croppedImageUrl);
      console.log(newImages);

      cropper.destroy();
      cropper = null;
      cropperContainer.style.display = "none";
    }
  };
}

const imageInput = document.getElementById("productImage");
const imagePreview = document.getElementById("imagePreview");
const cropImageButton = document.getElementById("cropImageButton");
let croppedFiles = [];
const originalFiles = [];
const imageGroup = document.querySelector(".img-group");

imageInput.addEventListener("change", function (event) {
  imageGroup.innerHTML = "";
  imageGroup.style.display = "block";

  const files = event.target.files;
  console.log(files);

  if (files.length > 5) {
    showErrorAlert("cannot add more than five images");
    return;
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    originalFiles[i] = file;
    const reader = new FileReader();

    reader.onload = function (e) {
      const imageWrapper = document.createElement("div");
      imageWrapper.classList.add("image-wrapper");

      const img = document.createElement("img");
      img.src = e.target.result;
      img.alt = `Image ${i + 1}`;
      img.style = "margin-right:10px; max-width: 70px; border: 1px solid #ccc; margin-bottom:10px; border-radius:6px;";

      const deleteButton = document.createElement("button");
      deleteButton.innerHTML = "✕";
      deleteButton.classList.add("product-image-remove-button");

      const deleteIcon = document.createElement("i");
      deleteButton.appendChild(deleteIcon);

      deleteButton.onclick = () => {
        imageWrapper.remove();
        const index = originalFiles.indexOf(file);
        if (index !== -1) originalFiles.splice(index, 1);

        const dataTransfer = new DataTransfer();
        originalFiles.forEach((f) => dataTransfer.items.add(f));
        imageInput.files = dataTransfer.files;
      };

      imageWrapper.onmouseenter = () => {
        deleteButton.style.display = "block";
      };
      imageWrapper.onmouseleave = () => {
        deleteButton.style.display = "none";
      };

      imageWrapper.appendChild(img);
      imageWrapper.appendChild(deleteButton);
      imageGroup.appendChild(imageWrapper);

      img.addEventListener("click", function () {
        if (cropper) {
          cropper.destroy();
        }

        imagePreview.src = img.src;
        imagePreview.style.display = "block";
        cropImageButton.style.display = "block";

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

        cropImageButton.onclick = function () {
          const canvas = cropper.getCroppedCanvas();
          canvas.toBlob((blob) => {
            const croppedFile = new File([blob], "croppedImage.png", {
              type: "image/png",
              lastModified: Date.now(),
            });

            img.src = URL.createObjectURL(croppedFile);

            originalFiles[i] = croppedFile;

            const dataTransfer = new DataTransfer();
            originalFiles.forEach((f) => dataTransfer.items.add(f));
            imageInput.files = dataTransfer.files;
          });
        };
      });
    };
    reader.readAsDataURL(file);
  }
});

document.getElementById("addProductButton").addEventListener("click", function (event) {
  event.preventDefault();
  const formData = new FormData();

  const productName = document.getElementById("productName").value;
  const productDescription = document.getElementById("productDescription").value;
  const productCategory = document.getElementById("productCategory").value;
  const productPrice = document.getElementById("productPrice").value;

  if (!productName) {
    return showErrorAlert("Product Name is required.");
  }
  if (!productDescription) {
    return showErrorAlert("Product Description is required.");
  }
  if (!productCategory) {
    return showErrorAlert("Product Category is required.");
  }

  if (!productPrice) {
    return showErrorAlert("Product Price is required.");
  }
  if (productPrice < 1) {
    return showErrorAlert("Product Price must be greater than 0");
  }

  const sizes = document.querySelectorAll('input[name="productSize[]"]');
  const stocks = document.querySelectorAll('input[name="productStock[]"]');

  const allSizesFilled = Array.from(sizes).every((sizeInput) => sizeInput.value.trim() !== "");
  const allStocksFilled = Array.from(stocks).every((stockInput) => stockInput.value.trim() !== "");

  if (!allSizesFilled) {
    return showErrorAlert("Product Size is required.");
  }
  if (!allStocksFilled) {
    return showErrorAlert("Product Stock is required.");
  }

  const hasInvalidSize = Array.from(sizes).some((sizeInput) => {
    const num = Number(sizeInput.value);
    return sizeInput.value === "" || num === 0 || num > 18 || num < 1;
  });

  const hasInvalidStock = Array.from(stocks).some((stockInput) => {
    const num = Number(stockInput.value);
    return stockInput.value === "" || num < 1 || num > 10000;
  });

  if (hasInvalidSize) {
    return showErrorAlert("Size must be between 1 and 18");
  }

  if (hasInvalidStock) {
    return showErrorAlert("Stock must be between 1 and 10,000");
  }

  const sizeValues = Array.from(sizes).map((input) => input.value.trim());
  const uniqueSizes = new Set(sizeValues);

  if (uniqueSizes.size !== sizeValues.length) {
    return showErrorAlert("Sizes must be unique.");
  }

  const totalImages = croppedFiles.length + originalFiles.length;
  if (totalImages === 0) {
    return showErrorAlert("Product Image is required");
  }
  if (totalImages < 3) {
    return showErrorAlert("You have to upload atlead 3 images");
  }
  if (totalImages > 5) {
    return showErrorAlert("You can upload a maximum of 5 images.");
  }

  croppedFiles.forEach((file, index) => {
    formData.append("productImage[]", file, `croppedImage${index}.png`);
  });

  originalFiles.forEach((file, index) => {
    if (!croppedFiles[index]) {
      formData.append("productImage[]", file);
    }
  });

  formData.append("productName", productName);
  formData.append("productDescription", productDescription);
  formData.append("productCategory", productCategory);
  formData.append("productPrice", productPrice);

  sizes.forEach((sizeInput) => {
    formData.append("productSize[]", sizeInput.value);
  });
  stocks.forEach((stockInput) => {
    formData.append("productStock[]", stockInput.value);
  });

  document.getElementById("addProductOverlay").style.display = "block";
  document.getElementById("addProductSpinner").style.display = "block";

  fetch("/admin/products/add", {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      if (data.success) {
        Swal.fire({
          title: "Product Added!",
          text: data.message,
          icon: "success",
          confirmButtonColor: "#000",
          confirmButtonText: "OK",
        }).then(() => {
          window.location.reload();
        });
      } else {
        Swal.fire({
          title: "Failed!",
          text: data.message,
          icon: "error",
          confirmButtonColor: "#000",
          confirmButtonText: "Close",
        }).then(() => {
          $("#addCategoryModal").modal("hide");
        });
      }
    })
    .catch((error) => {
      Swal.fire({
        title: "Error!",
        text: +error.message,
        icon: "error",
        confirmButtonColor: "#000",
        confirmButtonText: "Try Again",
      });
      console.error("Error:", error);
    })
    .finally(() => {
      document.getElementById("addProductOverlay").style.display = "none";
      document.getElementById("addProductSpinner").style.display = "none";
    });
});

function showErrorAlert(message) {
  Swal.fire({
    title: "Error!",
    text: message,
    icon: "error",
    confirmButtonColor: "#d33",
    confirmButtonText: "OK",
  });
}

document.getElementById("editProductButton").addEventListener("click", function () {
  const currentName = document.getElementById("editProductName").value;
  const currentCategory = document.getElementById("editProductCategory").value;
  const currentDescription = document.getElementById("editProductDescription").value;
  const currentPrice = parseInt(document.getElementById("editProductPrice").value);

  if (!currentName) {
    return showErrorAlert("Product Name is required.");
  }
  if (!currentCategory) {
    return showErrorAlert("Product Category is required.");
  }
  if (!currentDescription) {
    return showErrorAlert("Product Description is required.");
  }
  if (currentPrice < 1) {
    return showErrorAlert("Product Price must be greater than 0");
  }
  if (!currentPrice) {
    return showErrorAlert("Product Price is required.");
  }

  const payload = {};

  const sizeInputs = document.querySelectorAll('input[name="editProductSize[]"]');
  const stockInputs = document.querySelectorAll('input[name="editProductStock[]"]');

  const updatedSizes = Array.from(sizeInputs).map((input, index) => {
    const stockValue = stockInputs[index] ? stockInputs[index].value : "";
    if (!input.value || !stockValue) {
      return null;
    }
    return {
      size: input.value,
      stock: stockInputs[index].value,
      id: originalData.sizes[index] ? originalData.sizes[index]._id : null,
    };
  });

  if (updatedSizes.includes(null)) {
    return showErrorAlert("All Product Sizes and Stocks must be filled.");
  }

  if (updatedSizes) {
    for (const size of updatedSizes) {
      const sizeValue = parseInt(size.size);
      const stockValue = parseInt(size.stock);
      if (isNaN(sizeValue) || sizeValue < 1 || sizeValue > 18) {
        return showErrorAlert("Size must be between 1 and 18");
      }

      if (isNaN(stockValue) || stockValue < 0 || stockValue > 10000) {
        return showErrorAlert("Stock must be between 0 and 10,000");
      }
    }
  }

  const sizeValues = Array.from(sizeInputs).map((input) => input.value.trim());
  const uniqueSizes = new Set(sizeValues);

  if (uniqueSizes.size !== sizeValues.length) {
    return showErrorAlert("Sizes must be unique.");
  }

  if (currentImagesLength + newImages.length - deletedImages.length === 0) {
    return showErrorAlert("Product Image is required");
  }
  if (currentImagesLength + newImages.length - deletedImages.length < 3) {
    console.log(currentImagesLength, newImages.length, deletedImages.length);
    return showErrorAlert("You have to upload atleast 3 images");
  }
  if (currentImagesLength + newImages.length - deletedImages.length > 5) {
    return showErrorAlert("You can upload a maximum of 5 images");
  }

  const sizeChanged =
    JSON.stringify(updatedSizes) !==
    JSON.stringify(
      originalData.sizes.map((size) => ({
        size: size.size,
        stock: size.stock,
        id: size._id,
      }))
    );

  if (sizeChanged) {
    payload.sizes = updatedSizes;
  }

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

  if (newImages.length > 0) {
    payload.newImages = newImages;
  }
  if (deletedImages.length > 0) {
    payload.deletedImages = deletedImages;
  }

  if (deletedSizes.length > 0) {
    payload.deletedSizes = deletedSizes;
  }

  if (Object.keys(payload).length > 0) {
    console.log("Sending data to backend:", payload);
    document.getElementById("eidtProductOverlay").style.display = "block";
    document.getElementById("editProductSpinner").style.display = "block";

    fetch(`/admin/products/edit/${originalData.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        if (data.success) {
          Swal.fire({
            title: "Product Edited!",
            text: data.message,
            icon: "success",
            confirmButtonColor: "#000",
            confirmButtonText: "OK",
          }).then(() => {
            window.location.reload();
          });
        } else {
          Swal.fire({
            title: "Failed!",
            text: data.message,
            icon: "error",
            confirmButtonColor: "#000",
            confirmButtonText: "Close",
          }).then(() => {
            $("#editProductModal").modal("hide");
          });
        }
      })
      .catch((error) => {
        Swal.fire({
          title: "Error!",
          text: +error.message,
          icon: "error",
          confirmButtonColor: "#000",
          confirmButtonText: "Try Again",
        });
        console.error("Error:", error);
      })
      .finally(() => {
        document.getElementById("eidtProductOverlay").style.display = "none";
        document.getElementById("editProductSpinner").style.display = "none";
      });
  } else {
    console.log("No changes detected.");
  }

  newImages = [];
});

function toggleProductStatus(productId, button) {
  const currentStatus = button.innerText === "Unlist";

  Swal.fire({
    title: "Are you sure?",
    text: `You are about to ${currentStatus ? "unlist" : "list"} this category.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#000",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, Proceed !",
    cancelButtonText: "No, Cancel!",
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(`/admin/products/${productId}/${currentStatus ? "unlist" : "list"}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          if (data.success) {
            Swal.fire({
              title: "Status Changed!",
              text: data.message,
              icon: "success",
              confirmButtonColor: "#000",
              confirmButtonText: "OK",
            }).then(() => {
              button.classList.toggle("btn-danger", !currentStatus);
              button.classList.toggle("btn-success", currentStatus);
              button.innerText = currentStatus ? "List" : "Unlist";
            });
          } else {
            Swal.fire({
              title: "Failed!",
              text: data.message,
              icon: "error",
              confirmButtonColor: "#000",
              confirmButtonText: "Close",
            });
          }
        })
        .catch((error) => {
          Swal.fire({
            title: "Error!",
            text: +error.message,
            icon: "error",
            confirmButtonColor: "#d33",
            confirmButtonText: "Try Again",
          });
          console.error("Error:", error);
        });
    }
  });
}

document.querySelector(".add-size-stock").addEventListener("click", function () {
  const container = document.getElementById("sizeStockContainer");
  const newPair = document.createElement("div");
  newPair.className = "row align-items-center size-stock-pair mt-2";
  newPair.innerHTML = `
        <div class="col-md-5">
            <input type="text" class="form-control" name="productSize[]" placeholder="Enter size" onkeypress="return event.charCode >= 48 && event.charCode <= 57"  required>
        </div>
        <div class="col-md-5">
            <input type="text" class="form-control" name="productStock[]" placeholder="Enter stock" min="1" onkeypress="return event.charCode >= 48 && event.charCode <= 57"  required>
        </div>
        <div class="col-md-2">
            <button type="button" class="btn btn-danger remove-size-stock">
                <i class="fas fa-minus"></i>
            </button>
        </div>
    `;
  container.appendChild(newPair);

  newPair.querySelector(".remove-size-stock").addEventListener("click", function () {
    container.removeChild(newPair);
  });
});
