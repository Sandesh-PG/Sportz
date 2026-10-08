import bcrypt from 'bcrypt';
import { Router } from 'express';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { db } from '../db/db.js';
import crypto from 'crypto';
import { sessions, users } from '../db/schema.js';
import { requireRole } from '../middleware/authorize.js';
import {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
} from '../validation/auth.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = Router();
const REFRESH_TOKEN_BYTES = 32;
const REFRESH_TOKEN_EXPIRES_IN_DAYS = 7;

const REFRESH_TOKEN_COOKIE = 'refreshToken';

const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const SALT_ROUNDS = 12;
const DEFAULT_USER_ROLE = 'USER';
const ACCESS_TOKEN_EXPIRES_IN = '15m';
const AUTHENTICATION_ERROR = 'Invalid email or password';

const toSafeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  is_verified: user.isVerified,
  created_at: user.createdAt,
  updated_at: user.updatedAt,
});

const createAccessToken = (user, secret) =>
  jwt.sign(
    {
      role: user.role,
    },
    secret,
    {
      subject: String(user.id),
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    },
  );

  const createRefreshToken = () =>
  crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex');

const hashRefreshToken = (refreshToken) =>
  crypto.createHash('sha256').update(refreshToken).digest('hex');

const getRefreshTokenExpiry = () => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_IN_DAYS);
  return expiresAt;
};

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues });
  }

  const { name, email, password } = parsed.data;

  try {
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [user] = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash,
        role: DEFAULT_USER_ROLE,
        isVerified: false,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isVerified: users.isVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    return res.status(201).json({ data: toSafeUser(user) });
  } catch (error) {
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    console.error('Error registering user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues });
  }

  const { email, password } = parsed.data;
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error('JWT_SECRET is not set');
    return res.status(500).json({ error: 'JWT_SECRET is not configured' });
  }

  try {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        passwordHash: users.passwordHash,
        role: users.role,
        isVerified: users.isVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: AUTHENTICATION_ERROR });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ error: AUTHENTICATION_ERROR });
    }

    const accessToken = createAccessToken(user, jwtSecret);

    const refreshToken = createRefreshToken();
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const refreshTokenExpiresAt = getRefreshTokenExpiry();

    await db.insert(sessions).values({
      userId: user.id,
      refreshTokenHash,
      expiresAt: refreshTokenExpiresAt,
      userAgent: req.get('user-agent') ?? null,
      ipAddress: req.ip ?? null,
    });

    res.cookie(
      REFRESH_TOKEN_COOKIE,
      refreshToken,
      REFRESH_TOKEN_COOKIE_OPTIONS
    );

    return res.status(200).json({
      data: {
        accessToken,
        user: toSafeUser(user),
      },
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

authRouter.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token is required' });
  }

  try {
    const refreshTokenHash = hashRefreshToken(refreshToken);

    const [session] = await db
      .select({
        id: sessions.id,
        userId: sessions.userId,
        expiresAt: sessions.expiresAt,
        revokedAt: sessions.revokedAt,
      })
      .from(sessions)
      .where(eq(sessions.refreshTokenHash, refreshTokenHash))
      .limit(1);

    if (!session) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    if (session.revokedAt) {
      return res.status(401).json({ error: 'Refresh token has been revoked' });
    }

    if (new Date() >= session.expiresAt) {
      return res.status(401).json({ error: 'Refresh token has expired' });
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error('JWT_SECRET is not set');
      return res.status(500).json({ error: 'JWT_SECRET is not configured' });
    }

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isVerified: users.isVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    // Revoke the old refresh token.
    await db
      .update(sessions)
      .set({
        revokedAt: new Date(),
      })
      .where(eq(sessions.id, session.id));

    // Create a new refresh token and session.
    const newRefreshToken = createRefreshToken();
    const newRefreshTokenHash = hashRefreshToken(newRefreshToken);
    const newRefreshTokenExpiresAt = getRefreshTokenExpiry();
    res.cookie(
      REFRESH_TOKEN_COOKIE,
      newRefreshToken,
      REFRESH_TOKEN_COOKIE_OPTIONS
    );

    await db.insert(sessions).values({
      userId: user.id,
      refreshTokenHash: newRefreshTokenHash,
      expiresAt: newRefreshTokenExpiresAt,
      userAgent: req.get('user-agent') ?? null,
      ipAddress: req.ip ?? null,
    });

    const accessToken = createAccessToken(user, jwtSecret);

    return res.status(200).json({
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

authRouter.post('/logout', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token is required' });
  }

  try {
    const refreshTokenHash = hashRefreshToken(refreshToken);

    const [session] = await db
      .select({
        id: sessions.id,
        revokedAt: sessions.revokedAt,
      })
      .from(sessions)
      .where(eq(sessions.refreshTokenHash, refreshTokenHash))
      .limit(1);

    if (!session) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    if (session.revokedAt) {
      return res.status(401).json({
        error: 'Refresh token has already been revoked',
      });
    }

    await db
      .update(sessions)
      .set({
        revokedAt: new Date(),
      })
      .where(eq(sessions.id, session.id));

    // Clear the refresh-token cookie
    res.clearCookie(
      REFRESH_TOKEN_COOKIE,
      REFRESH_TOKEN_COOKIE_OPTIONS
    );

    return res.status(200).json({
      data: {
        message: 'Logged out successfully',
      },
    });
  } catch (error) {
    console.error('Error logging out:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

authRouter.get('/me', requireAuth, async (req, res) => {
  try {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isVerified: users.isVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    return res.status(200).json({
      data: toSafeUser(user),
    });
  } catch (error) {
    console.error('Error fetching authenticated user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

authRouter.get(
  '/admin-test',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res) => {
    return res.status(200).json({
      data: {
        message: 'Admin access granted',
        user: req.user,
      },
    });
  }
);