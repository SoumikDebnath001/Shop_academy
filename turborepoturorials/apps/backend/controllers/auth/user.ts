import jwt from 'jsonwebtoken';
import { Profile } from 'passport-google-oauth20';
import { User } from '@repo/database';
import { Cart } from '@repo/database';
import { Order } from '@repo/database';
import { Address } from '@repo/database';

const controller: any = {};

/* =========================
   GOOGLE LOGIN (find or create user)
========================= */
controller.googleLogin = async (profile: Profile) => {
    const email = profile.emails?.[0].value?.toLowerCase();
    const picture = profile.photos?.[0].value || '';

    if (!email) return null;

    let user: any = await User.findOne({ $or: [{ googleId: profile.id }, { email }] });

    if (!user) {
        user = await User.create({
            name: profile.displayName || email,
            email,
            googleId: profile.id,
            profileImage: picture,
        });
    } else {
        if (user.isBlocked || (!user.isActive && !user.isDeleted)) return null;

        // Link Google account and restore a previously deleted account on sign in
        user = await User.findByIdAndUpdate(
            user._id,
            { googleId: profile.id, profileImage: picture, isDeleted: false, isActive: true },
            { new: true }
        );
    }

    const token = controller.generateToken(user);
    await User.findByIdAndUpdate(user._id, { token });

    return { user, token };
};

/* =========================
   GENERATE TOKEN
========================= */
controller.generateToken = (user: any) => {
    return jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: "7d",
    });
};

/* =========================
   GET TOKEN DATA (for middleware)
========================= */
controller.getTokenData = async (token: string) => {
    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        const user = await User.findById(decoded.id);
        if (!user || user.isDeleted || user.isBlocked) return null;
        return user;
    } catch (error) {
        return null;
    }
};

/* =========================
   AUTH USER RESPONSE (for frontend)
========================= */
controller.toAuthUser = (user: any) => {
    return {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        picture: user.profileImage || '',
    };
};

/* =========================
   GET PROFILE
========================= */
controller.getProfile = async (req: any, res: any) => {
    try {
        const user = await User.findById(req.user._id).populate("wishlist");
        if (!user) {
            return res.status(200).json({ status: false, message: "User not found" });
        }
        return res.status(200).json({ status: true, data: user });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

/* =========================
   UPDATE PROFILE
========================= */
controller.updateProfile = async (req: any, res: any) => {
    try {
        const { name, phone, gender, dob } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { name, phone, gender, dob },
            { new: true }
        );
        return res.status(200).json({ status: true, message: "Profile updated", data: user });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

/* =========================
   DELETE ACCOUNT
========================= */
controller.deleteAccount = async (req: any, res: any) => {
    try {
        const userId = req.user._id;

        // 1. Soft delete the User
        await User.findByIdAndUpdate(userId, {
            isDeleted: true,
            isActive: false,
            token: null
        });

        // 2. Clear the Cart (Hard delete is fine for cart)
        await Cart.findOneAndDelete({ user: userId });

        // 3. Soft delete Addresses
        await Address.updateMany({ user: userId }, { isDeleted: true });

        // 4. Soft delete Orders (So admin retains records but they are marked)
        await Order.updateMany({ user: userId }, { isDeleted: true });

        // 5. Clear the Google login cookie
        res.clearCookie('token');

        return res.status(200).json({ status: true, message: "Account successfully deleted" });
    } catch (error) {
        console.log("Delete Account Error:", error);
        return res.status(500).json({ status: false, message: error.message });
    }
};

export default controller;
