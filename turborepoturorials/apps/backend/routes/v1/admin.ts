import express from 'express';
const router = express.Router();
import multer from 'multer';
import { rateLimit } from 'express-rate-limit';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Slows down password guessing and code guessing on the admin login steps
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { status: false, message: "Too many login requests. Please try again in 15 minutes." },
});

import AdminAuthController from '../../controllers/auth/admin';
import CategoryController from '../../controllers/admin/category';
import ProductController from '../../controllers/admin/product';
import OrderController from '../../controllers/admin/order';
import DashboardController from '../../controllers/admin/dashboard';


///////////////////////////////////////  AUTH ///////////////////////////////////////////////////

router.post('/register', loginLimiter, AdminAuthController.register);
router.post('/login', loginLimiter, AdminAuthController.login);
router.post('/login/verify-otp', loginLimiter, AdminAuthController.verifyOtp);
router.get('/login/totp-setup', loginLimiter, AdminAuthController.totpSetup);
router.post('/login/verify-totp', loginLimiter, AdminAuthController.verifyTotp);
router.post('/logout', AdminAuthController.logout);
router.get('/me', AdminAuthController.me);
router.get('/profile', AdminAuthController.getProfile);
router.put('/profile', AdminAuthController.updateProfile);


///////////////////////////////////////  DASHBOARD ///////////////////////////////////////////////////

router.get('/dashboard', DashboardController.getStats);


///////////////////////////////////////  CATEGORY ///////////////////////////////////////////////////

router.post('/category', upload.single('image'), CategoryController.create);
router.get('/category', CategoryController.getAll);
router.get('/category/:id', CategoryController.getById);
router.put('/category/:id', upload.single('image'), CategoryController.update);
router.delete('/category/:id', CategoryController.delete);


///////////////////////////////////////  PRODUCT ///////////////////////////////////////////////////

router.post('/product', upload.array('images', 2), ProductController.create);
router.get('/product', ProductController.getAll);
router.get('/product/:id', ProductController.getById);
router.put('/product/:id', upload.array('images', 2), ProductController.update);
router.delete('/product/:id', ProductController.delete);


///////////////////////////////////////  ORDER ///////////////////////////////////////////////////

router.get('/order', OrderController.getAll);
router.get('/order/:id', OrderController.getById);
router.put('/order/:id/status', OrderController.updateStatus);


export default router;
