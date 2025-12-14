// đảm bảo gọi đúng endpoint và trả về đúng dạng
// import { api } from "./client";
import { api } from "./api";

export async function listCategories({ page = 0, size = 50, title, q } = {}) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("size", size);
  if (title) params.set("title", title);
  if (q) params.set("q", q);
  const res = await api.get(`/api/categories?${params.toString()}`);
  return res.data; // Spring Page<CategoryResponse>
}

export async function getGroupedCategories() {
  // -> { men: CategoryResponse[], women: [], accessories: [], kids: [] }
  const res = await api.get("/api/categories/grouped");
  return res.data;
}

export async function createCategory(payload) {
  // payload: { name, slug, title, description }
  const res = await api.post("/api/categories", payload);
  return res.data; // CategoryResponse
}