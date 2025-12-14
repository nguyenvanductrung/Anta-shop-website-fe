// seed-products-upload.cjs
// CommonJS seeder: tạo sản phẩm, tải ảnh Unsplash về temp, upload lên cloud, gắn vào product.
// Put this file in your store root (not in src/) and run: node seed-products-upload.cjs

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { faker } = require('@faker-js/faker');

// ---- CONFIG via ENV (or defaults) ----
const PRODUCT_ADD_ENDPOINT = process.env.PRODUCT_ADD_ENDPOINT || 'http://localhost:8080/api/product/add';
const CLOUD_UPLOAD_ENDPOINT = process.env.CLOUD_UPLOAD_ENDPOINT || 'http://localhost:8080/api/cloud/upload-multiple';
const CLOUD_UPDATE_ENDPOINT = process.env.CLOUD_UPDATE_ENDPOINT || 'http://localhost:8080/api/cloud/update-product';
const PRODUCT_SYNC_ENDPOINT = process.env.PRODUCT_SYNC_ENDPOINT || 'http://localhost:8080/api/product/sync-images';
const COUNT = Number(process.env.COUNT || 100);
const DELAY_MS = Number(process.env.DELAY_MS || 150);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || ''; // nếu cần JWT

// ---- helpers ----
function randInt(min, max){ return Math.floor(Math.random()*(max-min+1))+min; }
function alphaNum(len=8){ const s='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; let r=''; for(let i=0;i<len;i++) r+=s.charAt(Math.floor(Math.random()*s.length)); return r; }
function pickColor(){ const C=['Black','White','Red','Blue','Green','Gray','Beige','Navy']; return C[Math.floor(Math.random()*C.length)]; }
function pickBrand(){ try { return faker.company.name().split(' ')[0].toUpperCase(); } catch(e){ return 'ANTA_BRAND'; } }

const CATEGORY_POOL = [
  { key: 'Shoes', keywords: ['sneakers','running shoes','men shoes','women shoes','athletic shoes'] },
  { key: 'Clothing', keywords: ['tshirt','hoodie','jacket','jeans','dress'] },
  { key: 'Accessories', keywords: ['bag','backpack','belt','hat'] }
];

function pickSizeSet(categoryKey){
  if (categoryKey==='Shoes') return ['39','40','41','42','43','44'];
  if (categoryKey==='Clothing') return ['S','M','L','XL'];
  return ['Free'];
}

function makeProduct(i){
  const rnd = Math.random();
  const cat = rnd < 0.6 ? CATEGORY_POOL[0] : (rnd < 0.92 ? CATEGORY_POOL[1] : CATEGORY_POOL[2]);
  const kw = cat.keywords[Math.floor(Math.random()*cat.keywords.length)];
  const baseName = (faker.commerce && typeof faker.commerce.productName === 'function') ? faker.commerce.productName() : `Product`;
  const name = `${kw.split(' ')[0].toUpperCase()} ${baseName} ${i}`;
  const basePrice = Number((faker.commerce && typeof faker.commerce.price === 'function') ? faker.commerce.price(300000,2500000,0) : randInt(300000,2500000));
  const totalStock = randInt(20,300);

  // Unsplash source with &sig for variety
  const images = [
    `https://source.unsplash.com/800x800/?${encodeURIComponent(kw)}&sig=${Math.floor(Math.random()*100000)}`,
    `https://source.unsplash.com/800x800/?${encodeURIComponent(kw)},fashion&sig=${Math.floor(Math.random()*100000)}`
  ];

  const sizes = pickSizeSet(cat.key);
  const variantCount = Math.min(sizes.length, Math.max(1, randInt(1, sizes.length)));
  const shuffled = sizes.slice().sort(() => 0.5 - Math.random());
  const sizesPicked = shuffled.slice(0, variantCount);

  const variants = sizesPicked.map((size, idx) => {
    const adj = Math.round((Math.random()-0.4) * basePrice * 0.03);
    const price = Math.max(10000, basePrice + adj);
    const stock = randInt(5,80);
    return {
      sku: `SEED-${alphaNum(6)}-${i}-${idx+1}`,
      price,
      stock,
      size,
      color: pickColor(),
      attributes: { material: ['leather','mesh','cotton','polyester'][Math.floor(Math.random()*4)] }
    };
  });

  const sales = randInt(0,400);
  const revenue = sales * basePrice;
  const brand = pickBrand();
  const description = (faker.lorem && typeof faker.lorem.sentence === 'function') ? faker.lorem.sentence() : 'Mô tả sản phẩm';

  return { name, brand, description, price: basePrice, category: cat.key, categories:[cat.key], images, thumbnail: images[0], totalStock, variants, sales, revenue };
}

// download external image -> temp file
async function downloadToTemp(url){
  const res = await axios.get(url, { responseType: 'stream', timeout: 20000 });
  const ct = String(res.headers['content-type'] || '');
  const ext = (ct.includes('/') ? ct.split('/').pop().split(';')[0] : 'jpg') || 'jpg';
  const fname = `seed_${Date.now()}_${Math.random().toString(36).slice(2,8)}.${ext}`;
  const tmp = path.join(os.tmpdir(), fname);
  const writer = fs.createWriteStream(tmp);
  await new Promise((resolve,reject)=>{
    res.data.pipe(writer);
    let err=false;
    writer.on('error', e => { err=true; writer.close(); reject(e); });
    writer.on('close', () => { if(!err) resolve(); });
  });
  return { path: tmp, filename: fname };
}

// upload files to cloud service (multipart/form-data)
async function uploadFilesToCloud(files){
  if (!CLOUD_UPLOAD_ENDPOINT) return [];
  const form = new FormData();
  for (const f of files) form.append('files', fs.createReadStream(f.path), { filename: f.filename });
  const headers = form.getHeaders();
  if (ADMIN_TOKEN) headers['Authorization'] = `Bearer ${ADMIN_TOKEN}`;
  const res = await axios.post(CLOUD_UPLOAD_ENDPOINT, form, { headers, timeout: 120000 });
  return res.data;
}

// create product metadata on product service
async function createProduct(payload){
  const headers = { 'Content-Type': 'application/json' };
  if (ADMIN_TOKEN) headers['Authorization'] = `Bearer ${ADMIN_TOKEN}`;
  const res = await axios.post(PRODUCT_ADD_ENDPOINT, payload, { headers, timeout: 20000 });
  return res.data;
}

// attach uploaded ids to product
async function attachImagesToProduct(productId, uploadedFiles){
  const ids = (Array.isArray(uploadedFiles) ? uploadedFiles : []).map(u => u.id || u._id || u.fileId).filter(Boolean);
  if (!ids.length) return { ok:false, reason:'no ids', uploadedFiles };
  const url = `${CLOUD_UPDATE_ENDPOINT.replace(/\/$/,'')}/${productId}`;
  const headers = { 'Content-Type': 'application/json' };
  if (ADMIN_TOKEN) headers['Authorization'] = `Bearer ${ADMIN_TOKEN}`;
  const res = await axios.put(url, ids, { headers, timeout: 20000 });
  // optionally try product sync
  try {
    if (PRODUCT_SYNC_ENDPOINT) {
      const syncUrl = `${PRODUCT_SYNC_ENDPOINT.replace(/\/$/,'')}/${productId}`;
      await axios.put(syncUrl, {}, { headers, timeout: 15000 }).catch(()=>{});
    }
  } catch(e){}
  return { ok:true, data: res.data };
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function createOne(i){
  const p = makeProduct(i);
  console.log(`[create] #${i} -> ${p.name} (${p.category})`);
  try {
    // send product metadata (without external unsplash urls)
    const payload = { ...p, images: undefined, thumbnail: undefined };
    const created = await createProduct(payload);
    const productId = created?.id || created?.data?.id || created?.product?.id || (created && created.id);
    if (!productId) {
      console.warn('[create] no productId returned, body:', created);
      return { ok:false, reason:'no product id', created };
    }

    // download images to temp
    const files = [];
    for (const url of (p.images || [])) {
      try {
        const f = await downloadToTemp(url);
        files.push(f);
      } catch (e) {
        console.warn('[download] failed', url, e.message || e);
      }
    }

    // upload to cloud
    let uploaded = [];
    if (files.length && CLOUD_UPLOAD_ENDPOINT) {
      try { uploaded = await uploadFilesToCloud(files); } catch (e) { console.error('[upload] error', e?.response?.data || e.message || e); }
    }

    // attach to product
    let attachRes = null;
    if (uploaded && uploaded.length && CLOUD_UPDATE_ENDPOINT) {
      try { attachRes = await attachImagesToProduct(productId, uploaded); } catch (e) { console.error('[attach] error', e?.response?.data || e.message || e); }
    }

    // cleanup
    for (const f of files) { try { fs.unlinkSync(f.path); } catch (e) {} }

    return { ok:true, productId, uploadedCount:(uploaded||[]).length, attachRes };
  } catch (err) {
    console.error('[createOne] exception', err?.response?.data || err.message || err);
    return { ok:false, error: err?.response?.data || err.message || String(err) };
  }
}

(async function main(){
  console.log('Seeder start', { PRODUCT_ADD_ENDPOINT, CLOUD_UPLOAD_ENDPOINT, CLOUD_UPDATE_ENDPOINT, PRODUCT_SYNC_ENDPOINT, COUNT, DELAY_MS, usingAdminToken: !!ADMIN_TOKEN });
  const testCount = Math.min(2, COUNT);
  for (let i=1;i<=testCount;i++){
    const r = await createOne(i);
    console.log(`[TEST ${i}] result:`, r.ok ? `OK id=${r.productId} imgs=${r.uploadedCount||0}` : `FAIL ${r.reason||r.error||JSON.stringify(r)}`);
    await sleep(DELAY_MS);
  }
  if (COUNT <= testCount) { console.log('finished (test only)'); return; }
  console.log('Proceeding to bulk create...');
  let ok=0, fail=0;
  for (let i=testCount+1;i<=COUNT;i++){
    const r = await createOne(i);
    if (r.ok) { ok++; if (ok%10===0) console.log(`-> ${ok} created`); }
    else { fail++; console.warn(`#${i} failed`, r); }
    await sleep(DELAY_MS);
  }
  console.log(`Done. created=${ok}, failed=${fail}`);
})();
