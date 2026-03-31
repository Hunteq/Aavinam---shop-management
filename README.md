# Aavinam - Dairy & Juice Shop Management System

**Aavinam** is a premium, state-of-the-art Progressive Web Application (PWA) designed to streamline the operations of dairy and juice shops. It offers a sophisticated, glassmorphism-inspired interface with deep performance analytics and real-time stock management.

---

## 🌟 Key Features

### 📦 Stock Control System
- **Real-time Tracking**: Monitor refrigeration levels and milk volumes in real-time.
- **Scheduled Checks**: Staff record stock levels at defined checkpoints (Opening, Hourly, Closing).
- **Automated Summary**: Daily stock summaries calculating opening, fresh additions, sales, and current balance.

### 💰 Financial & Sales Management
- **Revenue Tracking**: Monitor daily sales across Dairy and Juice categories.
- **Expense Logging**: Record and categorize business expenses (Rent, Electricity, Salary, etc.).
- **Net Profit Calculation**: Automatic estimation of net profit based on revenue and recorded expenses.
- **Cash Audit**: Physical cash verification system to track shortages or excess collections.

### 📊 Reports & Analytics
- **Visual Insights**: Dynamic charts for revenue distribution and category performance.
- **Period Summaries**: View stats for Today, Yesterday, Last 7 Days, This Month, or Custom Ranges.
- **Professional Exports**: Generate and download Analysis PDFs or CSV data for accounting.
- **Secure Sharing**: Integrated sharing capabilities for administrators.

### 🌎 Multi-Language Support
- **Full Localization**: Seamlessly switch between **English, Tamil, and Hindi**.
- **Dynamic Content**: All UI labels, warnings, and messages are translated to ensure staff accessibility.

### 📱 Premium PWA Experience
- **Installation Card**: Sleek, bottom-sheet style installation prompt for Android, iOS, and Desktop.
- **iOS Guidance**: Custom visual instructions for Safari/iOS users.
- **Offline Capable**: Reliable performance even with intermittent connectivity.
- **Glassmorphism UI**: High-end design with backdrop blurs, gradients, and smooth transitions.

---

## 🛠️ Technology Stack

- **Frontend**: React 18 with Vite
- **Styling**: Vanilla CSS with modern Design Tokens
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Utility**: [date-fns](https://date-fns.org/) for precise time management
- **Storage**: Highly optimized browser local storage with activity logging
- **PWA**: `vite-plugin-pwa` for service worker management and caching

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd dairy-shop
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

---

## 🔒 Security & Data
Aavinam prioritizes data privacy. All operational data (Products, Logs, Financials) is stored locally in the browser's storage, ensuring physical control over business information. The system includes:
- **Admin-only Access**: Protected routes for sensitive financial and staff management.
- **Audit Trails**: Immutable logs for every system operation and user activity.
- **Data Backup**: One-click full system backup (JSON) and recovery.

---

*Designed and Built by Antigravity*
