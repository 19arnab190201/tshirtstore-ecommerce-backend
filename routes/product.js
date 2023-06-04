const express = require("express");
const router = express.Router();

const {
  addProduct,
  getAllProduct,
  adminGetAllProduct,
  getSingleProduct,
  adminUpdateOneProduct,
  adminDeleteOneProduct,

  addReview,
  getOnlyReviewsForOneProduct,
  deleteReview,
} = require("../controllers/productController");
const { isLoggedIn, customRole } = require("../middlewares/user");

//user routes
router.route("/products").get(getAllProduct);
router
  .route("/product/:id")
  .get(isLoggedIn, customRole("admin"), getSingleProduct);

router.route("/review").put(isLoggedIn, addReview);
router.route("/review").delete(isLoggedIn, deleteReview);
router.route("/review/:id").get(getOnlyReviewsForOneProduct);

//admin routes
router
  .route("/admin/product/add")
  .post(isLoggedIn, customRole("admin"), addProduct);

router
  .route("/admin/products")
  .get(isLoggedIn, customRole("admin"), adminGetAllProduct);

router
  .route("/admin/product/:id")
  .put(isLoggedIn, customRole("admin"), adminUpdateOneProduct)
  .delete(isLoggedIn, customRole("admin"), adminDeleteOneProduct);

module.exports = router;
