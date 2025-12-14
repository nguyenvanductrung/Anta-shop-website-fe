// // seed-cart-items.cjs
// // Seeder tạo dữ liệu giỏ hàng: gọi /api/cart/add nhiều lần
// // Chạy: node seed-cart-items.cjs

// const axios = require("axios");

// // ================= CONFIG qua ENV =================
// const CART_ADD_ENDPOINT =
//   process.env.CART_ADD_ENDPOINT || "http://localhost:8080/api/cart/add";

// // Số bản ghi muốn tạo
// const COUNT = Number(process.env.COUNT || 100);
// // Delay giữa mỗi request (ms)
// const DELAY_MS = Number(process.env.DELAY_MS || 100);

// // userId ngẫu nhiên trong khoảng [MIN_USER_ID, MAX_USER_ID]
// const MIN_USER_ID = Number(process.env.MIN_USER_ID || 1);
// const MAX_USER_ID = Number(process.env.MAX_USER_ID || 20);

// // Nếu set USER_ID thì tất cả record sẽ dùng 1 user cố định
// const FIXED_USER_ID = process.env.USER_ID
//   ? Number(process.env.USER_ID)
//   : null;

// // Chỉ tạo giỏ guest (sessionId), không dùng userId
// const USE_SESSION_ONLY =
//   String(process.env.USE_SESSION_ONLY || "false") === "true";

// // Xác suất tạo guest (session) khi không bật USE_SESSION_ONLY
// // VD: 0.3 = 30% là guest, 70% là user
// const PROB_GUEST = Number(process.env.PROB_GUEST || 0.3);

// // productId, variantId random trong khoảng này (tùy DB của bạn)
// const MIN_PRODUCT_ID = Number(process.env.MIN_PRODUCT_ID || 1);
// const MAX_PRODUCT_ID = Number(process.env.MAX_PRODUCT_ID || 200);
// const MIN_VARIANT_ID = Number(process.env.MIN_VARIANT_ID || 1);
// const MAX_VARIANT_ID = Number(process.env.MAX_VARIANT_ID || 10);

// // Nếu API cần JWT admin thì set ở đây
// const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

// // ================= Helpers =================
// function randInt(min, max) {
//   return Math.floor(Math.random() * (max - min + 1)) + min;
// }

// function randSessionId() {
//   return (
//     "sess_" +
//     Math.random().toString(36).slice(2, 8) +
//     "_" +
//     Date.now().toString(36)
//   );
// }

// function sleep(ms) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

// // ================= Logic tạo 1 record =================
// async function createOne(i) {
//   // quyết định là guest hay user
//   const isGuest = USE_SESSION_ONLY || (!FIXED_USER_ID && Math.random() < PROB_GUEST);

//   const userId = isGuest
//     ? null
//     : FIXED_USER_ID || randInt(MIN_USER_ID, MAX_USER_ID);

//   const sessionId = isGuest ? randSessionId() : null;

//   const productId = randInt(MIN_PRODUCT_ID, MAX_PRODUCT_ID);
//   const variantId =
//     Math.random() < 0.7 ? randInt(MIN_VARIANT_ID, MAX_VARIANT_ID) : null;
//   const quantity = randInt(1, 5);

//   const body = {
//     userId,
//     sessionId,
//     productId,
//     variantId,
//     quantity,
//   };

//   console.log(
//     `[${i}] POST ${CART_ADD_ENDPOINT} ->`,
//     JSON.stringify(body)
//   );

//   try {
//     const headers = { "Content-Type": "application/json" };
//     if (ADMIN_TOKEN) headers["Authorization"] = `Bearer ${ADMIN_TOKEN}`;

//     const res = await axios.post(CART_ADD_ENDPOINT, body, {
//       headers,
//       timeout: 20000,
//     });

//     console.log(
//       `   -> OK cartId=${res.data?.id} items=${res.data?.items?.length || 0}`
//     );
//     return { ok: true };
//   } catch (err) {
//     console.error(
//       "   -> FAIL:",
//       err?.response?.status,
//       err?.response?.data || err.message
//     );
//     return { ok: false, error: err?.message || String(err) };
//   }
// }

// // ================= Main =================
// (async function main() {
//   console.log("=== CART SEEDER START ===");
//   console.log({
//     CART_ADD_ENDPOINT,
//     COUNT,
//     DELAY_MS,
//     MIN_USER_ID,
//     MAX_USER_ID,
//     USE_SESSION_ONLY,
//     PROB_GUEST,
//     MIN_PRODUCT_ID,
//     MAX_PRODUCT_ID,
//     MIN_VARIANT_ID,
//     MAX_VARIANT_ID,
//     usingAdminToken: !!ADMIN_TOKEN,
//   });

//   let ok = 0,
//     fail = 0;

//   for (let i = 1; i <= COUNT; i++) {
//     const r = await createOne(i);
//     if (r.ok) ok++;
//     else fail++;
//     await sleep(DELAY_MS);
//   }

//   console.log("=== DONE SEED CART ===");
//   console.log("created ok =", ok, "failed =", fail);
// })();


// seed-cart-items.cjs
// Tạo nhiều bản ghi cart_items cho 1 sessionId (guest cart)

const axios = require('axios');

// ================== CONFIG ==================
const CART_ADD_ENDPOINT =
  process.env.CART_ADD_ENDPOINT || 'http://localhost:8080/api/cart/add';

// số lần gọi API (mỗi lần add 1 item)
const COUNT = Number(process.env.COUNT || 100);

// delay giữa các lần gọi (ms) để đỡ spam server
const DELAY_MS = Number(process.env.DELAY_MS || 100);

// range productId (tùy DB của bạn đang có từ bao nhiêu đến bao nhiêu)
const MIN_PRODUCT_ID = Number(process.env.MIN_PRODUCT_ID || 1);
const MAX_PRODUCT_ID = Number(process.env.MAX_PRODUCT_ID || 50);

// sessionId cố định (theo yêu cầu của bạn)
const FIXED_SESSION_ID =
  process.env.SESSION_ID || 'sid_1764951536690_5imsynslfe';

// nếu BE cần token admin (không cần thì để rỗng)
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

// ================== HELPERS ==================
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// tạo payload cho 1 item
function makeCartItemPayload(i) {
  const productId = randInt(MIN_PRODUCT_ID, MAX_PRODUCT_ID);
  const quantity = randInt(1, 5);

  const payload = {
    userId: null,                      // guest -> null
    sessionId: FIXED_SESSION_ID,       // toàn bộ dùng chung session này
    productId: productId,
    variantId: null,                   // nếu không dùng variant thì để null
    quantity: quantity,
  };

  console.log(`🧺 [${i}] payload:`, payload);
  return payload;
}

// gọi API /api/cart/add
async function createOne(i) {
  const payload = makeCartItemPayload(i);

  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (ADMIN_TOKEN) {
      headers['Authorization'] = `Bearer ${ADMIN_TOKEN}`;
    }

    const res = await axios.post(CART_ADD_ENDPOINT, payload, { headers });

    console.log(
      `✅ [${i}] OK - cartId=${res.data?.id}, items=${res.data?.items?.length ?? 'n/a'}`
    );
    return { ok: true, data: res.data };
  } catch (err) {
    console.error(
      `❌ [${i}] FAIL:`,
      err.response?.data || err.message || String(err)
    );
    return { ok: false, error: err.response?.data || err.message || String(err) };
  }
}

// ================== MAIN ==================
(async function main() {
  console.log('🚀 Start seeding cart items...');
  console.log({
    CART_ADD_ENDPOINT,
    COUNT,
    DELAY_MS,
    MIN_PRODUCT_ID,
    MAX_PRODUCT_ID,
    FIXED_SESSION_ID,
  });

  let ok = 0;
  let fail = 0;

  for (let i = 1; i <= COUNT; i++) {
    const result = await createOne(i);
    if (result.ok) ok++;
    else fail++;

    await sleep(DELAY_MS);
  }

  console.log('===============================');
  console.log(`🏁 Done. Success: ${ok}, Failed: ${fail}`);
  console.log('===============================');
})();
