// seed-orders.cjs
// Seeder tạo dữ liệu đơn hàng qua order-service
// Chạy: node seed-orders.cjs

const axios = require('axios');

// ================== CONFIG ==================

// Base URL của order-service (trực tiếp, không qua gateway)
const ORDER_BASE =
  process.env.ORDER_BASE || 'http://localhost:8084/order_db/api/orders';

// số đơn muốn tạo
const COUNT = Number(process.env.COUNT || 100);

// delay giữa các lần tạo (ms)
const DELAY_MS = Number(process.env.DELAY_MS || 100);

// userId random trong khoảng này
const MIN_USER_ID = Number(process.env.MIN_USER_ID || 1);
const MAX_USER_ID = Number(process.env.MAX_USER_ID || 10);

// productId / variantId random trong khoảng này
const MIN_PRODUCT_ID = Number(process.env.MIN_PRODUCT_ID || 1);
const MAX_PRODUCT_ID = Number(process.env.MAX_PRODUCT_ID || 20);
const MIN_VARIANT_ID = Number(process.env.MIN_VARIANT_ID || 1);
const MAX_VARIANT_ID = Number(process.env.MAX_VARIANT_ID || 50);

// Nếu API cần token (admin) thì set vào đây, không thì để rỗng
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

// ================== HELPERS ==================

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ⚠️ Build đúng CreateOrderRequest
//   - userId: Long
//   - items: List<OrderItemRequest>
//   - shippingAddress: String
//   - paymentMethod: String
function buildOrderPayload() {
  const userId = randInt(MIN_USER_ID, MAX_USER_ID);

  const itemsCount = randInt(1, 3);
  const items = [];

  for (let i = 0; i < itemsCount; i++) {
    const productId = randInt(MIN_PRODUCT_ID, MAX_PRODUCT_ID);
    const variantId = randInt(MIN_VARIANT_ID, MAX_VARIANT_ID);
    const quantity = randInt(1, 5);

    // đơn giá tầm 300k – 1.3M
    const basePrice = 300_000;
    const step = 200_000;
    const unitPrice = basePrice + randInt(0, 5) * step;

    // === OrderItemRequest tương ứng bên BE ===
    items.push({
      productId,
      variantId,
      quantity,
      unitPrice, // BE map sang BigDecimal được
    });
  }

  const body = {
    userId,
    items,
    shippingAddress: `Số ${randInt(1, 200)} Đường Fake, Quận ${randInt(
      1,
      12
    )}, TP.HCM`,
    paymentMethod: Math.random() < 0.5 ? 'MOMO' : 'COD',
  };

  return body;
}

// ================== MAIN LOGIC ==================

async function createOne(index) {
  const payload = buildOrderPayload();

  console.log(`[#${index}] 🧾 Tạo đơn:`, JSON.stringify(payload));

  const headers = { 'Content-Type': 'application/json' };
  if (ADMIN_TOKEN) {
    headers['Authorization'] = `Bearer ${ADMIN_TOKEN}`;
  }

  try {
    // 1. Gọi tạo đơn: POST /api/orders/create
    const createRes = await axios.post(`${ORDER_BASE}/create`, payload, {
      headers,
      timeout: 20000,
    });

    const order = createRes.data;
    const orderId = order?.id;

    console.log(
      `   ✅ Tạo thành công orderId=${orderId}, totalAmount=${order.totalAmount}`
    );

    if (!orderId) {
      console.warn('   ⚠️ Không lấy được orderId từ response, bỏ qua update status');
      return { ok: true };
    }

    // 2. Random status "PAID" hoặc "DELIVERED"
    // để query doanh thu weekly của bạn bắt được
    const status = Math.random() < 0.6 ? 'PAID' : 'DELIVERED';

    try {
      await axios.post(
        `${ORDER_BASE}/${orderId}/payment-status/${status}`,
        null,
        { headers, timeout: 15000 }
      );

      console.log(`   💳 Cập nhật trạng thái -> ${status} OK`);
    } catch (err) {
      console.error(
        `   ❌ Lỗi cập nhật status ${status}:`,
        err.response?.data || err.message
      );
    }

    return { ok: true };
  } catch (err) {
    console.error(
      `   ❌ Tạo đơn thất bại:`,
      err.response?.data || err.message || String(err)
    );
    return { ok: false };
  }
}

(async function main() {
  console.log('🚀 BẮT ĐẦU SEED ĐƠN HÀNG');
  console.log({
    ORDER_BASE,
    COUNT,
    DELAY_MS,
    MIN_USER_ID,
    MAX_USER_ID,
    MIN_PRODUCT_ID,
    MAX_PRODUCT_ID,
    MIN_VARIANT_ID,
    MAX_VARIANT_ID,
    usingAdminToken: !!ADMIN_TOKEN,
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
  console.log(`🏁 DONE SEED ORDERS — OK: ${ok}, FAIL: ${fail}`);
  console.log('===============================');
})();
