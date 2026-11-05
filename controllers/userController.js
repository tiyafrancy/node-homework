const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const { userSchema } = require("../validation/userSchema");
const pool = require("../db/pg-pool");

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

const register = async (req, res) => {
    if (!req.body) req.body = {};

    const { error, value } = userSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({ message: error.message });
    }

    const { name, email, password } = value;

    try {
            const hashedPassword = await hashPassword(password);

            const result = await pool.query(`INSERT INTO users (name, email, hashed_password) VALUES ($1, $2, $3) RETURNING id, name, email`,
            [name, email, hashedPassword]
            );

            // const newUser = { name, email, hashedPassword };
            const newUser = result.rows[0];
            // global.users.push(newUser);
            global.user_id = newUser.id;

            res.status(201).json({
                name: newUser.name,
                email: newUser.email,
            });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ message: "User already exists." });
        }
        return next(err);
    }
};

const logon = async (req, res) => {
    if (!req.body) req.body = {};
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    try {
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ message: "Authentication failed." });
        }

        const user = result.rows[0];

        const goodCredentials = await comparePassword(password, user.hashed_password);
        if (goodCredentials) {
            global.user_id = user.id; // Store the user's primary key ID for foreign key queries
            return res.status(200).json({
                message: "Logged on successfully",
                name: user.name,
                email: user.email,
            });
        }

        return res.status(401).json({ message: "Authentication failed." });
    } catch (err) {
        return next(err);
    }
};

const logoff = (req, res) => {
    global.user_id = null;
    res.status(200).send();
};

module.exports = {
    register,
    logon,
    logoff,
};

