import { Redis } from "@upstash/redis";

const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";

const redis = (redisUrl && redisToken) 
  ? new Redis({ url: redisUrl, token: redisToken }) 
  : null;

export default async function handler(req: any, res: any) {
  try {
    if (req.method === "GET") {
      if (redis) {
        const data = await redis.get("blackhours_prototype_db");
        if (data) {
          return res.status(200).json(data);
        }
      }
      return res.status(200).json({ items: [], sales: [], logs: [], settings: {} });
    }
    
    if (req.method === "POST") {
      const data = req.body;
      if (redis) {
        await redis.set("blackhours_prototype_db", data);
        return res.status(200).json({ success: true });
      }
      return res.status(500).json({ error: "Redis not configured" });
    }
  } catch (error: any) {
    console.error("Vercel Function Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
