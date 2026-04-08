# Sportlytics 🚀

Elite Amateur Performance Analytics Platform.

**Live Link**: [Deploy on Vercel to get your link]

## 🌐 Deployment
This project is production-ready and configured for **Vercel**. 

To go live:
1. Import this repo into Vercel.
2. Add `MONGO_URI` and `JWT_SECRET` to Environment Variables.
3. Deploy!

## 📊 Core Features

### 📊 Digital Scorecard & Performance Analytics
- **Dynamic Sport Schemas:** Logs detailed, sport-specific context (e.g., Strike Rate in Cricket, Pass Accuracy in Football, Serve % in Tennis, Pace in Running).
- **Efficiency Scoring:** Automatically translates raw inputs and effort limits into an evolving platform-wide Efficiency Score algorithm.
- **Analytics Dashboard:** Visualizes win rates, sport-breakdowns, and trends using Chart.js.

### 🏆 Gamification & Progression
- **Achievement Engine:** 10+ milestone badges automatically awarded triggered on backend log events (First Blood, Centurion, Multi-Sport Elite, etc.)
- **Goal Tracking:** Users can create custom progress-bar goals (e.g., "Score 10 goals", "Burn 2000 calories") attached to incoming scorecard data.
- **Global Leaderboards:** Filter performance records by specific sports or overall rankings.

### 👥 Team Management & Social Play
- **Club Ecosystem:** Generate teams, securely join via auto-generated invite codes, organize rosters, and inherit captaincy protocols.
- **Head-to-Head Compare:** Live search through the registered athlete database to mount their statistics directly beside yours via visual progress bars.
- **Pro Benchmark Gateway:** Connects to *TheSportsDB API* to find professional global athletes, comparing real-world metadata immediately.

### 📤 Career Pathways & Portfolios
- **Professional Scout Report Mode:** Renders a clean, tactical data breakdown of any player, optimized exclusively into a printable PDF layout for managers.
- **Social Portfolios:** Exportable HTML5-rendered `<canvas>` images representing personal statistical player cards formatted perfectly for social media sharing.
- **Public API Routing:** Built-in public endpoint paths that generate shareable digital athlete CVs.

---

## 🛠️ Technology Stack

**Frontend (Client)**
- Vanilla HTML5 / JavaScript / CSS3
- TailwindCSS (Styling & Layout framework)
- Chart.js (Data Visualization)
- HTML Canvas API (Image generation)

**Backend (Server)**
- Node.js & Express.js
- MongoDB & Mongoose (Database & ORM)
- JSON Web Tokens (JWT Session Auth)
- Bcryptjs (Cryptographic password hashing)
- Nodemailer (Forgot Password / SMTP triggers)

**Testing**
- Jest / Supertest / Mongo-Memory-Server

---

## 🚀 Local Installation & Usage

### 1. Prerequisites
- [Node.js](https://nodejs.org/en/) (v14 or higher)
- [MongoDB](https://www.mongodb.com/try/download/community) (Running locally, or a MongoDB Atlas URI)

### 2. Clone the Repository
```bash
git clone https://github.com/Rajommkar/Sportlytics.git
cd Sportlytics
```

### 3. Backend Setup
Navigate into the backend directory and install all node packages.
```bash
cd Backend
npm install
```

Create a `.env` file in the `Backend` directory containing the following:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/sportlytics
JWT_SECRET=your_super_secret_key_here
```

Start the backend server:
```bash
# Starts using nodemon for development
npm run dev 
```

### 4. Frontend Setup
Because the frontend utilizes modern JS modules and fetches, it requires a local web server (running it directly as `file://` may trigger CORS/security blocks). 
You can use the VS Code extension **Live Server**, or spin up a simple python/node static server pointing at the `/Frontend` directory.

```bash
# Example if you have serve installed globally:
npx serve ./Frontend -p 5500
```
Navigate to `http://localhost:5500` in your browser.

### 5. Running Tests
The backend features an isolated `auth.test.js` configuration.
```bash
cd Backend
npm test
```

---

## 🔒 Security Practices Configured
*   **Rate Limiting:** IP-locking implemented across memory to prevent brute force auth attacks.
*   **Hashing & Salting:** Passwords exclusively saved utilizing bcrypt.
*   **Protective Middleware:** Deep API routes encapsulated behind `auth.js` middleware requiring strict, non-expired JWTs. 
*   **Sanitization:** Registration and login endpoints automatically trim, format, and enforce input limits.

---
*Developed by Rajommkar • Kinetic Precision*
