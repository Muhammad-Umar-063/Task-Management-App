import jwt from "jsonwebtoken";

import { ACCESS_SECRET } from "../Config/Auth.js";
function AuthenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (!token)
    return res.status(401).json({ message: "Access token not found" });
  try {
    const user = jwt.verify(token, ACCESS_SECRET);
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid access token" });
  }
}

function AuthorizeRole(role) {
  return (req, res, next) => {
    if (req.user.role != role)
      return res.status(403).json({ message: "Forbidden: Insufficient role" });
    next();
  };
}

export { AuthenticateToken, AuthorizeRole };
