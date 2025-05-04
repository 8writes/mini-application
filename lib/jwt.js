import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

// function to create JWT
export function signJWT(payload, expiresIn = "7d") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

// function to verify the JWT
export function verifyJWT(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}
