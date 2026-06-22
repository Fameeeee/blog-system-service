# Blog System Service

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

A full-featured blog backend API built with **NestJS**, **TypeScript**, **PostgreSQL**, and **Prisma ORM**. Supports user authentication, blog management, comments, and image uploads via Cloudinary.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running the Application](#running-the-application)
- [Database](#database)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [Deployment](#deployment)

## ✨ Features

- **User Authentication**: JWT-based authentication with register and login
- **Blog Management**: Create, read, update, delete blog posts with slug-based URLs
- **Comments System**: Moderation-ready comment system with approval workflow
- **Image Uploads**: Cloudinary integration for seamless image hosting
- **Security**: Helmet for HTTP headers security, bcrypt for password hashing
- **Database**: PostgreSQL with Prisma ORM for type-safe queries
- **Validation**: Class-validator for DTO validation
- **Testing**: Comprehensive unit and e2e tests with Jest
- **Code Quality**: ESLint and Prettier for code formatting

## 🛠 Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| NestJS | 11.0+ | Backend framework |
| TypeScript | Latest | Language |
| PostgreSQL | 14+ | Database |
| Prisma | 7.8+ | ORM |
| JWT | 11.0+ | Authentication |
| Cloudinary | 2.10+ | Image hosting |
| Helmet | 8.2+ | Security |
| Jest | Latest | Testing |
| ESLint | Latest | Linting |

## 📁 Project Structure

```
src/
├── auth/                  # Authentication module
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── jwt.strategy.ts
│   ├── jwt-auth.guard.ts
│   └── dto/
├── blogs/                 # Blogs module
│   ├── blogs.controller.ts
│   ├── blogs.service.ts
│   └── dto/
├── comments/              # Comments module
│   ├── comments.controller.ts
│   ├── comments.service.ts
│   └── dto/
├── upload/                # File upload module
│   ├── upload.controller.ts
│   ├── upload.service.ts
│   ├── cloudinary.provider.ts
│   └── dto/
├── common/                # Shared services
│   └── prisma.service.ts
├── app.module.ts          # Root module
├── app.service.ts         # Root service
└── main.ts                # Application entry point

prisma/
├── schema.prisma          # Database schema
└── migrations/            # Database migrations
```

## 📦 Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL**: v14.0 or higher
- **Cloudinary Account**: For image uploads (optional, can be mocked)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd blog-system-service
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Generate Prisma Client**
   ```bash
   npm run prisma:generate
   ```

## 🔧 Environment Setup

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/blog_db

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRATION=3600

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Server
PORT=3000
NODE_ENV=development
```

## 🎯 Running the Application

```bash
# Development mode (watch mode)
npm run start:dev

# Production build
npm run build

# Production mode
npm run start:prod

# Debug mode
npm run start:debug
```

The API will be available at `http://localhost:3000`

## 🗄 Database

### Initialize Database

```bash
# Create and apply migrations
npm run prisma:migrate

# Generate Prisma Client
npm run prisma:generate

# Open Prisma Studio (GUI)
npm run prisma:studio
```

### Database Schema

The schema includes:
- **User**: Authentication and profile data
- **Blog**: Blog posts with content and metadata
- **Comment**: User comments on blogs with moderation status
- **Upload**: Image metadata for Cloudinary uploads

See [prisma/schema.prisma](prisma/schema.prisma) for full schema details.

## 🔌 API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user and receive JWT token
- `GET /auth/profile` - Get current user profile (requires authentication)

### Blogs
- `POST /blogs` - Create a new blog (requires authentication)
- `GET /blogs` - Get all blogs with pagination
- `GET /blogs/:slug` - Get a blog by slug
- `PATCH /blogs/:id` - Update a blog (requires authentication)
- `DELETE /blogs/:id` - Delete a blog (requires authentication)

### Comments
- `POST /comments/blog/:blogId` - Create a comment on a blog
- `GET /comments` - Get all comments (admin only)
- `PATCH /comments/:id/status` - Approve/reject a comment (admin only)

### Upload
- `POST /upload` - Upload an image (requires authentication)

For detailed API documentation, see [API.md](API.md)

## 🧪 Testing

```bash
# Run all unit tests
npm run test

# Run unit tests in watch mode
npm run test:watch

# Run unit tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e
```

Tests are located in:
- `src/**/*.spec.ts` - Unit tests
- `test/` - E2E tests

## ✅ Code Quality

### ESLint & Prettier

```bash
# Run ESLint and auto-fix issues
npm run lint

# Format code with Prettier
npm run format
```

ESLint configuration: [eslint.config.mjs](eslint.config.mjs)
Prettier configuration: [.prettierrc](package.json)

## 🚀 Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

### Environment Variables for Production

Ensure these environment variables are set on your production server:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secure JWT secret (use a strong random value)
- `CLOUDINARY_CLOUD_NAME` - Cloudinary account
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `NODE_ENV=production`
- `PORT` - Server port (default: 3000)

### Docker Deployment (Optional)

To deploy with Docker, create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
```

Build and run:
```bash
docker build -t blog-system-service .
docker run -p 3000:3000 --env-file .env blog-system-service
```

## 📚 Documentation

- [API.md](API.md) - Complete API reference with examples
- [FRONTEND_BLOG_FORMS.md](FRONTEND_BLOG_FORMS.md) - Frontend integration guide
- [prisma/schema.prisma](prisma/schema.prisma) - Database schema

## 🐛 Troubleshooting

### Database connection fails
- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Ensure database user has correct permissions

### Prisma migration errors
```bash
# Reset the database (development only)
npm run prisma:reset

# View migration status
npm run prisma:status
```

### JWT authentication issues
- Verify `JWT_SECRET` is set in `.env`
- Check token format in Authorization header: `Bearer <token>`
- Ensure token hasn't expired (default: 3600 seconds)

### Cloudinary upload failures
- Verify Cloudinary credentials in `.env`
- Check that `.env` file is in the root directory
- Ensure file size is within Cloudinary limits

## 📝 License

This project is licensed under UNLICENSED.

## 👨‍💼 Support

For issues and questions:
1. Check existing documentation in [API.md](API.md)
2. Review NestJS docs: https://docs.nestjs.com
3. Check Prisma docs: https://www.prisma.io/docs
4. File an issue in the repository

---

Built with ❤️ using NestJS
