# 📦 MINI APP

_A fullstack web application built with **Next.js**, **MongoDB Atlas**, and **Cloudinary** for seamless user and media management._

---

## 🚀 Tech Stack

- **Frontend:** Next.js (App Router)
- **Styling:** TailwindCSS
- **Backend:** Next.js API Routes
- **Database:** MongoDB Atlas
- **Storage:** Cloudinary (for image uploads)
- **Authentication:** [JWT / NEXT.JS MIDDLEWARE / COOKIES]

---

## ✨ Features

- 🔐 User Authentication (Login/Logout)
- 📋 Create, Edit, Delete Users
- 📸 Upload, Update, Delete profile photos in Cloudinary
- ✅ Status toggling (Active/Suspended)
- 📱 Responsive Design
- 🔔 Toast Notifications
- 🛡️ Protected Routes
- ✅ Role-based access control (super_admin, admin, user)
- 🔍 Search & filter users
- 📄 Pagination


---

## 📁 Folder Structure

/components/ → Reusable UI components
/lib/ or /utils/ → Helpers (DB connect, JWT)
/app/api/ → API endpoints
/public/ → Static files


---

## ⚙️ Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/8writes/mini-application.git
cd mini-application

npm install
# or
yarn install

npm run dev
.
```

## ⚙️ Configure .env & install dependencies

MONGODB_URI=your_mongodb_atlas_connection_string

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name

CLOUDINARY_API_KEY=your_api_key

CLOUDINARY_API_SECRET=your_api_secret

JWT_SECRET=your_jwt_secret

  "dependencies": {
    "bcryptjs": "^3.0.2",
    "cloudinary": "^2.6.0",
    "cookie": "^1.0.2",
    "jose": "^6.0.10",
    "jsonwebtoken": "^9.0.2",
    "dayjs": "^1.11.13",
    "mongodb": "^6.16.0",
    "next": "15.3.1",
    "next-cloudinary": "^6.16.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-icons": "^5.5.0",
    "react-toastify": "^11.0.5",
    "zod": "^3.24.3"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "tailwindcss": "^4"
  }

---

## 🚀 Deployment
Deploy easily with Vercel or Brimble

Ensure all required .env values are configured

Allow IP access in MongoDB Atlas for production domain or all 
