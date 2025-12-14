# Thông Tin Đăng Nhập Admin

## Tài khoản Admin

Để truy cập vào trang Admin Dashboard, sử dụng thông tin đăng nhập sau:

**Tên đăng nhập:** `admin`  
**Mật khẩu:** `abc123!@#`

## Hướng dẫn đăng nhập

1. Truy cập trang đăng nhập: `/login`
2. Nhập tên đăng nhập: `admin`
3. Nhập mật khẩu: `abc123!@#`
4. Nhấn nút "Login"

Sau khi đăng nhập thành công, bạn sẽ được chuyển hướng đến trang Admin Dashboard tại `/admin`.

## Bảo mật

- Chỉ tài khoản với username `admin` và password `abc123!@#` mới có thể truy cập Admin Dashboard
- Các tài khoản khác (nếu có) sẽ không thể truy cập trang Admin ngay cả khi đăng nhập thành công
- Nếu cố gắng truy cập `/admin` mà không đăng nhập hoặc không phải tài khoản admin, người dùng sẽ bị chuyển hướng về trang login hoặc home

## Lưu ý

- Thông tin đăng nhập này được mã hóa và lưu trữ trong localStorage
- Tài khoản admin có quyền truy cập đầy đủ vào:
  - Quản lý sản phẩm
  - Quản lý vận chuyển
  - Xem thống kê dashboard
  - Tin nhắn và thông báo
  - Cài đặt hệ thống
