import express from 'express';
const router = express.Router();

import UserAuthController from '../../controllers/auth/user';
import CartController from '../../controllers/user/cart';
import AddressController from '../../controllers/user/address';
import OrderController from '../../controllers/user/order';
import PaymentController from '../../controllers/user/payment';

/* =========================
   PUBLIC ROUTES (browse)
========================= */
import CategoryController from '../../controllers/admin/category';
import ProductController from '../../controllers/admin/product';


///////////////////////////////////////  AUTH (login is Google only, see routes/auth.ts) ///////////////////////////////////////////////////

router.get('/profile', UserAuthController.getProfile);
router.put('/profile', UserAuthController.updateProfile);
router.delete('/profile', UserAuthController.deleteAccount);


///////////////////////////////////////  BROWSE (public) ///////////////////////////////////////////////////

router.get('/category', CategoryController.getAll);
router.get('/category/:id', CategoryController.getById);
router.get('/product', ProductController.getAll);
router.get('/product/:id', ProductController.getById);


///////////////////////////////////////  CART ///////////////////////////////////////////////////

router.post('/cart', CartController.addToCart);
router.get('/cart', CartController.getCart);
router.put('/cart/:itemId', CartController.updateQuantity);
router.delete('/cart/:itemId', CartController.removeItem);
router.delete('/cart', CartController.clearCart);


///////////////////////////////////////  ADDRESS ///////////////////////////////////////////////////

router.post('/address', AddressController.create);
router.get('/address', AddressController.getAll);
router.get('/address/:id', AddressController.getById);
router.put('/address/:id', AddressController.update);
router.delete('/address/:id', AddressController.delete);
router.put('/address/:id/default', AddressController.setDefault);


///////////////////////////////////////  ORDER ///////////////////////////////////////////////////

router.post('/order', OrderController.placeOrder);
router.get('/order', OrderController.getMyOrders);
router.get('/order/:id', OrderController.getOrderById);
router.put('/order/:id/cancel', OrderController.cancelOrder);


///////////////////////////////////////  PAYMENT ///////////////////////////////////////////////////

router.post('/payment', PaymentController.createPayment);
router.get('/payment', PaymentController.getMyPayments);
router.get('/payment/:id', PaymentController.getPaymentById);


export default router;
