# Hướng Dẫn Sử Dụng Account Page

## Đăng Nhập Test Account

Account Page đã được hoàn thiện với dữ liệu hardcode + localStorage để test. Sử dụng tài khoản sau để đăng nhập:

### Tài Khoản User (Người Dùng)

- **Username**: `user`
- **Password**: `123456`

### Tài Khoản Admin (Quản Trị Viên)

- **Username**: `admin`
- **Password**: `abc123!@#`

## Đặc Điểm Kỹ Thuật

### Lưu Trữ Dữ Liệu

- **localStorage**: Tất cả dữ liệu user được lưu trong localStorage và persistent qua các session
- **Hardcoded Defaults**: Dữ liệu mặc định được khởi tạo lần đầu tiên khi load
- **Auto-Initialize**: Dữ liệu tự động được khởi tạo nếu chưa tồn tại trong localStorage

### Storage Keys

- `anta_user_profile`: Thông tin cá nhân
- `anta_user_orders`: Danh sách đơn hàng
- `anta_user_wishlist`: Sản phẩm yêu thích
- `anta_user_addresses`: Sổ địa chỉ

## Các Tính Năng Đã Hoàn Thiện

### 1. **Tổng Quan (Overview)**

- Hiển thị thông tin user đã đăng nhập
- Thống kê số lượng đơn hàng, sản phẩm yêu thích
- Danh sách đơn hàng gần đây (2 đơn mới nhất)
- Click vào stat box để chuyển tab tương ứng

### 2. **Đơn Hàng (Orders)**

- Xem danh sách tất cả đơn hàng
- Lọc đơn hàng theo trạng thái:
  - Tất cả
  - Chờ xử lý (Processing)
  - Đang giao (Shipping)
  - Đã giao (Delivered)
  - Đã hủy (Cancelled)
- Hiển thị chi tiết từng đơn hàng với:
  - Mã đơn hàng
  - Ngày đặt
  - Trạng thái (với màu sắc phân biệt)
  - Tổng tiền
  - Hình ảnh sản phẩm
- Các action buttons theo trạng thái:
  - Xem chi tiết
  - Mua lại (cho đơn đã giao)
  - Đánh giá (cho đơn đã giao)
  - Theo dõi đơn hàng (cho đơn đang giao)

**Mock Data**: 4 đơn hàng mẫu với các trạng thái khác nhau

### 3. **Sản Phẩm Yêu Thích (Wishlist)**

- Danh sách sản phẩm đã lưu yêu thích
- Hiển thị giá gốc và giá khuyến mãi
- Thông báo trạng thái hết hàng
- Xóa sản phẩm khỏi danh sách yêu thích (lưu vào localStorage)
- Nút "Thêm vào giỏ hàng" hoặc "Thông báo khi có hàng"
- Grid layout responsive (3 cột desktop, 2 cột tablet, 1 cột mobile)

**Mock Data**: 3 sản phẩm mẫu (1 hết hàng, 2 còn hàng)

### 4. **Thông Tin Tài Khoản (Profile)**

- **Thông tin cá nhân:**
  - Họ và tên \*
  - Email \*
  - Số điện thoại
  - Ngày sinh
  - Giới tính (Nam/Nữ/Khác)
- Cập nhật thông tin với validation
- Dữ liệu được lưu vào localStorage
- Nút "Cập nhật" và "Hủy"

- **Đổi mật khẩu:**
  - Mật khẩu hiện tại \*
  - Mật khẩu mới \*
  - Xác nhận mật khẩu mới \*
  - Validation:
    - Độ dài mật khẩu (tối thiểu 6 ký tự)
    - Kiểm tra mật khẩu mới khớp nhau
    - Verify mật khẩu hiện tại

**Mock Data**:

- Thông tin user mặc định được load từ localStorage
- Mật khẩu test mặc định: `password123`

### 5. **Sổ Địa Chỉ (Addresses)**

- Xem danh sách địa chỉ giao hàng
- Thêm địa chỉ mới
- Chỉnh sửa địa chỉ
- Xóa địa chỉ (có confirm dialog)
- Đặt địa chỉ mặc định
- Hiển thị badge "Mặc định" cho địa chỉ default
- Modal form với các trường:
  - Họ tên người nhận \*
  - Số điện thoại \*
  - Địa chỉ chi tiết \* (textarea)
  - Checkbox đặt làm mặc định
- Tất cả thay đổi được lưu vào localStorage

**Mock Data**: 2 địa chỉ mẫu (1 mặc định, 1 phụ)

## Dữ Liệu Mock Hiện Có

### Thông Tin User Mặc Định

```javascript
{
  fullName: 'Nguyễn Văn A',
  email: 'user@anta.com',
  phone: '0123456789',
  birthday: '1990-01-01',
  gender: 'male'
}
```

### Đơn Hàng (4 đơn)

1. **ORD001** - Đã giao - 2,990,000₫ - 2 sản phẩm
2. **ORD002** - Đang giao - 1,790,000₫ - 1 sản phẩm
3. **ORD003** - Đang xử lý - 1,049,000₫ - 2 sản phẩm
4. **ORD004** - Đã hủy - 890,000₫ - 1 sản phẩm

### Sản Phẩm Yêu Thích (3 sản phẩm)

1. **Giày ANTA KT8 - Trắng** (Còn hàng) - 3,290,000₫ (~3,990,000₫)
2. **Áo khoác ANTA Wind Breaker** (Còn hàng) - 1,290,000₫ (~1,590,000₫)
3. **Giày ANTA Running Flash** (Hết hàng) - 1,990,000₫

### Địa Chỉ (2 địa chỉ)

1. **123 Đường Láng, Đống Đa, Hà Nội** (Mặc định)
   - Người nhận: Nguyễn Văn A
   - SĐT: 0123456789
2. **456 Trần Duy Hưng, Cầu Giấy, Hà Nội**
   - Người nhận: Nguyễn Văn A
   - SĐT: 0987654321

## Kiểm Tra Chức Năng

### Test Flow Hoàn Chỉnh:

#### 1. **Đăng nhập**

```
1. Truy cập /login
2. Nhập username: user
3. Nhập password: 123456
4. Click "Đăng Nhập"
5. Redirect tới /account (tab Overview)
```

#### 2. **Tổng quan (Overview)**

```
- Xem thông tin user: "Xin chào, user!"
- Xem thống kê:
  * 4 Đơn hàng
  * 3 Yêu thích
  * 0 Điểm thưởng
- Xem 2 đơn hàng gần đây
- Click vào số liệu để chuyển tab
- Click "Xem tất cả →" để xem toàn bộ đơn hàng
```

#### 3. **Đơn hàng (Orders)**

```
- Xem danh sách 4 đơn hàng
- Test filter tabs:
  * Tất cả: 4 đơn
  * Chờ xử lý: 1 đơn (ORD003)
  * Đang giao: 1 đơn (ORD002)
  * Đã giao: 1 đơn (ORD001)
  * Đã hủy: 1 đơn (ORD004)
- Kiểm tra hiển thị đầy đủ:
  * Mã đơn hàng
  * Ngày đặt
  * Status badge với màu sắc
  * Hình ảnh sản phẩm
  * Tổng tiền
- Kiểm tra action buttons xuất hiện đúng
```

#### 4. **Wishlist (Yêu thích)**

```
- Xem danh sách 3 sản phẩm
- Test xóa sản phẩm:
  1. Click nút × trên card
  2. Sản phẩm biến mất
  3. Reload trang → vẫn bị xóa (localStorage)
- Kiểm tra sản phẩm hết hàng:
  * Overlay "HẾT HÀNG"
  * Nút "Thông báo khi có hàng"
- Kiểm tra sản phẩm còn hàng:
  * Nút "Thêm vào giỏ hàng"
  * Hiển thị giá gốc và giá KM
```

#### 5. **Profile (Thông tin tài khoản)**

```
- Test cập nhật thông tin:
  1. Sửa "Họ và tên" → Nhập tên mới
  2. Sửa "Số điện thoại" → 0999888777
  3. Chọn "Ngày sinh" → 1995-05-15
  4. Chọn "Giới tính" → Nữ
  5. Click "Cập nhật thông tin"
  6. Alert "Cập nhật thông tin thành công!"
  7. Reload trang → dữ liệu vẫn còn

- Test đổi mật khẩu:
  1. Nhập "Mật khẩu hiện tại": password123
  2. Nhập "Mật khẩu mới": newpass123
  3. Nhập "Xác nhận mật khẩu": newpass123
  4. Click "Cập nhật mật khẩu"
  5. Alert "Cập nhật mật khẩu thành công!"

- Test validation:
  * Nhập mật khẩu hiện tại sai → Error
  * Mật khẩu mới < 6 ký tự → Error
  * Xác nhận không khớp → Error
```

#### 6. **Addresses (Sổ địa chỉ)**

```
- Xem danh sách 2 địa chỉ
- Test thêm địa chỉ mới:
  1. Click "+ Thêm địa chỉ mới"
  2. Nhập thông tin:
     - Họ tên: Nguyễn Văn B
     - SĐT: 0911222333
     - Địa chỉ: 789 Nguyễn Trãi, Thanh Xuân, Hà Nội
     - ☑ Đặt làm m��c định
  3. Click "Lưu địa chỉ"
  4. Modal đóng, địa chỉ xuất hiện
  5. Badge "MẶC ĐỊNH" chuyển sang địa chỉ mới
  6. Reload trang → địa chỉ vẫn còn

- Test chỉnh sửa địa chỉ:
  1. Click "Chỉnh sửa" trên địa chỉ
  2. Modal mở với dữ liệu sẵn
  3. Sửa thông tin
  4. Click "Lưu địa chỉ"
  5. Thay đổi được lưu

- Test xóa địa chỉ:
  1. Click "Xóa"
  2. Confirm dialog xuất hiện
  3. Click OK
  4. Địa chỉ biến mất
  5. Reload → vẫn bị xóa

- Test đặt mặc định:
  1. Click "Đặt làm mặc định"
  2. Badge "MẶC ĐỊNH" chuyển sang địa chỉ đó
  3. Border đỏ xuất hiện
  4. Reload → vẫn là mặc định
```

#### 7. **Đăng xuất**

```
1. Click "Đăng xuất" ở menu bên trái
2. Redirect về /home
3. localStorage token bị xóa
4. Không thể truy cập /account (redirect về /login)
```

### Test Persistence (localStorage)

```
1. Đăng nhập
2. Thực hiện các thay đổi:
   - Xóa 1 sản phẩm wishlist
   - Sửa profile
   - Thêm địa chỉ mới
3. Reload trang (F5)
4. Kiểm tra → Tất cả thay đổi vẫn còn
5. Đăng xuất
6. Đăng nhập lại
7. Kiểm tra → Tất cả thay đổi vẫn còn
```

## Responsive Design

Account Page đã được tối ưu cho tất cả kích thước màn hình:

### Desktop (> 1024px)

- Layout 2 cột: Sidebar (280px) + Content
- Sidebar sticky khi scroll
- Wishlist: 3 cột
- Stats: 3 cột

### Tablet (768px - 1024px)

- Layout 1 cột: Sidebar trên, Content dưới
- Sidebar không sticky
- Wishlist: 2 cột
- Stats: 3 cột

### Mobile (< 768px)

- Layout 1 cột
- Sidebar thu gọn
- Wishlist: 1 cột
- Stats: 1 cột
- Order tabs: scroll ngang
- Buttons: stack dọc

## Debug & Reset Data

### Xem Dữ Liệu trong Console

```javascript
// Xem profile
console.log(JSON.parse(localStorage.getItem("anta_user_profile")));

// Xem orders
console.log(JSON.parse(localStorage.getItem("anta_user_orders")));

// Xem wishlist
console.log(JSON.parse(localStorage.getItem("anta_user_wishlist")));

// Xem addresses
console.log(JSON.parse(localStorage.getItem("anta_user_addresses")));
```

### Reset Về Dữ Liệu Mặc Định

```javascript
// Option 1: Xóa toàn bộ
localStorage.clear();

// Option 2: Xóa từng mục
localStorage.removeItem("anta_user_profile");
localStorage.removeItem("anta_user_orders");
localStorage.removeItem("anta_user_wishlist");
localStorage.removeItem("anta_user_addresses");

// Sau đó reload trang để khởi tạo lại dữ liệu mặc định
location.reload();
```

### Sử dụng Reset Function (Nếu cần)

```javascript
// Import và gọi trong code
import { resetUserData } from "../services/userService";
resetUserData();
```

## Files Liên Quan

### Core Files

- `src/pages/AccountPage.jsx` - Component chính Account Page
- `src/pages/AccountPage.css` - Styles cho Account Page
- `src/services/userService.js` - Mock services + localStorage logic
- `src/services/api.js` - API wrapper (integrate mock services)

### Auth & Context

- `src/contexts/AuthContext.jsx` - Authentication context
- `src/services/authService.js` - Mock authentication service
- `src/components/AuthForm.jsx` - Login/Register form

### Constants

- `src/constants/index.js` - Routes, API endpoints, Storage keys

## Chuyển Sang Backend Thật

Khi muốn kết nối backend thật, chỉ cần sửa `src/services/api.js`:

### Hiện tại (Mock)

```javascript
import mockUserService from "./userService";

export const userService = {
  getProfile: async () => {
    return await mockUserService.profile.getProfile();
  },
  // ...
};
```

### Chuyển sang Real API

```javascript
export const userService = {
  getProfile: async () => {
    const response = await api.get(API_ENDPOINTS.USER.PROFILE);
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await api.put(API_ENDPOINTS.USER.UPDATE_PROFILE, userData);
    return response.data;
  },

  // ... tương tự cho các methods khác
};
```

Tất cả các endpoints đã được define sẵn trong `src/constants/index.js` phần `API_ENDPOINTS`.

## Lưu Ý Quan Trọng

### localStorage Limits

- Mỗi domain có giới hạn ~5-10MB localStorage
- Dữ liệu mock nhỏ, không vấn đề
- Nếu mở rộng, cân nhắc IndexedDB

### Security

- localStorage có thể bị XSS attack
- Không lưu dữ liệu nhạy cảm (credit card, etc.)
- Production nên dùng httpOnly cookies cho token

### Data Sync

- localStorage chỉ sync trong 1 tab
- Multi-tab cần addEventListener('storage')
- Hoặc dùng BroadcastChannel API

### Testing

- Clear localStorage giữa các test case
- Test với data rỗng và data có sẵn
- Test với data corrupted (invalid JSON)

## Troubleshooting

### Vấn đề: Dữ liệu không lưu

```
Giải pháp:
1. Kiểm tra Console có error không
2. Kiểm tra localStorage quota
3. Try incognito mode (disable extensions)
4. Clear cache và reload
```

### Vấn đề: Dữ liệu bị reset sau reload

```
Giải pháp:
1. Kiểm tra setToStorage được gọi đúng
2. Kiểm tra localStorage permissions
3. Kiểm tra browser settings (có block storage không)
```

### Vấn đề: 401 Unauthorized

```
Giải pháp:
1. Kiểm tra token trong localStorage
2. Đăng nhập lại
3. Kiểm tra token expiry (24h)
```

---

**Phát triển bởi**: ANTA Shop Frontend Team  
**Ngày cập nhật**: 2024  
**Version**: 2.0 (localStorage persistent)
