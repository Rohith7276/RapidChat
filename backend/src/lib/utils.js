import jwt from "jsonwebtoken";
export const generateToken = (userId, res) =>{
    const token = jwt.sign({userId}, process.env.JWT_SECRET, {
        expiresIn:"7d"
    })

    res.cookie("jwt", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000, // MilliSeconds
        httpOnly: true, // present XSS attecks cross-site scripting attacks
        sameSite: "strict", // CSRF attacks cross-site request forgery attacks
        secure: process.env.NODE_ENV !== "development" // https or http
    })

    return token;
}

// so in above code what we basically what we did is generated a token and sent to user in the form of cookie. This cookies lives 7 days and then expires so user have to login again.