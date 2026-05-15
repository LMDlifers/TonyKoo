# Tony Koo - Portfolio Website

**Business Analytics & Quantitative Developer**
National University of Singapore

## Live Site
🌐 **https://lmdlifers.github.io/TonyKoo/**

## Overview
Single-page portfolio application showcasing quantitative finance, data science, and machine learning projects. Built with vanilla JavaScript, Bootstrap 4, and modern CSS animations to provide a professional, responsive experience for recruiters in fintech, quantitative finance, and data science roles.

## Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Frameworks**: Bootstrap 4.3.1, jQuery 3.4.1
- **Features**: Dark mode, portfolio filtering, full-text search, Intersection Observer animations
- **Fonts**: Karla (headers), Lato (body), Inconsolata (code blocks)
- **Libraries**: Fancybox 3.5.7 (lightbox), Typed.js (animation)

## Project Structure
```
TonyKoo/
├── index.html (536 lines) - Main single-page application
├── css/
│   └── style.css (1,904 lines) - Complete styling with dark mode
├── js/
│   ├── script.js (483 lines) - All interactive features
│   └── typed.min.js - Typing animation library
├── images/
│   ├── portfolio/ - Project screenshots
│   ├── education/ - Institution logos (NUS, Korea Univ, PSL, Temasek)
│   └── experience/ - Company logos (Tradition, Skezi)
├── files/
│   └── Resume_TonyKooYeLong.pdf - Current resume
├── README.md - This file
└── _config.yml - Jekyll configuration for GitHub Pages
```

## Features

### Interactive Portfolio
- 🎯 **Portfolio Filtering**: Filter projects by category (All, AI, Quant, Data, Apps, Research)
- 🔍 **Real-time Search**: Full-text search across all sections with fuzzy matching
- 📊 **Dynamic Content**: Smooth animations and transitions between sections
- 🛡️ **PII-Safe Project Summaries**: Raw group reports are excluded; public cards use sanitized descriptions.

### User Experience
- 🌓 **Dark Mode**: Toggle between light/dark themes with localStorage persistence
- 📱 **Fully Responsive**: Mobile-first design, optimized for all screen sizes
- 🚀 **Smooth Navigation**: Scroll-spy navigation with quick-jump sidebar
- ♿ **Accessibility**: WCAG AA compliant with ARIA labels and keyboard navigation
- 💫 **Scroll Animations**: Intersection Observer for performant fade-in effects
- 📈 **Progress Bar**: Visual scroll progress indicator at top of page

### Technical Features
- **Animated Hero**: Particle background with parallax scrolling header
- **Console-styled About**: macOS-style terminal window with JSON-formatted content
- **Search System**: Real-time search with debouncing and context snippets
- **Loading Screen**: 1.5s branded loading animation on initial page load
- **Back-to-top Button**: Animated button appears after scrolling

## Current Sections
1. **Hero**: Animated landing with typed rotating phrases
2. **About**: JSON-formatted personal info in terminal-style display
3. **Experience**: Education, technical expertise, and work experience
4. **Featured Projects**: Filterable, sanitized project showcase
5. **Testimonials**: Redacted/generalized testimonials without personal contact details
6. **Writing**: Sanitized case notes and research summaries
7. **Contact**: Links to GitHub, email, and updated resume

## Privacy Notes

- Raw group reports and recommendation letters are not published directly because they can contain academic identifiers,
  signatures, contact details, or other private metadata.
- Public project cards and report pages summarize architecture, methods, and outcomes without exposing collaborator
  details, reviewer details, private stakeholder details, internal screenshots, or raw data examples.
- The site keeps only the current resume in `files/` and avoids stale duplicate resume assets.

## Refresh Scope

- Added sanitized project cards for agentic healthcare analytics, judicial analytics, RentLock escrow dApp, and
  telepresence adoption research.
- Added paraphrased, portfolio-native report pages under `reports/` for the sanitized project writeups, including
  recreated diagrams, technical notes, and selected source trails where the original reports included references.
- Upgraded report pages with professional signal snapshots, visible keyword clusters, decision matrices, qualitative
  priority charts, and explicit reasoning notes for recruiter and AI-assisted review.
- Added curated figure galleries using light-background architecture recreations plus extracted report graphs and
  evaluation tables where they provide stronger evidence, while excluding full pages, raw submission metadata, private
  UI/account details, and third-party research-paper scans.
- Updated the resume asset and removed stale duplicate/raw report PDFs from the public `files/` directory.
- Replaced placeholder testimonials with generalized, PII-safe attributions.
- Removed placeholder LinkedIn/mobile links until verified public URLs are available.
- Tightened project claims so metrics are only used when backed by resume/source material.

## Performance Metrics
- **Loading Time**: ~1.5s (with branded loading screen)
- **Page Weight**: 19MB (mostly high-res images)
- **Code Size**: 2,923 lines (HTML + CSS + JS)
- **Animation Performance**: 60fps target for all transitions
- **Dark Mode**: localStorage cached for instant preference loading
- **Search Performance**: Real-time indexing on DOM load with 300ms debounce

## Browser Support
| Browser | Support Level |
|---------|---------------|
| Chrome/Edge | ✅ Full support |
| Firefox | ✅ Full support |
| Safari | ✅ Full support |
| Mobile Safari (iOS) | ✅ Full support |
| Chrome Mobile (Android) | ✅ Full support |
| IE 11 | ⚠️ Partial (no CSS Grid, animations degraded) |

## Responsive Breakpoints
- **Mobile**: < 576px (single column, sidebar hidden)
- **Tablet**: 576px - 768px (adjusted layouts)
- **Desktop**: 768px - 992px (multi-column layouts active)
- **Large Desktop**: 992px+ (full featured experience)

## Development Notes

### Architecture Decisions
- **Single-page application**: No routing required, smooth scroll navigation
- **Vanilla JavaScript**: No build process, framework-free for simplicity
- **Progressive enhancement**: Core content accessible without JavaScript
- **Mobile-first CSS**: Base styles for mobile, enhanced for larger screens

### Code Organization
- **HTML**: Semantic structure with ARIA labels for accessibility
- **CSS**: BEM-inspired naming, organized by section
- **JavaScript**: jQuery for DOM manipulation, vanilla JS for modern APIs (Intersection Observer)
- **Assets**: Organized by type (portfolio, education, experience)

### Performance Optimizations
- **CSS animations**: Use transforms instead of position changes
- **Debounced search**: 300ms delay to prevent excessive function calls
- **Lazy scroll**: Intersection Observer only animates elements in viewport
- **Local fonts**: Google Fonts loaded via CDN with font-display: swap

### Accessibility Features
- **ARIA labels**: All interactive elements properly labeled
- **Keyboard navigation**: Full site navigable without mouse
- **Focus indicators**: Visible focus states for all interactive elements
- **Semantic HTML**: Proper heading hierarchy and landmark roles
- **Color contrast**: Meets WCAG AA standards in both light and dark modes
- **Reduced motion**: Respects prefers-reduced-motion for users with vestibular disorders

## Git History
- **53 commits** total
- **Main branch**: main
- **Forked from**: ValaryLim's portfolio template
- **Last major update**: 2026-05-14
- **Repository**: https://github.com/LMDlifers/TonyKoo

## Credits & Attribution
- **Original template inspiration**: [ValaryLim](https://github.com/ValaryLim)
- **Design & development**: Tony Koo Ye Long
- **Icons**: Font Awesome (https://fontawesome.com)
- **Fonts**: Google Fonts (Karla, Lato, Inconsolata)
- **Lightbox**: Fancybox 3.5.7
- **Framework**: Bootstrap 4.3.1

## Future Technical Debt

### Potential Improvements
1. **Framework migration**: Consider React/Vue for better state management if site grows more complex
2. **Build process**: Add webpack/vite for bundling and optimization
3. **TypeScript**: Type safety for JavaScript codebase
4. **Unit tests**: Add Jest tests for search/filter functionality
5. **Backend API**: Consider headless CMS (Strapi, Contentful) for dynamic content management
6. **Image optimization**: Implement lazy loading and WebP format with fallbacks
7. **Service worker**: Add PWA capabilities for offline access
8. **Analytics**: Integrate Google Analytics or privacy-friendly alternatives
9. **A/B testing**: Test different layouts/content for optimization
10. **Internationalization**: Add i18n support for multiple languages

### Code Quality Improvements
- Add ESLint configuration for JavaScript linting
- Implement Prettier for consistent code formatting
- Add Stylelint for CSS best practices
- Consider CSS preprocessor (SASS/LESS) for better maintainability
- Extract inline styles to separate CSS classes
- Consolidate duplicate CSS rules
- Add code comments for complex logic sections

## Local Development

### Setup
```bash
# Clone the repository
git clone https://github.com/LMDlifers/TonyKoo.git

# Navigate to directory
cd TonyKoo

# Open in browser (no build process required)
open index.html
```

### Testing
```bash
# Serve locally with Python
python -m http.server 8000

# Or use Node.js http-server
npx http-server -p 8000

# Then visit http://localhost:8000
```

### Deployment
Site is deployed via GitHub Pages:
- **Repository**: LMDlifers/TonyKoo
- **Branch**: main
- **URL**: https://lmdlifers.github.io/TonyKoo/
- **Deploy method**: Automatic on push to main branch

## Contact
- **Email**: tonykooyelong@u.nus.edu
- **GitHub**: https://github.com/LMDlifers
- **Website**: https://lmdlifers.github.io/TonyKoo/

---

**Last Updated**: 2026-05-14
**Version**: 1.1 (PII-safe portfolio refresh)
**Status**: Active Development

