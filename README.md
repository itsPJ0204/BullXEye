# 🎯 BullXEye - Next-Gen Archery Training Platform

BullXEye is a comprehensive digital solution designed to bridge the gap between archery coaches and athletes. It streamlines academy management, attendance tracking, and performance analysis into a single, intuitive interface.

## 🚀 Key Features

### 👥 Role-Based Experience
- **Coaches**: distinct dashboard to manage academies, view student attendance, and monitor performance.
- **Archers**: Personal dashboard to track scores, view history, and manage academy memberships.

### 🏫 Academy Management
- **Create & Manage**: Coaches can create multiple academies with custom locations.
- **Seamless Joining**: Archers can join academies via unique invite codes.
- **Member Management**: Coaches can view and manage their roster; Archers can leave academies if needed.

### 📍 Smart Attendance System
- **Secure Code Check-in**: Coaches generate a unique 4-digit code that archers enter to mark themselves present.
- **Geolocation Verification**: Ensures athletes are physically present at the academy location during check-in.
- **Session Tracking**: Automatic calculation of session duration and history logging.

### 🏹 Advanced Digital Scoring
- **Visual Target Face**: Interactive SVG target for precise arrow plotting.
- **Arrow Identification**: specific tracking of individual arrows (1-12) to identify equipment inconsistencies.
- **Real-time Scoring**: Automatic score calculation (FITA standard) with X and M (Miss) support.
- **Magnifier Mode**: Precision input for close arrow grouping.
- **Score Cards**: Detailed end-by-end breakdowns with running totals.

### 📊 Performance Analytics
- **History**: detailed logs of past practice sessions.
- **Stats**: Track progress over distances and dates.

## 🛠️ Tech Stack
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend/Database**: Supabase (PostgreSQL + Auth)
- **Icons**: Lucide React

## 📦 Getting Started

1.  **Clone the repository**
    ```bash
    git clone https://github.com/itsPJ0204/BullXEye.git
    cd BullXEye
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env.local` file with your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

## 📱 Mobile First Design
Built with a responsive-first approach, ensuring a seamless experience on mobile devices for field use.
