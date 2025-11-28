// src/services/index.js
// Aggregator services - during frontend dev we expose both real api wrappers (if present) and mock admin services.

import api, { authService, productService as realProductService, cartService, userService, orderService as realOrderService, wishlistService } from './api';
import { momoPaymentService } from './momoPaymentService';

// mock admin service (local dev)
import adminService, {
  adminProductService,
  adminOrderService,
  adminSettingsService,
  adminMessageService,
  adminNotificationService,
  adminStatsService
} from './adminService';

// Exports:
// - default export: adminService (for admin UI during dev)
// - named exports for real api wrappers (if ./api exists) and for mock admin modules
export default adminService;

// re-export real api wrappers (if you have ./api implemented)
export { api, authService, realProductService as productService, cartService, userService, realOrderService as orderService, wishlistService, momoPaymentService };

// re-export mock admin modules for admin UI
export const products = adminProductService;
export const orders = adminOrderService;
export const settings = adminSettingsService;
export const messages = adminMessageService;
export const notifications = adminNotificationService;
export const stats = adminStatsService;
