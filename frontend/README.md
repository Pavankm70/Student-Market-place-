Note : backend takes time to start please wait 4–5 minutes after putting first request of login or register ( it will show unable to connect backend wait for sometime)


# Campus Marketplace - Frontend

Campus Marketplace is a React-based student-to-student marketplace that allows students to discover, buy, and sell items within their campus community.

## Project Overview

The frontend is a responsive Single Page Application built using React and Vite. It provides the user interface for user authentication, browsing listings, creating listings, uploading product images, managing wishlists, and communicating with sellers.

The frontend communicates with a Java Spring Boot REST API deployed separately on Render.

## Features

### User Authentication

- User registration
- User login
- JWT-based authentication
- Protected routes
- Logout
- User session handling

### Marketplace Listings

Users can:

- Browse available listings
- View product details
- Search products
- Browse products by category
- Create new listings
- Edit their own listings
- Delete their own listings
- Upload product images
- View product price and condition

### Product Categories

The marketplace includes:

- Electronics
- Books
- Lab Supplies
- Stationery
- Furniture
- Clothing
- Others

### Wishlist

Users can:

- Add products to their wishlist
- Remove products from their wishlist
- View their saved products

### Seller Inquiries

Users can send inquiries about listings and communicate with sellers through the inquiry and reply system.

### Book Integration

The application supports book-related functionality through the Google Books API, integrated through the backend.

## Technology Stack

- React
- Vite
- JavaScript
- React Router
- Axios / Fetch API
- HTML5
- CSS
- Bootstrap
- Render

## Frontend Architecture

User
  |
  v
React Frontend
  |
  +-- Pages
  +-- Components
  +-- React Router
  +-- API Services
  |
  v
Spring Boot REST API
  |
  v
Aiven MySQL

The frontend is responsible for:

- User interface
- Client-side routing
- Form handling
- API communication
- Authentication state
- Listing display
- Product image display
- Wishlist interactions
- Inquiry functionality

The backend is responsible for:

- Business logic
- JWT authentication
- Database operations
- Image upload processing
- Google Books API integration

## Project Structure

campus-marketplace-frontend/
│
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── assets/
│   ├── App.jsx
│   └── main.jsx
│
├── .env
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
└── README.md

The exact folder structure may vary depending on the current implementation.

## Backend API Configuration

The frontend uses the VITE_API_URL environment variable to communicate with the Spring Boot backend.

### Local Development

Create a .env file in the root of the frontend project:

VITE_API_URL=http://localhost:8080

The application reads this variable using:

const API_URL = import.meta.env.VITE_API_URL;

Example:

fetch(`${API_URL}/api/listings`);

### Production

The production value is configured in Render:

VITE_API_URL=https://campus-market-place-2-1.onrender.com

The backend URL should not be hardcoded throughout the application.

## Environment Variables

The frontend requires:

VITE_API_URL

Local example:

VITE_API_URL=http://localhost:8080

Production example:

VITE_API_URL=https://campus-market-place-2-1.onrender.com

Do not store database passwords, JWT secrets, or private API keys in the frontend.

## Installation

### 1. Clone the Repository

git clone <YOUR-FRONTEND-REPOSITORY-URL>

cd campus-marketplace-frontend

### 2. Install Dependencies

npm install

### 3. Configure Environment Variables

Create a .env file:

VITE_API_URL=http://localhost:8080

### 4. Start the Development Server

npm run dev

The application will normally be available at:

http://localhost:5173

## Production Build

Create a production build:

npm run build

The production files are generated in:

dist/

To preview the production build:

npm run preview

## Render Deployment

The frontend is deployed as a Render Static Site.

### Render Configuration

Repository:
GitHub frontend repository

Branch:
main

Root Directory:
Leave empty

Build Command:
npm install && npm run build

Publish Directory:
dist

Auto Deploy:
Enabled

### Render Environment Variable

Key:

VITE_API_URL

Value:

https://campus-market-place-2-1.onrender.com

## React Router Configuration

The application uses React Router for client-side navigation.

Examples of routes:

/login
/register
/products
/profile

Because the application is a Single Page Application, Render requires a rewrite rule so that refreshing a route does not return a 404 error.

### Render Rewrite Rule

Action:
Rewrite

Source:
/*

Destination:
/index.html

This allows React Router to handle routes such as /login, /register, /products, and /profile when users refresh the browser.

## Image Upload Handling

Product images are uploaded through the backend API.

The frontend:

1. Allows the user to select an image.
2. Displays the selected image when required.
3. Sends the image to the backend using a multipart request.
4. Receives the stored image reference from the backend.
5. Displays the image associated with the correct listing.

The frontend should use the image URL returned by the backend instead of hardcoded or dummy image URLs.

## API Communication

The frontend communicates with the backend through REST APIs.

Main API areas include:

/api/auth
/api/listings
/api/wishlists
/api/inquiries
/api/health

The exact endpoints depend on the backend implementation.

## Deployment Architecture

User
  |
  v
React + Vite Frontend
  |
  | HTTPS REST API
  v
Spring Boot Backend
  |
  v
Aiven MySQL

Deployment services:

Frontend  -> Render Static Site
Backend   -> Render Web Service
Database  -> Aiven MySQL

## Live Application

Frontend :

https://campus-market-place-2.onrender.com

Backend:

https://campus-market-place-2-1.onrender.com

Backend Health Check:

https://campus-market-place-2-1.onrender.com/api/health

## Security

The frontend does not contain:

- Database passwords
- JWT signing secrets
- Private database credentials

Sensitive backend configuration is handled through environment variables on the backend.

Only values intended for client-side use should be exposed through VITE_ environment variables.

## Future Improvements

- Advanced product search
- Pagination
- Advanced filtering
- Product recommendations
- Notifications
- Seller ratings and reviews
- Image optimization
- Persistent cloud image storage
- Progressive Web App support
- Improved accessibility

## Author

Campus Marketplace

Full-stack student marketplace project
