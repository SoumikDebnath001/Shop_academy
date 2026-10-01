import AdminController from '../controllers/auth/admin';
import UserController from '../controllers/auth/user';
import { ADMIN_SESSION_COOKIE } from './adminSecurity';

// Routes that do not need login
const parmisoen = [
    {
        url: "/admin/login", // also covers /admin/login/verify-otp, /admin/login/totp-setup, /admin/login/verify-totp
    },
    {
        url: "/admin/register", // checks the setup key or a superadmin session itself
    },
    {
        url: "/admin/logout",
    },
    {
        url: "/user/category",
    },
    {
        url: "/user/product",
    },
];

export const middleware = async (req: any, res: any, next: any) => {
    // match exact path or if path starts with url + '/' (for /category/:id)
    const isPermitted = parmisoen.some(it => req.path === it.url || req.path.startsWith(it.url + '/'));

    if (isPermitted) {
        next();
    } else if (req.path.startsWith('/admin/')) {
        // Admin routes only accept the HttpOnly admin session cookie, which is issued after password + email OTP + Google Authenticator
        const token = req.cookies?.[ADMIN_SESSION_COOKIE];

        if (!token) {
            return res.status(200).json({ error: "No credentials sent!", status: false, credentials: false });
        }

        const adminData: any = await AdminController.getTokenData(token);

        if (adminData) {
            adminData.password = null;
            adminData.token = null;
            req.user = adminData;
            req.userType = "Admin";
            res.set('Cache-Control', 'no-store');
            next();
        } else {
            res.status(200).json({ error: "credentials not match", status: false, credentials: false });
        }
    } else {
        // User (Google login) sends the HttpOnly cookie
        let authorization = req.cookies?.token || req.headers.authorization;

        if (!authorization) {
            return res.status(200).json({ error: "No credentials sent!", status: false, credentials: false });
        }

        let userData: any = null;

        try {
            userData = await UserController.getTokenData(authorization);
        } catch (error) {
            userData = null;
        }

        if (userData && userData != null) {
                userData.password = null;
                userData.token = null;
                req.user = userData;
                req.userType = "User";
                req.token = authorization;
                next();
        } else {
            res.status(200).json({ error: "credentials not match", status: false, credentials: false });
        }
    }
};
