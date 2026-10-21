import { Router } from "express";
import * as orderController from "./order.controller.js";
import authenticate from "../../middleware/authenticate.middleware.js";
import validate from "../../middleware/validate.middleware.js";
import * as orderSchema from "./order.validation.js";
import authorize from "../../middleware/authorize.middleware.js";
const router = Router();

/*
POST /api/orders
*/
router.post(
  "/",
  authenticate,
  validate(orderSchema.createOrderSchema),
  orderController.createOrder,
);

/*
GET /api/orders
*/
router.get(
  "/",
  authenticate,
  authorize(["ADMIN"]),
  orderController.getPendingOrders,
);

/*
PATCH /api/orders/:orderId/approve
*/
router.patch(
  "/:orderId/approve",
  authenticate,
  authorize(["ADMIN"]),
  orderController.approveOrder,
);

/*
PATCH /api/orders/:orderId/reject
*/
router.patch(
  "/:orderId/reject",
  authenticate,
  authorize(["ADMIN"]),
  orderController.rejectOrder,
);

/*
PATCH /api/orders/:orderId/cancel
*/
router.patch("/:orderId/cancel", authenticate, orderController.cancelOrder);

export default router;
