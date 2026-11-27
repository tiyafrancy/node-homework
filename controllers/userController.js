const crypto = require("crypto");
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const { userSchema } = require("../validation/userSchema");
const prisma = require("../db/prisma");

const cookieFlags = (req) => {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // only when HTTPS is available
      sameSite: "Strict",
    };
  };

const setJwtCookie = (req, res, user) => {
// Sign JWT
const payload = { id: user.id, csrfToken: randomUUID() };
const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }); // 1 hour expiration
// Set cookie.  Note that the cookie flags have to be different in production and in test.
res.cookie("jwt", token, { ...cookieFlags(req), maxAge: 3600000 }); // 1 hour expiration
return payload.csrfToken; // this is needed in the body returned by logon() or register()
};

async function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const derivedKey = await scrypt(password, salt, 64);
    return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
    const [salt, key] = storedHash.split(":");
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = await scrypt(inputPassword, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

const register = async (req, res, next) => {
    if (!req.body) req.body = {};

    const { error, value } = userSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({ message: error.message });
    }

    const { name, email, password } = value;

    try {
        const hashedPassword = await hashPassword(password);

        const result = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: { name, email, hashedPassword },
                select: { id: true, email: true, name: true, createdAt: true }
            });

            const welcomeTaskData = [
                { title: "Complete your profile", userId: newUser.id, priority: "medium" },
                { title: "Add your first task", userId: newUser.id, priority: "high" },
                { title: "Explore the app", userId: newUser.id, priority: "low" }
            ];

            await tx.task.createMany({ data: welcomeTaskData });

            const welcomeTasks = await tx.task.findMany({
                where: {
                    userId: newUser.id,
                    title: { in: welcomeTaskData.map(t => t.title) }
                },
                select: {
                    id: true,
                    title: true,
                    isCompleted: true,
                    userId: true,
                    priority: true
                }
            });

            return { user: newUser, welcomeTasks };
        });

        // global.user_id = result.user.id;

        const csrfToken = setJwtCookie(req, res, result.user);
    
        return res.status(201).json({
            name: result.user.name,
            email: result.user.email,
            csrfToken,
            user: result.user,
            welcomeTasks: result.welcomeTasks,
            transactionStatus: "success"
        });

    } catch (err) {
        if (err.code === "P2002") {
            return res.status(400).json({ error: "Email already registered" });
        } else {
            return next(err);
        }
    }
};

const logon = async (req, res, next) => {
    if (!req.body) req.body = {};
    let { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    try {
        email = email.toLowerCase();
        const user = await prisma.user.findUnique({
            where: { email },
        });
        
        // const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

        if (!user) {
            return res.status(401).json({ message: "Authentication failed." });
        }

        // const user = result.rows[0];

        const goodCredentials = await comparePassword(password, user.hashedPassword);
        if (goodCredentials) {
            // global.user_id = user.id;
            const csrfToken = setJwtCookie(req, res, user);
            return res.status(200).json({
                message: "Logged on successfully",
                name: user.name,
                email: user.email,
                csrfToken,
            });
        }

        return res.status(401).json({ message: "Authentication failed." });
    } catch (err) {
        return next(err);
    }
};

const logoff = (req, res) => {
    // global.user_id = null;
    res.clearCookie("jwt", cookieFlags(req));
    res.status(200).send();
};

module.exports = {
    register,
    logon,
    logoff,
};

