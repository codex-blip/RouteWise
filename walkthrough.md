# RouteWise Integration Walkthrough: Next.js + Clerk Auth

This walkthrough details the step-by-step changes made to integrate the RouteWise landing page, sign-in, and sign-up flows using **Clerk** authentication.

---

## 🛠️ Step-by-Step Integration Details

### Step 1: Install Dependencies
We installed the Clerk Next.js SDK along with components for the 3D globe and icon sets:
```bash
npm install @clerk/nextjs axios lucide-react react-globe.gl three --legacy-peer-deps
```
*Note: The `--legacy-peer-deps` flag was used to ensure compatibility between Next.js 14 and the latest Clerk packages.*

### Step 2: Global Configuration Changes
1. **Root Layout** ([layout.tsx](file:///d:/RouteWise/app/frontend/app/layout.tsx)):
   * Imported `ClerkProvider` from `@clerk/nextjs` and `AuthProvider` from `@/context/AuthContext`.
   * Wrapped the `<html>` and `<body>` tags in `ClerkProvider` to make session context available globally.
   * Wrapped children in `AuthProvider` for the bridged auth session.
2. **Next.js Config** ([next.config.js](file:///d:/RouteWise/app/frontend/next.config.js)):
   * Added `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` to the `env` object to explicitly expose it to the browser.
3. **Global Styles** ([globals.css](file:///d:/RouteWise/app/frontend/app/globals.css)):
   * Appended custom fonts, color variables, typewriter elements, and buttons matching the dark RouteWise theme.
   * Overrode `html, body { overflow: hidden; }` so that the landing, signup, and signin pages scroll naturally.
   * Renamed the keyframe pulse animation to `pulse-neon` to avoid name collisions with Mapbox markers.

### Step 3: Auth Bridge Context & Axios API Client
1. **Axios Client** ([lib/api.ts](file:///d:/RouteWise/app/frontend/lib/api.ts)):
   * Created an Axios instance configured with `NEXT_PUBLIC_API_URL` as its `baseURL`.
2. **Bridged Auth Context** ([context/AuthContext.tsx](file:///d:/RouteWise/app/frontend/context/AuthContext.tsx)):
   * Created a bridge mapping the application's legacy context values to Clerk's React hooks (`useUser`, `useClerk`, `useSignIn`, `useSignUp`).
   * This ensures any existing frontend components calling `useAuth()` continue to retrieve current user roles and log out states correctly.

### Step 4: UI Shell & Globe Components
1. **3D Visual Globe** ([components/RouteGlobe.tsx](file:///d:/RouteWise/app/frontend/components/RouteGlobe.tsx)):
   * Renders a custom WebGL 3D globe using Three.js and `react-globe.gl` showing arcs connecting international cities.
2. **Auth Page Shell** ([components/AuthLayout.tsx](file:///d:/RouteWise/app/frontend/components/AuthLayout.tsx)):
   * Houses the rotating globe on one side, and sign-in/sign-up forms on the other.
3. **Navbar Header** ([components/Navbar.tsx](file:///d:/RouteWise/app/frontend/components/Navbar.tsx)):
   * Adapts links to direct users to the `/main` application.
   * Shows a **Launch App** / **Logout** button if the user is authenticated, or **Sign In** / **Get Started** if they are anonymous.

### Step 5: Integration of Pages & Route Protection
1. **Main Landing Page** ([app/page.tsx](file:///d:/RouteWise/app/frontend/app/page.tsx)):
   * Replaced the simple landing page with the RouteWise visual bento-grid landing page.
2. **Sign In Page** ([app/signin/page.tsx](file:///d:/RouteWise/app/frontend/app/signin/page.tsx)):
   * Renders the custom sign-in page utilizing Clerk's `useSignIn` client SDK hook. Redirects to `/main` on completion.
3. **Sign Up Page** ([app/signup/page.tsx](file:///d:/RouteWise/app/frontend/app/signup/page.tsx)):
   * Renders the custom sign-up page utilizing Clerk's `useSignUp` hook.
   * Handles direct credentials creation and prompts the user inline for their **Email Verification Code (OTP)** if configured.
4. **App Protection on `/main`** ([app/main/page.tsx](file:///d:/RouteWise/app/frontend/app/main/page.tsx)):
   * Added validation checks to `HomePage` using `useAuth()`.
   * Unauthenticated requests are automatically redirected to `/signin`.
   * Shows an `"Authenticating..."` loading state while checking the user session.

---

## 🚀 How to Run and Verify Locally

### 1. Set Local Env Variables
Make sure your [frontend/.env.local](file:///d:/RouteWise/app/frontend/.env.local) has your Clerk credentials:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1Ijo...
```

### 2. Run the Servers
Start the Next.js development server:
```bash
cd frontend
npm run dev
```

### 3. Verification Steps
1. **Anon Access**: Open `http://localhost:3000/main` in your browser. Verify you are automatically redirected to `http://localhost:3000/signin`.
2. **Landing Page Navigation**: Open `http://localhost:3000/`. Verify the landing page loads, is scrollable, and displays the 3D rotating globe.
3. **Account Creation**: Click **Get Started** on the landing page, enter details, submit, and input the OTP code sent to your email.
4. **Application Redirect**: Verify that upon verifying the OTP code, you are successfully authenticated and redirected straight to `/main`.
5. **App Header Controls**: While on the map `/main`, verify clicking **Logout** redirects you back to the landing page `/` and revokes your Clerk session.

---

## 🌐 Production Deployment Guide

Follow these steps to deploy both the Next.js frontend and FastAPI backend.

### Step 1: Deploy your PostgreSQL Database
1. Set up a hosted PostgreSQL database (e.g., using **Supabase**, **Neon**, or **Render PostgreSQL**).
2. Copy the connection string. Make sure it supports async connections (changing the scheme prefix from `postgresql://` to `postgresql+asyncpg://`).

### Step 2: Deploy the FastAPI Backend (e.g., Render, Railway, or Fly.io)
1. Connect your git repository to your hosting provider.
2. Set the **Root Directory** to `backend`.
3. Set the **Build Command** to run migrations (optional but recommended):
   ```bash
   pip install -r requirements.txt && alembic upgrade head
   ```
4. Set the **Start Command**:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
5. Add the following **Environment Variables**:
   * `DATABASE_URL`: Set to your async PostgreSQL connection string (`postgresql+asyncpg://...`).
   * `MAPBOX_ACCESS_TOKEN`: Your Mapbox public access token.
   * `STRIPE_SECRET_KEY`: Your Stripe secret key (`sk_live_...` or `sk_test_...`).
   * `CORS_ORIGINS`: Set this to allow your production frontend domain (e.g., `["https://routewise.vercel.app"]`).

### Step 3: Configure Clerk for Production
1. Open your Clerk Dashboard and click **Deploy to Production** to obtain production API keys.
2. Go to **Configure > Paths** and set the paths for your production domain:
   * **Sign-in path**: `/signin`
   * **Sign-up path**: `/signup`
   * **After sign-in**: `/main`
   * **After sign-up**: `/main`

### Step 4: Deploy the Next.js Frontend (Vercel)
1. Create a new project on **Vercel** and connect your git repository.
2. Set the **Root Directory** to `frontend`.
3. Set the **Build Command** to `npm run build` (Next.js is auto-detected).
4. Add the following **Environment Variables**:
   * `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Your production Clerk Publishable Key.
   * `CLERK_SECRET_KEY`: Your production Clerk Secret Key.
   * `NEXT_PUBLIC_API_URL`: Set to your deployed FastAPI backend URL (e.g., `https://routewise-api.onrender.com`). Do NOT add a trailing slash.
   * `NEXT_PUBLIC_MAPBOX_TOKEN`: Your Mapbox access token.
   * `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key (`pk_live_...` or `pk_test_...`).
5. Click **Deploy**.

### Step 5: Test the Live App
Open your deployed Vercel URL, sign up, verify your account, and confirm that you are successfully redirected to `/main` which renders the Mapbox map and is connected to the live API!
