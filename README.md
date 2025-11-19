# Prompt Playground - Bookmarklet Marketplace

A marketplace for AI prompts delivered as one-click bookmarklets.

## 🚀 Concept

- **Users pay 99¢** to access the prompt library
- **Developers pay to sell** their prompts on the platform
- **Prompts are bookmarklets** - drag to bookmark bar, one-click to use
- Works with ChatGPT, Claude, and any AI chat interface

## 📁 Structure

```
/
├── index.html              # Landing page (public)
├── hub.html               # Main marketplace (paid access)
├── developer.html         # Developer portal
├── developer-dashboard.html # Manage submitted prompts
├── prompt-detail.html     # Individual prompt pages
├── how-it-works.html      # Tutorial/documentation
├── assets/
│   ├── css/
│   │   └── style.css      # Main stylesheet
│   ├── js/
│   │   ├── app.js         # Core functionality
│   │   ├── bookmarklets.js # Bookmarklet generator
│   │   └── auth.js        # Simple authentication
│   └── data/
│       └── prompts.json   # Prompt database
└── README.md              # This file
```

## 💰 Revenue Model

1. **User Entry Fee**: 99¢ via Ko-fi
2. **Developer Fees**: $29/month via PayPal
3. **Marketplace Cut**: 20% of prompt sales

## 🛠️ Tech Stack

- Pure HTML/CSS/JavaScript
- No backend required (initially)
- LocalStorage for user data
- JSON for prompt database
- GitHub Pages for hosting (FREE)

## 🔧 Setup

1. Clone repository
2. Open `index.html` in browser (or deploy to GitHub Pages)
3. Configure Ko-fi and PayPal links in settings

## 📝 License

Proprietary - All rights reserved
