# ⚡ Quick Start - One Click Launch!

## 🎯 Easiest Way to Start (Recommended)

### Windows Users:
**Just double-click one of these files:**
- 📄 **`start.bat`** - Simple batch file
- 📄 **`start.ps1`** - PowerShell script (prettier)

That's it! The dashboard will open automatically in your browser.

---

## 🌐 Access Your Dashboard

Once started (takes about 10 seconds):
- **Dashboard**: http://localhost:5173 (or 5174 if 5173 is busy)
- **API Status**: http://localhost:5000/api/key-stats

## 📊 Three Main Views

1. **Economic Data** - Real-time charts (Gold, S&P 500, Oil)
2. **Economic Calendar** - USD indicators (NFP, CPI, GDP, etc.) with history
3. **Market News** - Financial news with sentiment analysis

## 🔑 API Keys Configured

Your system has **2 API keys** with automatic rotation:
- Key #1: `paVf...GjRm`
- Key #2: `8c43...115f`

When one hits the rate limit, it automatically switches to the other!

## 🛑 How to Stop

Close the terminal windows, or run:
```powershell
Get-Process -Name node | Stop-Process -Force
```

---

## 📚 Alternative Methods

### Method 1: Command Line (from root folder)
```bash
npm run dev
```

### Method 2: Manual Start
**Terminal 1:**
```bash
cd server
node server.js
```

**Terminal 2:**
```bash
cd client  
npm run dev
```

---

## ⚙️ First Time Setup

If you haven't installed dependencies yet:
```bash
npm run install-all
```

---

## 🐛 Troubleshooting

### "Site can't be reached"
- Make sure both servers are running
- Check that frontend is on http://localhost:5173 or http://localhost:5174
- Wait 10 seconds after starting

### Port Already in Use
The startup scripts automatically kill old processes. If issues persist:
```powershell
# Kill all Node processes
Get-Process -Name node | Stop-Process -Force

# Then restart
./start.ps1
```

### Need to add more API keys?
Edit `.env` file and add:
```env
POLYGON_API_KEY_3=your_third_key_here
```

---

## 📖 Full Documentation

See `README.md` for complete features and documentation.
See `API_KEY_ROTATION.md` for API key management details.
