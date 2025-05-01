# E-commerce Admin & Storefront Platform

A full-featured e-commerce platform built with modern web technologies, providing both an intuitive admin dashboard and a responsive customer storefront.

## Features

### Admin Dashboard
- **Product Management**
  - Create, edit, and delete products with detailed information
  - Support for multiple product images and thumbnails
  - File attachments for digital products
  - Tag and category organization
  - Inventory tracking
  - Featured product highlighting
  - Discount management (flat amount, percentage, or both)

- **Branch Management**
  - Store location creation and management
  - Interactive map integration for location selection
  - Business hours configuration
  - Contact details with social media integration
  - Custom content sections for each branch

- **Content Management**
  - Promotional banners
  - Featured products carousel
  - Category management

### Customer Storefront
- Responsive design for mobile and desktop browsing
- Product search and filtering
- Featured products showcase
- Category navigation
- Detailed product pages with images, descriptions, and pricing
- Cart and checkout functionality
- User authentication and profile management

## Technology Stack

- **Frontend**: Next.js 15 with App Router, React, TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Custom session-based auth system
- **Maps**: Interactive mapping for branch locations
- **Forms**: Form validation with React Hook Form and Zod

## Getting Started

### Prerequisites
- Node.js 18.x or higher
- PostgreSQL database
- npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables in `.env`:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/dbname
   ```
Make sure to create the database before running the migrations. And make sure to create the .env file in the root of the project and add the DATABASE_URL.

4. Run database migrations:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Access the application:
   - Storefront: [http://localhost:3000](http://localhost:3000)
   - Admin dashboard: [http://localhost:3000/admin](http://localhost:3000/admin)

## Project Structure
- /app
- /admin - Admin dashboard routes
- /main - Public storefront routes
- /api - API endpoints
- /components - Reusable UI components
- /lib - Utility functions and shared libraries
- /prisma - Database schema
- /public - Static assets, and folders for uploaded files
- /schemas - Validation schemas
- /services - API service clients
- /types - TypeScript type definitions
- /utils - Helper utilities


## Deployment

The application can be deployed on any platform that supports Next.js applications.

```bash
npx prisma generate
npx prisma db push
npm run build
npm run start
```

Docker Compose can be used to deploy the application in a containerized environment.

```bash
docker compose up --build
```
The command above will build the application and start the containers. The containers include the Next.js application, the PostgreSQL database, and the Prisma client generation and database initialization.



## Contributors

- Abdullah Sulayfani

## License

This project is proprietary software for commercial use only. All rights reserved.
No redistribution, modification, or use of this codebase is permitted without explicit written permission.

