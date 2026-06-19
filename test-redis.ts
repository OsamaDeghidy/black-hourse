import { Redis } from "@upstash/redis";
import dotenv from "dotenv";

dotenv.config();

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

async function test() {
  try {
    const data = await redis.get("blackhours_prototype_db");
    console.log("Redis data exists?", !!data);
    if (data) {
      console.log("Items count:", (data as any).items?.length);
      console.log("Sales count:", (data as any).sales?.length);
    }
  } catch (err) {
    console.error("Redis Error:", err);
  }
}
test();
