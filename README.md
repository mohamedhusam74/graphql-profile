# Reboot01 Profile Dashboard

A personal profile dashboard that displays my coding journey on the Reboot01
platform using its GraphQL API. Built as a single-page app with vanilla
JavaScript and hand-drawn SVG charts, styled as a navigator's logbook with a
light and a dark theme.

## Features

### Authentication
- JWT-based authentication against the Reboot01 sign-in endpoint
- Login with either username or email
- Token stored in memory for the session, never committed
- Clean sign-out that returns to the login screen

### Profile Display
- **Identity**: login, profile details, and join date
- **Experience**: total XP with animated counters
- **Projects passed**: count of completed projects
- **Audit ratio**: XP given vs received

### Data Visualizations
- **Cumulative XP**: line chart of XP earned over time
- **XP by project**: bar chart of XP per project
- **Pass / fail**: donut chart of project pass rate
- **Audits**: given vs received comparison
- **Skills**: radar chart of demonstrated skills

### Design
- Navigator's logbook aesthetic on a chart-paper background
- Light and dark ("night watch") themes with a toggle
- Smooth reveal-on-scroll and count-up animations
- Responsive layout for mobile and desktop
- All charts drawn as raw SVG, no chart library

## Project Structure

```
graphql/
├── index.html              Markup and the four folios
├── styles/
│   ├── tokens.css          Colors, type, and theme variables
│   ├── base.css            Layout and shared elements
│   ├── login.css           Sign-in screen
│   ├── dashboard.css       Profile folios
│   └── charts.css          Chart styles
├── src/
│   ├── main.js             Controller and entry point
│   ├── config.js           Endpoints and GraphQL queries
│   ├── auth.js             Sign in / sign out
│   ├── jwt.js              Token decoding
│   ├── api.js              GraphQL requests and data aggregation
│   ├── state.js            Shared state and theme
│   ├── ui/                 Section renderers (identity, experience, ...)
│   └── charts/             SVG chart renderers
└── README.md
```

## Technologies Used

- **Frontend**: Vanilla JavaScript (ES modules), HTML5, CSS3
- **Charts**: Hand-built SVG, no external library
- **Authentication**: JWT tokens with Bearer authentication
- **API**: GraphQL for all data
- **Build**: None — runs straight in the browser

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Valid Reboot01 credentials

### Running

1. Clone or download the project files
2. Serve the folder with any static server, for example:
   ```
   python3 -m http.server 8000
   ```
3. Open `http://localhost:8000` and sign in with your Reboot01 username or email

No build step is required — the app loads as plain ES modules.
