// src/services/mockAuthService.js
import { STORAGE_KEYS } from "../constants";

const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

// Get registered users from localStorage
const getRegisteredUsers = () => {
  try {
    const users = localStorage.getItem("anta_registered_users");
    return users ? JSON.parse(users) : [];
  } catch {
    return [];
  }
};

// Save registered users to localStorage
const saveRegisteredUsers = (users) => {
  localStorage.setItem("anta_registered_users", JSON.stringify(users));
};

// Create JWT token
const createMockToken = (username, email, role = "USER") => {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      sub: username,
      role,
      email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400, // 24h
    })
  );
  const signature = btoa("mock-signature");
  return `${header}.${payload}.${signature}`;
};

// Mock Auth Service
export const mockAuthService = {
  // Register new user
  register: async (userData) => {
    await delay();

    const { username, email, password } = userData;

    // Validation
    if (!username || !email || !password) {
      throw new Error("Vui lòng điền đầy đủ thông tin");
    }
    if (username.length < 3) {
      throw new Error("Username phải có ít nhất 3 ký tự");
    }
    if (password.length < 6) {
      throw new Error("Mật khẩu phải có ít nhất 6 ký tự");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Email không hợp lệ");
    }

    const users = getRegisteredUsers();

    if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      throw new Error("Username đã tồn tại");
    }
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("Email đã được sử dụng");
    }

    const newUser = {
      id: Date.now(),
      username,
      email,
      password, // ⚠️ trong production phải hash
      role: "USER",
      createdAt: new Date().toISOString(),
      profile: {
        fullName: username,
        phone: "",
        birthday: "",
        gender: "",
      },
    };

    users.push(newUser);
    saveRegisteredUsers(users);

    return {
      success: true,
      message: "Đăng ký thành công! Vui lòng đăng nhập.",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    };
  },

  // Login user
  login: async (credentials) => {
    await delay();

    const { username, password } = credentials;

    // Hardcoded admin
    if (username === "admin" && password === "abc123!@#") {
      const token = createMockToken("admin", "admin@anta.com", "ADMIN");
      return {
        success: true,
        token,
        user: {
          id: 1, // thêm id giả lập
          username: "admin",
          email: "admin@anta.com",
          role: "ADMIN",
        },
      };
    }

    // Hardcoded test user
    if (username === "user" && password === "123456") {
      const token = createMockToken("user", "user@anta.com", "USER");
      return {
        success: true,
        token,
        user: {
          id: 4, // thêm id giả lập
          username: "user",
          email: "user@anta.com",
          role: "USER",
        },
      };
    }

    // Registered users
    const users = getRegisteredUsers();
    const user = users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );

    if (!user) throw new Error("Tài khoản không tồn tại");
    if (user.password !== password) throw new Error("Mật khẩu không chính xác");

    const token = createMockToken(user.username, user.email, user.role);

    return {
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  },

  // Get user by username
  getUserByUsername: async (username) => {
    await delay();
    const users = getRegisteredUsers();
    const user = users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );
    if (!user) throw new Error("Người dùng không tồn tại");
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      profile: user.profile,
    };
  },

  // Check if username exists
  checkUsernameExists: async (username) => {
    await delay(200);
    const users = getRegisteredUsers();
    return users.some((u) => u.username.toLowerCase() === username.toLowerCase());
  },

  // Check if email exists
  checkEmailExists: async (email) => {
    await delay(200);
    const users = getRegisteredUsers();
    return users.some((u) => u.email.toLowerCase() === email.toLowerCase());
  },
};

export default mockAuthService;