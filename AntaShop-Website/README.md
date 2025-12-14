<<<<<<< HEAD
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
=======
# 🚀 AntaShop Frontend – React E-Commerce Website

<p align="center">
  <strong>Modern E-Commerce Frontend for Shoes & Fashion</strong><br>
  React • Vite • JavaScript • CSS Modules • REST API • Node.js
</p>

<p align="center">
  <img src="https://img.shields.io/badge/react-19+-61DAFB?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/vite-7.0-646CFF?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/node-22+-green?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/npm-run--dev-red?style=for-the-badge"/>
</p>

---

# 🎨 Overview

**AntaShop Frontend** is a modern, fast, and scalable web interface built using **React + Vite**, designed for an e-commerce platform specializing in **shoes and fashion products**.

This frontend consumes REST APIs from AntaShop’s microservice backend and provides a smooth, responsive, and user-friendly shopping experience.

---

# 🛠️ Tech Stack

## Core Technologies
• React 19+
• JavaScript (ES6+)  
• Vite (for ultra-fast dev environment)  
• Node.js + npm  
• HTML5 / CSS3  
• CSS Modules / SCSS  
• REST API integration  

## Development Tools
• Visual Studio Code  
• ESLint  
• Prettier  
• Postman / Thunder Client  

---

# 📂 Project Structure

```
AntaShop-Website/
│── website/
│   └── store/
│       ├── public/
│       ├── src/
│       │   ├── assets/
│       │   ├── components/
│       │   ├── constants/
│       │   ├── contexts/
│       │   ├── hooks/
│       │   ├── pages/
│       │   ├── services/
│       │   ├── styles/
│       │   ├── utils/
│       │   ├── App.jsx
│       │   ├── App.css
│       │   ├── main.jsx
│       │   └── index.js
│       ├── package.json
│       ├── vite.config.js
│       ├── .env
│       └── README.md
```

---

# 🚀 Getting Started

## ⭐ Prerequisites
• Node.js 22+ 
• npm or yarn  
• VS Code  
• Backend API running (Identity, Product, Cart, Order, etc.)

---

# 🔧 Installation

Clone the project:
```bash
git clone https://github.com/your-repo/AntaShop-Website.git
cd AntaShop-Website/website/store
```

Install dependencies:
```bash
npm install
```

Start development server:
```bash
npm run dev
```

Vite will start at something like:
```
http://localhost:5173
```

---

# 🔌 Environment Variables

Inside `.env`, configure:
```
VITE_API_URL=http://localhost:8080
VITE_IMAGE_BASE_URL=http://localhost:8081
```

*(Adjust according to your backend services.)*

---

# 📌 Features

• Fully responsive UI (desktop & mobile)  
• JWT-based authentication flows  
• Login / Register / Forgot Password  
• Product listing, filtering, sorting  
• Product details view  
• Shopping cart with real-time updates  
• Checkout & order summary  
• User profile & address book  
• Wishlist & order history  
• Toast notifications & modals  
• Axios service layers  
• Global state via React Context  

---

# 📘 Developer Guide

## React Scripts

### Start dev server
```bash
npm run dev
```

### Build for production
```bash
npm run build
```

### Preview build
```bash
npm run preview
```

---

# 🧩 Folder Highlights

### `/components`
Reusable UI components: buttons, inputs, cards, modals...

### `/contexts`
Authentication, Cart, Orders, Wishlist context providers.

### `/services`
API service modules (axios-based).

### `/pages`
Main pages: Home, Product, Cart, Checkout, Profile, Admin…

### `/utils`
Helper functions (formatting, validation...).

---

# 💡 Coding Standards
• Clean and consistent folder structure  
• Centralized API services  
• Reusable components  
• No inline CSS – always use CSS modules  
• ESLint + Prettier enabled  

---


# 👥 Team

### 👨‍💻 Leader  
• **Nguyễn Bá Viên**

### 👥 Members  
• **Phạm Quang Thuần**  
• **Nguyễn Văn Đức Trung**

---
Frontend Developer – React  
📧 **nguyenbavien.26092005@gmail.com** 

---

# 📜 License
This project is for **educational and development purposes only**, not for commercial use.

>>>>>>> 84c8fe106348d9080586d3ca2f34cc506e9d2643
