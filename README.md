
#  NFC Student ID Card System

A smart student identification and attendance system leveraging NFC (Near Field Communication) technology to streamline school operations and enhance student convenience.

## Overview

This project provides a comprehensive solution for managing student identification and attendance using NFC-enabled ID cards. Students can quickly check in/out and access school services by simply tapping their NFC cards, reducing manual paperwork and improving operational efficiency.

### Key Features

-  **NFC-Based Authentication** - Secure student identification via NFC technology
-  **Real-Time Attendance Dashboard** - Track attendance records in real-time
-  **Student Management** - Comprehensive student profile and data management
-  **Modern UI** - Responsive, user-friendly dashboard built with React
-  **High Performance** - Built with Next.js for optimal performance
-  **Beautiful Design** - Tailwind CSS for sleek, modern styling
-  **API Documentation** - Interactive Swagger documentation

##  Tech Stack

### Frontend
- **Framework**: Next.js 16.2.6, React 19.2.4
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Data Fetching**: Axios, TanStack Query (React Query v5)
- **Animations**: Motion
- **Internationalization**: next-intl
- **Icons**: Lucide React
- **Compiler**: Babel React Compiler

### Backend
- **Framework**: Express.js v5.2.1
- **Language**: JavaScript (ES Modules)
- **ORM**: Prisma v6.19.3
- **Authentication**: JWT (jsonwebtoken), bcrypt
- **API Documentation**: Swagger UI & JSDoc
- **CORS**: Enabled for development
- **Dev Tools**: Nodemon

##  Key Dependencies

### Frontend
| Package | Version | Purpose |
|---------|---------|---------|
| Next.js | 16.2.6 | React framework |
| React | 19.2.4 | UI library |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 4 | Styling |
| Zustand | 5.0.13 | State management |
| TanStack Query | 5.100.14 | Server state |
| Axios | 1.16.1 | HTTP client |

### Backend
| Package | Version | Purpose |
|---------|---------|---------|
| Express | 5.2.1 | Web framework |
| Prisma | 6.19.3 | ORM |
| JWT | 9.0.3 | Authentication |
| bcrypt | 6.0.0 | Password hashing |
| CORS | 2.8.6 | Cross-origin requests |

##  Features in Development

- [ ] Mobile app (React Native)
- [x] Web dashboard (Tailwindcss)
- [ ] reporting and analytics
- [ ] Automated notifications
- [x] Multi-language support (partial: next-intl)
- [ ] NFC hardware integration
- [ ] Role-based access control
- [ ] Student attendance history

##  Security

- Password hashing with bcrypt
- JWT-based authentication
- CORS protection
- Environment variable management
- Prisma for SQL injection prevention
