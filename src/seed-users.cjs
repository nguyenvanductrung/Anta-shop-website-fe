// seed-users.cjs
// Tạo 100 user qua API /api/user/add
// Chạy: node seed-users.cjs

const axios = require("axios");

// ================== CONFIG ==================
const USER_ADD_ENDPOINT =
  process.env.USER_ADD_ENDPOINT || "http://localhost:8082/api/user/add";

const COUNT = Number(process.env.COUNT || 100);   // số user muốn tạo
const DELAY_MS = Number(process.env.DELAY_MS || 100); // delay giữa các request (ms)

// Nếu API bảo vệ bằng JWT thì set ở đây
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

// ================== HELPERS ==================
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pad(num, size = 3) {
  let s = String(num);
  while (s.length < size) s = "0" + s;
  return s;
}

// Random số điện thoại cho unique
function genPhone(i) {
  // 090 + 7 số
  return "090" + String(1000000 + i).slice(-7);
}

// Tạo payload cho 1 user
function makeUserPayload(i) {
  const idx = pad(i); // 001, 002, ...
  const name = `seeduser_${idx}`;
  const email = `seeduser_${idx}@example.com`;
  const password = "123456"; // BE sẽ encode lại
  const phoneNumber = genPhone(i);

  const payload = {
    name,
    email,
    password,
    role: "USER",
    phoneNumber,
  };

  console.log(`👤 [${i}] payload:`, payload);
  return payload;
}

// ================== CALL API ==================
async function createOne(i) {
  const body = makeUserPayload(i);

  try {
    const headers = {
      "Content-Type": "application/json",
    };
    if (ADMIN_TOKEN) {
      headers["Authorization"] = `Bearer ${ADMIN_TOKEN}`;
    }

    const res = await axios.post(USER_ADD_ENDPOINT, body, {
      headers,
      timeout: 20000,
    });

    console.log(
      `✅ [${i}] OK - userId=${res.data?.id}, name=${res.data?.name}`
    );
    return { ok: true };
  } catch (err) {
    console.error(
      `❌ [${i}] FAIL:`,
      err.response?.status,
      err.response?.data || err.message
    );
    return { ok: false };
  }
}

// ================== MAIN ==================
(async function main() {
  console.log("🚀 START SEED USERS");
  console.log({
    USER_ADD_ENDPOINT,
    COUNT,
    DELAY_MS,
  });

  let ok = 0;
  let fail = 0;

  for (let i = 1; i <= COUNT; i++) {
    const r = await createOne(i);
    if (r.ok) ok++;
    else fail++;

    await sleep(DELAY_MS);
  }

  console.log("🏁 DONE SEED USERS");
  console.log("✅ success =", ok, "❌ fail =", fail);
})();
