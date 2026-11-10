Note : backend takes time to start please wait 4–5 minutes after putting first request of login or register ( it will show unable to connect backend wait for sometime)
# Campus Marketplace - Backend

Campus Marketplace Backend is a Spring Boot REST API that powers a student-to-student marketplace. It provides authentication, listing management, wishlist functionality, seller inquiries, image upload handling, and Google Books API integration.

## Project Overview

Campus Marketplace is designed to help students buy and sell items within their campus community.

The backend manages:

- User registration and login
- JWT-based authentication
- Marketplace listings
- Product categories
- Wishlist management
- Seller inquiries
- Inquiry replies
- Product image uploads
- Google Books API integration
- MySQL database operations
- REST API communication with the React frontend

## Technology Stack

- Java 21
- Spring Boot 3.3
- Spring Web
- Spring Data JPA
- Hibernate
- Spring Security
- JWT
- MySQL
- Maven
- Google Books API
- Docker
- Render
- Aiven MySQL

## Backend Architecture

React Frontend
       |
       | REST API
       v
Controller Layer
       |
       v
Service Layer
       |
       v
Repository Layer
       |
       v
JPA / Hibernate
       |
       v
Aiven MySQL

The backend follows a layered architecture.

### Controller Layer

Handles HTTP requests and responses and exposes REST API endpoints.

### Service Layer

Contains business logic and coordinates operations between controllers and repositories.

### Repository Layer

Uses Spring Data JPA to communicate with the MySQL database.

### Entity Layer

Defines the application's database entities and relationships.

### DTO Layer

Used where required to transfer data between the backend and frontend.

## Main Features

### Authentication

- User registration
- User login
- JWT token generation
- JWT-based authentication
- Protected API endpoints
- User logout/session handling

### Marketplace Listings

Users can:

- Create listings
- View listings
- Update listings
- Delete listings
- Browse listings by category
- Store product descriptions
- Store price and condition
- Upload product images

### Product Categories

The marketplace supports:

- Electronics
- Books
- Lab Supplies
- Stationery
- Furniture
- Clothing
- Others

### Wishlist

Authenticated users can:

- Add listings to their wishlist
- Remove listings from their wishlist
- View saved listings

### Inquiries

Users can:

- Send inquiries about listings
- View inquiries
- Reply to inquiries

This provides a basic communication mechanism between buyers and sellers.

### Google Books API

The application supports book-related functionality through the Google Books API.

Google Books API endpoint:

https://www.googleapis.com/books/v1/volumes

The API key is provided through an environment variable and is not stored directly in the source code.

## Database

The production database uses MySQL hosted on Aiven.

Application tables include:

- users
- listings
- wishlists
- inquiries
- inquiry_replies

The application uses JPA and Hibernate for object-relational mapping and database access.

## Database Configuration

The application uses environment variables for the production database connection.

Example:

spring.datasource.url=${DB_URL}
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}

The production database credentials are not stored in the GitHub repository.

## Environment Variables

The backend requires the following environment variables:

DB_URL
DB_USERNAME
DB_PASSWORD
JWT_SECRET
JWT_EXPIRATION_MS
ALLOWED_ORIGINS
GOOGLE_BOOKS_API_KEY
EXTERNAL_BOOKS_API_URL
UPLOAD_DIR

Example configuration:

DB_URL=jdbc:mysql://<AIVEN_HOST>:<PORT>/defaultdb?sslMode=REQUIRED
DB_USERNAME=avnadmin
DB_PASSWORD=<your-password>
JWT_SECRET=<your-jwt-secret>
JWT_EXPIRATION_MS=86400000
ALLOWED_ORIGINS=<your-frontend-url>
GOOGLE_BOOKS_API_KEY=<your-google-books-api-key>
EXTERNAL_BOOKS_API_URL=https://www.googleapis.com/books/v1/volumes
UPLOAD_DIR=./uploads

Never commit real passwords, JWT secrets, database credentials, or private API keys to GitHub.

## Local Setup

### 1. Clone the Repository

git clone <YOUR-BACKEND-REPOSITORY-URL>

cd campus-marketplace-backend

### 2. Configure Environment Variables

Configure the required environment variables for your local development environment.

For local development, you can use a local MySQL database or a development database.

### 3. Build the Project

Using Maven:

mvn clean package

or:

./mvnw clean package

### 4. Run the Application

./mvnw spring-boot:run

The backend normally runs on:

http://localhost:8080

## Health Check

The backend provides a public health endpoint:

GET /api/health

Example response:

{
  "status": "UP"
}

This endpoint can be used to verify that the Spring Boot service is running.

## API Documentation

Springdoc OpenAPI is configured for API documentation.

API documentation endpoint:

/api-docs

Swagger UI:

/swagger-ui.html

When running locally:

http://localhost:8080/swagger-ui.html

## CORS

The backend supports configurable CORS using the ALLOWED_ORIGINS environment variable.

Example:

ALLOWED_ORIGINS=https://your-frontend.onrender.com

For local development:

ALLOWED_ORIGINS=http://localhost:5173

This allows the React frontend to communicate with the Spring Boot backend.

## Image Uploads

The backend accepts product image uploads using multipart requests.

The application stores an image reference for each listing and returns the information required by the frontend to display the uploaded image.

The current upload configuration uses:

UPLOAD_DIR=./uploads

For larger production deployments, persistent cloud object storage such as Amazon S3 or Cloudinary can be used instead of relying on local server storage.

## Security

The backend uses:

- Spring Security
- JWT authentication
- Environment variables for secrets
- Configurable CORS
- Protected API endpoints
- Externalized database credentials
- Externalized Google Books API credentials

Sensitive values are never required to be stored in the GitHub repository.

## Deployment

The Spring Boot backend is deployed on Render as a Docker-based Web Service.

Deployment architecture:

GitHub
   |
   v
Render Web Service
   |
   v
Spring Boot Application
   |
   v
Aiven MySQL

The backend receives its production configuration through Render environment variables.

## Production Backend

Backend:

https://campus-market-place-2-1.onrender.com

Health Check:

https://campus-market-place-2-1.onrender.com/api/health

## Docker

The backend is packaged and deployed using Docker.

The Docker build process:

1. Builds the Spring Boot application using Maven.
2. Creates the application JAR.
3. Runs the application using a Java runtime image.
4. Exposes the port provided by the Render environment.

## Render Configuration

The backend is deployed as a Render Web Service.

Typical configuration:

Repository:
GitHub backend repository

Branch:
main

Build:
Docker

Environment:
Production

Required environment variables are configured in the Render dashboard.

The application uses the Render-provided PORT environment variable:

server.port=${PORT:8080}

## API Areas

Main API functionality includes:

/api/auth

/api/listings

/api/wishlists

/api/inquiries

/api/health

/api-docs

/swagger-ui.html

The exact API endpoints depend on the current backend implementation.

## Development Workflow

The recommended workflow is:

1. Make backend changes locally.
2. Test the application.
3. Commit changes to Git.
4. Push changes to GitHub.
5. Render automatically builds and deploys the updated backend.
6. Verify the production health endpoint and application functionality.

## Production Architecture

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

## Future Improvements

Possible future improvements include:

- Persistent cloud image storage
- Advanced search and filtering
- Pagination
- Seller ratings and reviews
- Email notifications
- Admin moderation
- Automated tests
- CI/CD pipeline improvements
- Better image optimization
- Improved monitoring and logging

## Author

Campus Marketplace

Full-stack student marketplace project
