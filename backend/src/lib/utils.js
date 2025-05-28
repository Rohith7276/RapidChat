import jwt from "jsonwebtoken";
export const generateToken = (userId, res) =>{
    console.log("Generating token for userId:", userId);
    const token = jwt.sign({userId}, process.env.JWT_SECRET, {
        expiresIn:"7d"
    })
console.log("Generated token:", token);
res.cookie("jwt", token, {
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  secure: process.env.NODE_ENV === "production", // HTTPS only in production
});

    console.log("This is token")
    return token;
}

// so in above code what we basically what we did is generated a token and sent to user in the form of cookie. This cookies lives 7 days and then expires so user have to login again.