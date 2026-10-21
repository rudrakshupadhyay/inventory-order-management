import { Router } from "express";
import * as inventoryController from "./inventory.controller.js";
import authenticate from "../../middleware/authenticate.middleware.js";
import authorize from "../../middleware/authorize.middleware.js";
import validate from "../../middleware/validate.middleware.js";
import {
  addInventorySchema,
  adjustInventorySchema,
} from "./inventory.validation.js";

const router = Router();
/*
POST /api/inventory/:productId
*/
router.post(
  "/:productId",
  authenticate,
  authorize(["ADMIN"]),
  validate(addInventorySchema),
  inventoryController.addInventory,
);

/*
GET /api/inventory/:productId
*/
router.get(
  "/:productId",
  authenticate,
  authorize(["ADMIN"]),
  inventoryController.getInventoryByProductId,
);

/*
PATCH /api/inventory/:productId/adjust
*/
router.patch(
  "/:productId/adjust",
  authenticate,
  authorize(["ADMIN"]),
  validate(adjustInventorySchema),
  inventoryController.adjustInventory,
);

/*
GET /api/inventory/low-stock
*/
router.get(
  "/low-stock",
  authenticate,
  authorize(["ADMIN"]),
  inventoryController.getLowStockProducts,
);

export default router;
