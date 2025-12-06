import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { DataSyncProvider, CartProvider, AuthProvider, OrderProvider, WishlistProvider, UserDataProvider } from "./contexts";
import { ToastProvider } from "./components/ToastContainer";
import { ProtectedRoute } from "./components";
import { ROUTES } from "./constants";
import TestCart from "./components/TestCart";
import {
  HomePage,
  Login,
  Register,
  ForgotPassword,
  ResetPassword,
  AdminPage,
  CartPage,
  ProductListPage,
  ProductDetailPage,
  BlogPage,
  BlogDetailPage,
  SearchPage,
  CheckoutPage,
  OrderSuccessPage,
  AccountPage
} from "./pages";

function App() {
  return (
    <ToastProvider>
      <DataSyncProvider>
        <AuthProvider>
          <UserDataProvider>
            <OrderProvider>
              <WishlistProvider>
                <CartProvider>
                  <Router>
                    <Routes>
                      <Route path="/" element={<Navigate to={ROUTES.HOME} />} />
                      <Route path={ROUTES.LOGIN} element={<Login />} />
                      <Route path={ROUTES.REGISTER} element={<Register />} />
                      <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
                      <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
                      <Route path={ROUTES.HOME} element={<HomePage />} />
                      <Route path={ROUTES.ADMIN} element={<ProtectedRoute requireAdmin={true}><AdminPage /></ProtectedRoute>} />
                      <Route path={ROUTES.CART} element={<CartPage />} />
                      <Route path={ROUTES.MEGA_SALE} element={<ProductListPage />} />
                      <Route path="/products" element={<ProductListPage />} />
                      <Route path="/product/:id" element={<ProductDetailPage />} />
                      <Route path="/blog" element={<BlogPage />} />
                      <Route path="/blog/:id" element={<BlogDetailPage />} />
                      <Route path="/search" element={<SearchPage />} />
                      <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
                      <Route path="/order-success" element={<ProtectedRoute><OrderSuccessPage /></ProtectedRoute>} />
                      <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
                      <Route path="/account/:section" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
                      <Route path="/men" element={<ProductListPage />} />
                      <Route path="/women" element={<ProductListPage />} />
                      <Route path="/kids" element={<ProductListPage />} />
                      <Route path="/accessories" element={<ProductListPage />} />
                      <Route path="/new" element={<ProductListPage />} />
                      <Route path="/exclusive" element={<ProductListPage />} />
                      <Route path="*" element={<Navigate to="/" />} />
                      <Route path="/test-cart" element={<TestCart />} />
                    </Routes>
                  </Router>
                </CartProvider>
              </WishlistProvider>
            </OrderProvider>
          </UserDataProvider>
        </AuthProvider>
      </DataSyncProvider>
    </ToastProvider>
  );
}

export default App;
