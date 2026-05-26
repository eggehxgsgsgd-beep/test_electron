import React from 'react'
import ReactDOM from 'react-dom/client'

window.React = React
window.ReactDOM = ReactDOM

await import('./fd-ui.jsx')
await import('./fd-panels.jsx')
await import('./fd-insights.jsx')
await import('./focusdo-app.jsx')
