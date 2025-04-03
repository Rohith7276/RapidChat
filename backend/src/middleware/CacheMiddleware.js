 import client from "../lib/redisClient.js";

export const CacheMiddleware = async (req, res, next) => {
    const key = 'messages' + req.user._id + req.params.id;
    const cachedData = await client.get(key);
  
    if (cachedData) {
        console.log("Cache hit");
        return res.json(JSON.parse(cachedData));
    }
    console.log("Cache not hit");
  
    next();
  };