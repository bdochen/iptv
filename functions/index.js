const SOURCE_URL = "http://47.110.243.216:51234/";
const CACHE_TTL = 3600; // 1小时缓存

export async function onRequest({ request, waitUntil }) {
  const cache = caches.default;

  // 1. 先读缓存
  let res = await cache.match(request);
  if (res) return res;

  try {
    // 2. 模拟真实浏览器请求（关键防1003）
    const upstream = await fetch(SOURCE_URL, {
      signal: AbortSignal.timeout(8000), // 8秒超时，避免卡死
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36",
        "Accept": "text/plain,text/html,*/*",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Referer": SOURCE_URL,
        "Host": "47.110.243.216:51234",
        "Connection": "keep-alive"
      }
    });

    if (!upstream.ok) throw new Error("源站返回非200");

    // 3. 按你要的响应头返回
    const response = new Response(upstream.body, {
      headers: {
        "Content-Type": "text/plain;charset=UTF-8",
        "Cache-Control": `max-age=${CACHE_TTL}`,
        "Access-Control-Allow-Origin": "*",
        "Connection": "keep-alive",
        "Keep-Alive": "timeout=5"
      }
    });

    // 4. 写入缓存
    waitUntil(cache.put(request, response.clone()));
    return response;

  } catch (err) {
    return new Response("Error: " + err.message, { status: 503 });
  }
}
