# 📦 MINI APP

_A fullstack web application built with **Next.js**, **MongoDB Atlas**, and **Cloudinary** for seamless user and media management._

---

## 🚀 Tech Stack

- **Frontend:** Next.js (App Router or Pages Router)
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

## ⚙️ Configure .env

MONGODB_URI=your_mongodb_atlas_connection_string

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name

CLOUDINARY_API_KEY=your_api_key

CLOUDINARY_API_SECRET=your_api_secret

JWT_SECRET=your_jwt_secret

---

## 🚀 Deployment
Deploy easily with Vercel or Brimble

Ensure all required .env values are configured

Allow IP access in MongoDB Atlas for production domain or all 
