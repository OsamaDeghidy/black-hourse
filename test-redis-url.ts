import { Redis } from "@upstash/redis";
const redis = new Redis({
  url: "https://guided-seasnail-151452.upstash.io\\",
  token: "gQAAAAAAAk-cAAIgcDJiMTlkYzFkMmNiMTM0ZTkxYmQzNDE3Mzk4ZDhmNTI3OQ",
});
async function test() {
  try {
    const data = await redis.get("blackhours_prototype_db");
    console.log("Redis data exists?", !!data);
  } catch (err) {
    console.error("Redis Error:", err);
  }
}
test();
