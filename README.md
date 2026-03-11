# 🛒 GenericShop – Full Stack E-Commerce Web Application

### GenericShop is a modern full-stack e-commerce web application that allows users to browse products, search and filter items, manage a shopping cart, and complete a mock checkout process.The application includes authentication, order history, inventory management, and product filtering, providing a realistic e-commerce workflow.

This project was built as part of a hackathon project to demonstrate the implementation of a scalable online shopping platform.


# ✨ Features
#### 🧾 Product Catalog

The landing page displays a responsive grid of products fetched from the database.

Each product contains:
Title
Description
Price
Category
Stock Quantity
Product Image
Products are dynamically rendered and update automatically based on filters.


# 🔐 User Authentication

Users can securely create accounts and log into the platform.
Authentication system includes:
User Signup
User Login
Logout
Secure session management
After logging in, users can access their profile page.
The profile page stores:
Order history
User information
Previous purchases
Authentication is handled using Supabase Auth.


# 🛍️ Shopping Cart System

The application provides a persistent shopping cart.
Users can:
Add products to cart
Remove products from cart
Update product quantities
View cart total price
The cart automatically calculates: Subtotal and Total price based on quantity
Cart data persists during the session.


# 💳 Mock Checkout Flow

The checkout system simulates a real purchase process.
Checkout Steps
Shipping Address
Payment Method
Order Confirmation

When checkout is completed:
An order is created in the database
Purchased product quantities are deducted from stock
The order is saved to the user's order history
No real payment gateway is required.
