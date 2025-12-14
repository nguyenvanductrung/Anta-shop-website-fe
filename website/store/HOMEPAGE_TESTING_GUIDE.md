# Homepage Testing Guide

## 🚀 Quick Start

The development server is running at: **http://localhost:5173/**

Navigate to `/home` to see the fully functional homepage.

## ✅ Features to Test

### 1. Hero Slider
**Location**: Top of homepage

**Test Cases**:
- [ ] Slider auto-rotates every 5 seconds
- [ ] Click left/right arrows to manually navigate
- [ ] Click dots at bottom to jump to specific slides
- [ ] Click "KHÁM PHÁ NGAY" button → navigates to /new
- [ ] Click "MUA NGAY" button → navigates to /men
- [ ] Responsive: Check slider height adjusts on mobile (400px-600px)

### 2. Discount Codes Section
**Location**: Below hero slider

**Test Cases**:
- [ ] Click "Sao chép" button → copies code to clipboard
- [ ] Alert shows confirming code was copied
- [ ] 3 coupon cards display correctly
- [ ] Responsive: Stacks to 1 column on mobile

### 3. Sport Categories Grid
**Location**: After discount codes

**Test Cases**:
- [ ] 4 category cards display (Running, Basketball, Training, Lifestyle)
- [ ] Hover effect: Image zooms, arrow appears
- [ ] Click card → navigates to /men
- [ ] Responsive: 4 cols → 2 cols → 1 col
- [ ] Images load correctly from Pexels

### 4. Featured Products Grid
**Location**: After sport categories

**Test Cases**:
- [ ] 4 product cards display
- [ ] Hover: Overlay appears with buttons
- [ ] Click "XEM NHANH" → Quick view modal opens
- [ ] Click "THÊM VÀO GIỎ" → Item added to cart
- [ ] Button text changes to "✓ ĐÃ THÊM" for 1.5 seconds
- [ ] Click product card → navigates to /product/:id
- [ ] Product badges display (HOT, SALE, NEW)
- [ ] Prices and discounts display correctly

### 5. Quick View Modal
**Trigger**: Click "XEM NHANH" on any product

**Test Cases**:
- [ ] Modal appears with overlay
- [ ] Product image displays on left
- [ ] Product details display on right
- [ ] Price shows correctly
- [ ] Click "X" button → Modal closes
- [ ] Click outside modal → Modal closes
- [ ] Click "Xem Chi Tiết" → Navigates to product page
- [ ] Click "Thêm Vào Giỏ" → Adds to cart and closes modal
- [ ] Responsive: Stacks image/details on mobile

### 6. Mega Sale Promo Banner
**Location**: After featured products

**Test Cases**:
- [ ] Two-column layout (content + image)
- [ ] Click "MUA NGAY" button → navigates to /collections/san-pham-mega-sale
- [ ] Responsive: Stacks to 1 column on mobile
- [ ] Button becomes full-width on mobile

### 7. Collections Showcase
**Location**: After promo banner

**Test Cases**:
- [ ] 2 collection cards display (Men's + Women's)
- [ ] Hover: Image zooms
- [ ] Click "KHÁM PHÁ NGAY" button → navigates correctly
- [ ] Click card → navigates to /men or /women
- [ ] Responsive: 2 cols → 1 col on mobile

### 8. Product Sections (Tabbed)
**Location**: Middle of homepage

**Test Cases**:
- [ ] "GIÀY THỂ THAO" section displays
- [ ] Click "Giày nam" tab → Shows men's shoes
- [ ] Click "Giày nữ" tab → Shows women's shoes
- [ ] 4 products display in grid
- [ ] Hover: Heart and cart buttons appear
- [ ] Click heart → Fills red (favorite)
- [ ] Click heart again → Unfills (unfavorite)
- [ ] Click cart icon → Adds to cart + shows notification
- [ ] Notification appears top-right with green background
- [ ] Notification auto-dismisses after 2 seconds
- [ ] Click product → navigates to /product/:id
- [ ] "QUẦN ÁO THỂ THAO" section displays below
- [ ] Responsive: Action buttons always visible on mobile

### 9. New Arrivals Section
**Location**: After product sections

**Test Cases**:
- [ ] 4 new arrival products display
- [ ] Same functionality as Featured Products
- [ ] Quick view works
- [ ] Add to cart works
- [ ] Navigation works

### 10. Brand Story Section
**Location**: After new arrivals

**Test Cases**:
- [ ] Two-column layout (image + content)
- [ ] 3 feature checkmarks display
- [ ] Click "TÌM HIỂU THÊM" → navigates to /products
- [ ] Responsive: Stacks to 1 column on mobile

### 11. Brand Partners Strip
**Location**: After brand story

**Test Cases**:
- [ ] 6 brand logos display
- [ ] Logos are grayscale by default
- [ ] Hover over strip → Logos become colored
- [ ] Hover over individual logo → Scales up
- [ ] Responsive: Logos wrap on mobile

### 12. Newsletter Signup
**Location**: Bottom of homepage (before footer)

**Test Cases**:
- [ ] Email input field displays
- [ ] Click input → Border changes to white
- [ ] Type email address
- [ ] Click "ĐĂNG KÝ NGAY" button
- [ ] Responsive: Input and button stack on mobile

## 🎯 Cart Functionality Testing

### Add to Cart Flow
1. **From Product Grid**:
   - [ ] Click "THÊM VÀO GIỎ" on featured product
   - [ ] Check header cart icon increases count
   - [ ] Click cart icon to view MiniCart
   - [ ] Verify product appears in cart

2. **From Quick View**:
   - [ ] Click "XEM NHANH" on product
   - [ ] Click "Thêm Vào Giỏ" in modal
   - [ ] Modal closes
   - [ ] Cart count increases
   - [ ] Product appears in MiniCart

3. **From Product Sections**:
   - [ ] Click cart icon on product card
   - [ ] Green notification appears top-right
   - [ ] Cart count increases
   - [ ] Product appears in MiniCart

### Cart Persistence
- [ ] Add items to cart
- [ ] Refresh page
- [ ] Cart items still present (localStorage)
- [ ] Cart count shows correctly

## ❤️ Favorite Functionality Testing

### Favorite Products
- [ ] Click heart icon on product in ProductSections
- [ ] Heart fills with red color
- [ ] Click heart again → Heart unfills
- [ ] State persists during session
- [ ] Multiple products can be favorited
- [ ] Each product tracks state independently

## 📱 Responsive Testing

### Desktop (1200px+)
- [ ] 4-column product grids
- [ ] Hero slider 600px height
- [ ] All hover effects work
- [ ] Two-column layouts display side-by-side

### Tablet (768px - 1199px)
- [ ] Product grids reduce to 2-3 columns
- [ ] Hero slider 500px height
- [ ] Sections stack appropriately
- [ ] Buttons remain clickable

### Mobile (< 768px)
- [ ] Product grids reduce to 1-2 columns
- [ ] Hero slider 450px height
- [ ] All sections stack vertically
- [ ] Action buttons visible (no hover needed)
- [ ] Touch interactions work
- [ ] Text remains readable
- [ ] Buttons full-width where appropriate

### Small Mobile (< 480px)
- [ ] Single column layouts
- [ ] Hero slider 400px height
- [ ] Smaller button sizes
- [ ] Reduced padding/margins
- [ ] Everything still accessible

## 🖼️ Image Loading Test

### Verify All Images Load
- [ ] Hero slider images (3 images)
- [ ] Sport category images (4 images)
- [ ] Featured product images (4 images)
- [ ] Promo banner image (1 image)
- [ ] Collection showcase images (2 images)
- [ ] Product section images (8+ images)
- [ ] New arrivals images (4 images)
- [ ] Brand story image (1 image)
- [ ] Brand logos (6 images)

**All images should load from Pexels CDN**

## 🎨 Design & Styling Test

### Visual Consistency
- [ ] ANTA red (#D70010) used for primary elements
- [ ] Consistent spacing throughout
- [ ] Proper typography hierarchy
- [ ] Hover states on all interactive elements
- [ ] Smooth transitions (200ms)
- [ ] Proper shadows and depth
- [ ] Consistent border radius

### Animations
- [ ] Hero slider fade transition
- [ ] Image zoom on hover
- [ ] Button hover effects
- [ ] Modal fade in/slide up
- [ ] Notification slide in from right
- [ ] All animations smooth (no jank)

## 🔗 Navigation Testing

### Links Working
- [ ] Hero slider buttons → correct pages
- [ ] Sport categories → /men
- [ ] Featured products → /product/:id
- [ ] Quick view "Xem Chi Tiết" → /product/:id
- [ ] Promo banner → /collections/san-pham-mega-sale
- [ ] Collections → /men, /women
- [ ] Product sections products → /product/:id
- [ ] Brand story button → /products
- [ ] All "View All" buttons → appropriate pages

## 🚨 Error Testing

### No Console Errors
- [ ] Open browser DevTools (F12)
- [ ] Go to Console tab
- [ ] Navigate through homepage
- [ ] No red errors should appear
- [ ] Warnings are acceptable

### Network Requests
- [ ] Open Network tab in DevTools
- [ ] Reload page
- [ ] All images load (200 status)
- [ ] CSS loads correctly
- [ ] JS loads correctly
- [ ] No 404 errors

## ⚡ Performance Testing

### Load Time
- [ ] Page loads in < 3 seconds
- [ ] Images lazy load as you scroll
- [ ] Smooth scrolling performance
- [ ] No layout shift when images load

### Interactions
- [ ] Button clicks respond immediately
- [ ] Hover effects are smooth
- [ ] Modal opens/closes quickly
- [ ] Cart updates instantly
- [ ] No lag when scrolling

## 🎯 Cross-Browser Testing

### Browsers to Test
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Safari (if available)
- [ ] Mobile Chrome
- [ ] Mobile Safari

## ✅ Final Checklist

### Before Marking Complete
- [ ] All sections visible and styled
- [ ] All images loading
- [ ] All buttons functional
- [ ] Cart functionality working
- [ ] Favorite functionality working
- [ ] Navigation working
- [ ] Responsive on all devices
- [ ] No console errors
- [ ] Performance is acceptable
- [ ] Animations are smooth
- [ ] Build passes (`npm run build`)
- [ ] Dev server runs (`npm run dev`)

## 🐛 Known Issues (If Any)

*List any issues found during testing here*

---

## 📝 Test Results

**Tester**: _______________  
**Date**: _______________  
**Browser**: _______________  
**Screen Size**: _______________  
**Pass/Fail**: _______________  

**Notes**:
_______________________________________________
_______________________________________________
_______________________________________________

---

**Homepage Status**: ✅ Ready for Testing

Open http://localhost:5173/home in your browser to begin testing!
