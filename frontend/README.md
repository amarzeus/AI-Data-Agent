# AI-Data-Agent Frontend

A state-of-the-art React/TypeScript frontend for AI-powered Excel data analysis with neumorphic design, bento grid layout, 3D visualizations, and conversational AI interface.

## 🚀 Features

- **Neumorphic Design**: Premium tactile feel with soft shadows and gradients
- **Bento Grid Layout**: Modular, glanceable insights dashboard
- **Conversational AI Chat**: Natural language queries with in-chat artifacts
- **3D Visualizations**: Immersive data exploration with Three.js
- **Real-time AI Responses**: WebSocket-powered live updates
- **Dark/Light Themes**: Personalized visual experience
- **Drag-Drop Upload**: Seamless file handling
- **Mobile-First Responsive**: Works perfectly on all devices
- **PWA Ready**: Offline capabilities and app-like experience

## 🛠 Tech Stack

- **React 18** with TypeScript
- **MUI (Material-UI)** for component library
- **Framer Motion** for animations and micro-interactions
- **TanStack Query** for data fetching and caching
- **Three.js** + **Recharts** for 3D and 2D visualizations
- **React Router** for navigation
- **React Hook Form** for form handling
- **Axios** for API communication
- **Vite** for build tooling

## 📁 Project Structure

```
frontend/
├── public/
│   ├── favicon.ico
│   ├── manifest.json
│   └── assets/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   ├── chat/
│   │   ├── visualizations/
│   │   └── ui/
│   ├── contexts/
│   ├── hooks/
│   ├── services/
│   ├── theme/
│   ├── types/
│   ├── utils/
│   └── pages/
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## 🎯 Implementation Plan

### Phase 1: Foundation (Week 1)
- [x] Project setup with Vite, TypeScript, ESLint
- [x] MUI theme system with neumorphic styles
- [x] Basic bento grid layout structure
- [x] Dark/light theme context and provider

### Phase 2: Core Components (Week 2)
- [ ] Drag-drop file upload component
- [ ] Chat interface with message history
- [ ] In-chat artifact system (editable charts/tables)
- [ ] Intent shortcuts for query suggestions

### Phase 3: Visualizations (Week 3)
- [ ] 3D chart components with Three.js
- [ ] 2D chart components with Recharts
- [ ] Animation system with Framer Motion
- [ ] Playground area for data exploration

### Phase 4: Integration (Week 4)
- [ ] API integration with TanStack Query
- [ ] WebSocket for real-time updates
- [ ] Error handling and loading states
- [ ] Responsive design optimization

### Phase 5: Polish & Deploy (Week 5)
- [ ] Accessibility audit (WCAG AA)
- [ ] Performance optimization
- [ ] PWA implementation
- [ ] Testing and deployment

## 🔧 Development Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
npm run format       # Format code with Prettier

# Testing
npm run test         # Run tests
npm run test:ui      # Run UI tests
```

## 🎨 Design System

### Neumorphic Theme
- Soft shadows for depth
- Subtle gradients for premium feel
- Rounded corners and smooth transitions
- Consistent spacing and typography

### Color Palette
- **Primary**: Indigo-Purple gradient
- **Secondary**: Soft blues and grays
- **Accent**: Vibrant colors for highlights
- **Neutral**: Balanced grays for text and backgrounds

### Typography
- **Font Family**: Inter (clean, modern)
- **Scale**: Modular type scale for hierarchy
- **Weights**: 300, 400, 500, 600, 700

## 📱 Responsive Breakpoints

- **Mobile**: < 768px (single column, stacked layout)
- **Tablet**: 768px - 1024px (2-column layout)
- **Desktop**: > 1024px (full bento grid)

## 🔒 Security & Performance

- Input sanitization for chat queries
- Secure API communication
- Optimized bundle size (< 50MB)
- Lazy loading for components
- Service worker caching

## 🚀 Deployment

The app is configured for deployment to Vercel with:
- Automatic deployments on push
- CDN for static assets
- Environment variable management
- Performance monitoring

---

Built with ❤️ using modern React patterns and cutting-edge design trends.
