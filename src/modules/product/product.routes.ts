import { Router } from "express";
import * as productController from "./product.controller.js";
import authenticate from "../../middleware/authenticate.middleware.js";
import authorize from "../../middleware/authorize.middleware.js";
import validate from "../../middleware/validate.middleware.js";
import {
  createProductSchema,
  updateProductSchema,
} from "./product.validation.js";
const router = Router();

/*
GET /api/products
*/
router.get("/", authenticate, productController.getAllProducts);
/*
GET /api/products/:id
*/
router.get("/:id", authenticate, productController.getProductById);
/*
POST /api/products
*/
router.post(
  "/",
  authenticate,
  authorize(["ADMIN"]),
  validate(createProductSchema),
  productController.createProduct,
);

/*
PUT /api/products/:id
*/
router.put(
  "/:id",
  authenticate,
  authorize(["ADMIN"]),
  validate(updateProductSchema),
  productController.updateProduct,
);

/*
DELETE /api/products/:id
*/
router.delete(
  "/:id",
  authenticate,
  authorize(["ADMIN"]),
  productController.deleteProduct,
);

export default router;
