require("dotenv").config();
const Product = require("../model/product");
const Category = require("../model/category");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const multer = require("multer");
const category = require("../model/category");
const { extractPublicId } = require("../utils/cloudinaryUtils");
const { StatusCodes } = require("http-status-codes");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

async function getProducts(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find({}).populate("category").skip(skip).limit(limit);

    const totalProducts = await Product.countDocuments();
    const totalPages = Math.ceil(totalProducts / limit);

    const categories = await Category.find({});
    res.render("admin/products", {
      product: products,
      category: categories,
      currentPage: page,
      totalPages,
      limit,
      activePage: "products",
    });
  } catch (error) {
    console.log(error);
  }
}

const addProduct = async (req, res) => {
  const { productName, productDescription, productCategory, productPrice, productSize, productStock } = req.body;

  if (!req.files || !Array.isArray(req.files)) {
    return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "No images uploaded" });
  }

  const product = await Product.findOne({ name: productName });

  if (product) {
    return res
      .status(StatusCodes.CONFLICT)
      .json({ success: false, message: "Name already exits. please choose different name" });
  }

  const uploadPromises = req.files.map((file) => {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: "product" }, (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result.secure_url);
      });

      streamifier.createReadStream(file.buffer).pipe(stream);
    });
  });

  Promise.all(uploadPromises)
    .then(async (imageUrls) => {
      const sizesWithStocks = productSize.map((size, index) => ({
        size,
        stock: productStock[index],
      }));
      const newProduct = new Product({
        name: productName,
        description: productDescription,
        category: productCategory,
        price: productPrice,
        sizes: sizesWithStocks,
        imageUrls,
      });

      try {
        await newProduct.save();
        return res.status(StatusCodes.CREATED).json({ success: true, message: "Product added succesfully" });
      } catch (dbError) {
        console.error(dbError);
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ success: false, message: "Error saving product to database", dbError });
      }
    })
    .catch((uploadError) => {
      console.error(uploadError);
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: "Error uploading images to Cloudinary", uploadError });
    });
};

async function editProduct(req, res) {
  const { id } = req.params;
  const { name, description, category, price, sizes, newImages, deletedImages, deletedSizes } = req.body;
  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Product not found" });
    }

    const updates = {};

    if (name && name !== product.name) {
      const existingProduct = await Product.findOne({
        name: { $regex: `^${name.trim()}$`, $options: "i" },
        _id: { $ne: id },
      });

      if (existingProduct) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "A product with this name already exists",
        });
      }

      updates.name = name;
    }

    if (category) {
      const productCategory = await Category.findOne({ name: category });
      if (!productCategory) {
        return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Category not found" });
      } else {
        updates.category = productCategory._id;
      }
    }

    if (description && description !== product.description) updates.description = description;
    if (price && price !== product.price) updates.price = price;

    if (sizes) {
      sizes.forEach((size) => {
        if (size.id) {
          const existingSizeIndex = product.sizes.findIndex((s) => s._id.toString() === size.id);
          if (existingSizeIndex !== -1) {
            product.sizes[existingSizeIndex].size = size.size;
            product.sizes[existingSizeIndex].stock = size.stock;
          }
        } else {
          product.sizes.push({ size: size.size, stock: size.stock });
        }
      });
      updates.sizes = product.sizes;
    }

    if (deletedSizes && deletedSizes.length > 0) {
      product.sizes = product.sizes.filter((size) => !deletedSizes.includes(size._id.toString()));
      updates.sizes = product.sizes;
    }

    if (newImages && newImages.length > 0) {
      const uploadPromises = newImages.map((image) => {
        return cloudinary.uploader.upload(image, {
          folder: "products",
        });
      });

      const uploadResponses = await Promise.all(uploadPromises);

      const imageUrls = uploadResponses.map((response) => response.secure_url);

      updates.imageUrls = [...product.imageUrls, ...imageUrls];
    }

    if (deletedImages && deletedImages.length > 0) {
      const deletePromises = deletedImages.map(async (imageUrl) => {
        const publicId = extractPublicId(imageUrl);
        await cloudinary.uploader.destroy(publicId);
      });

      await Promise.all(deletePromises);

      if (updates.imageUrls) {
        updates.imageUrls = updates.imageUrls.filter((url) => !deletedImages.includes(url));
      } else {
        updates.imageUrls = product.imageUrls.filter((url) => !deletedImages.includes(url));
      }
    }

    const result = await Product.findByIdAndUpdate(id, updates, { new: true });

    if (result) {
      res.status(StatusCodes.OK).json({ success: true, message: "Product updated successfully" });
    }
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Error updating product", error });
  }
}

async function changeProductStatus(req, res) {
  const { action, id } = req.params;
  try {
    const newStatus = action === "list";
    const result = await Product.findByIdAndUpdate(id, { status: newStatus });
    if (result)
      res
        .status(StatusCodes.OK)
        .json({ success: true, message: `Product ${action === "list" ? "listed" : "unlisted"} successfully.` });
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Error toggling product status.", error });
  }
}

module.exports = {
  getProducts,
  addProduct,
  editUpload: upload.array("editProductImage[]"),
  addUpload: upload.array("productImage[]"),
  editProduct,
  changeProductStatus,
};
