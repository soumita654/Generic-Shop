# 🛒 GenericShop – Full Stack E-Commerce Web Application

GenericShop is a modern full-stack e-commerce web application that allows users to browse products, search and filter items, manage a shopping cart, and complete a mock checkout process.

The application includes authentication, order history, inventory management, and product filtering, providing a realistic e-commerce workflow.

This project was built as part of a hackathon project to demonstrate the implementation of a scalable online shopping platform.

---

# 🚀 Live Demo

https://generic-shop-theta.vercel.app

---

# ✨ Features

## 🧾 Product Catalog

The landing page displays a responsive grid of products fetched from the database.

Each product contains:

- Title
- Description
- Price
- Category
- Stock Quantity
- Product Image

Products are dynamically rendered and update automatically based on filters.

---

## 🔐 User Authentication

Users can securely create accounts and log into the platform.

Authentication system includes:

- User Signup
- User Login
- Logout
- Secure session management

After logging in, users can access their profile page.

The profile page stores:

- Order history
- User information
- Previous purchases

Authentication is handled using Supabase Auth.

---

## 🛍️ Shopping Cart System

The application provides a persistent shopping cart.

Users can:

- Add products to cart
- Remove products from cart
- Update product quantities
- View cart total price

The cart automatically calculates:

- Subtotal
- Total price based on quantity

Cart data persists during the session.

---

## 💳 Mock Checkout Flow

The checkout system simulates a real purchase process.

### Checkout Steps

1. Shipping Address  
2. Payment Method  
3. Order Confirmation  

When checkout is completed:

- An order is created in the database
- Purchased product quantities are deducted from stock
- The order is saved to the user's order history

No real payment gateway is required.

---

## 🔍 Search & Filter System

The application includes powerful filtering tools.

Users can:

- Search products using the search bar
- Filter by category
- Filter using a price range slider

Filters update the product list dynamically.

---

# 🗄️ Database

The project uses Supabase (PostgreSQL) as the backend database.

## Products Table

| Field | Description |
|------|-------------|
| id | Unique product ID |
| title | Product name |
| description | Product details |
| price | Product price |
| category | Product category |
| stock | Available quantity |
| image_url | Product image |
| created_at | Timestamp |

---

## Orders Table

| Field | Description |
|------|-------------|
| id | Order ID |
| user_id | User who placed order |
| total_price | Total order value |
| created_at | Order timestamp |

---

## Order Items Table

| Field | Description |
|------|-------------|
| id | Item ID |
| order_id | Associated order |
| product_id | Purchased product |
| quantity | Quantity purchased |
| price | Product price |

---

# 📦 Dummy Product Data

The database contains 50+ AI-generated dummy products distributed across multiple categories.

### Categories

- Electronics
- Home & Kitchen
- Apparel
- Sports & Fitness
- Books

Example product:

Title: Wireless Bluetooth Earbuds  
Category: Electronics  
Price: ₹2999  
Stock: 45  
Description: High-quality wireless earbuds with noise cancellation.

---

# 🛠️ Tech Stack

## Frontend

- React
- Vite
- TypeScript
- TailwindCSS

## Backend

- Supabase
- PostgreSQL
- Supabase Authentication

## Development Tools

- Git & GitHub

---

# 📂 Project Structure

```
myntra-essentials
│
├── public
│
├── src
│   ├── components
│   ├── pages
│   ├── hooks
│   ├── contexts
│   ├── lib
│   └── utils
│
├── supabase
│   └── migrations
│
├── index.html
├── package.json
├── tailwind.config.ts
├── vite.config.ts
└── README.md
```

---

# ⚙️ Installation & Setup

## 1. Clone the repository

```bash
git clone https://github.com/yourusername/genericshop.git
cd genericshop
```

## 2. Install dependencies

Using npm

```bash
npm install
```

or using bun

```bash
bun install
```

---

## 3. Configure Environment Variables

Create a `.env` file in the root directory.

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can obtain these values from your Supabase project dashboard.

---

## 4. Run the development server

```bash
npm run dev
```

The application will run at:

```
http://localhost:5173
```

---

# 🚀 Deployment

This project can be deployed easily using:

- Vercel
- Netlify
- Supabase Hosting

Example deployment:

https://generic-shop-theta.vercel.app

---

# 🧪 Testing

Testing is configured using Playwright.

To run tests:

```bash
npm run test
```

---

# 📈 Future Improvements

Possible improvements include:

- Real payment gateway integration (Stripe / Razorpay)
- Product reviews and ratings
- Admin dashboard for product management
- Order tracking system
- Product image upload system

---

# 📜 License

This project is created for educational and hackathon purposes.
