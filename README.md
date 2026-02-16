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
│   ├── Resume_TonyKooYeLong.pdf - Current resume
│   └── BT4221_Group2_Final_Project_Report.pdf - Academic project report
├── README.md - This file
└── _config.yml - Jekyll configuration for GitHub Pages
```

## Features

### Interactive Portfolio
- 🎯 **Portfolio Filtering**: Filter projects by category (All, Applications, ML, Achievements)
- 🔍 **Real-time Search**: Full-text search across all sections with fuzzy matching
- 📊 **Dynamic Content**: Smooth animations and transitions between sections
- 🎨 **3D Effects**: Portfolio cards with mousemove tilt tracking

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
3. **Resume**: Education, experience, and skills with scroll animations
4. **Portfolio**: Filterable project showcase with 3 current projects
5. **Contact**: Links to GitHub, LinkedIn, email, and mobile

## Known Issues

### 🔴 High Priority
- [ ] **LinkedIn link broken**: Currently shows "-Maintenance-" instead of actual profile URL (line 201-202 in index.html)
- [ ] **PSL education dates incorrect**: Shows "Jul 26 - Dec 26" (future dates) instead of "Jul 24 - Dec 24" (line 314 in index.html)
- [ ] **Limited portfolio projects**: Only 3 projects displayed (target: 6-8 for competitive fintech roles)
- [ ] **Missing GitHub links**: Self-Reflective RL project and Smoodee lack GitHub repository links
- [ ] **Git cleanup needed**: Deletion of Resume_ValaryLim.pdf is staged but not committed

### 🟡 Medium Priority
- [ ] **No Testimonials section**: Missing social proof from colleagues/managers/professors
- [ ] **No Technical Writing section**: No showcase of blog posts, articles, or research papers
- [ ] **No Certifications section**: Missing display of credentials (CFA, certifications, awards)
- [ ] **Project descriptions too brief**: Portfolio items only have 1-2 sentence descriptions lacking technical depth
- [ ] **Missing project architecture details**: No information on tech stack, challenges, or solutions
- [ ] **No live demo links**: Projects lack links to deployed applications or demos

### 🟢 Low Priority
- [ ] **ATS keyword optimization**: Could enhance keyword density for applicant tracking systems
- [ ] **Missing project case studies**: No detailed write-ups or deep-dive pages
- [ ] **No analytics tracking**: No Google Analytics or similar for visitor insights
- [ ] **Portfolio images optimization**: Some images could be converted to WebP for better performance
- [ ] **No PWA features**: Could add progressive web app capabilities for offline access

## Planned Enhancements

### Portfolio Expansion (Target: 6-8 Projects)
**Projects with existing assets ready to add:**
1. **BT4221 - Advanced Analytics Project** (PDF report exists in /files, image exists)
2. **FairTracker Application** (image exists: FairTracker_Map.png)
3. **WelfareHome Website** (image exists: WelfareHome_Website.png)

**Recommended new projects to showcase quant finance expertise:**
4. **Yield Curve Construction Models** (Nelson-Siegel, Svensson - from Tradition internship)
5. **Options Pricing Calculator** (Black-Scholes with Greeks visualization)
6. **Financial Time Series Analysis** (ARIMA/GARCH modeling)

### New Sections to Add
1. **Testimonials**: Quotes from managers, colleagues, and professors with photos/logos
2. **Technical Writing**: Links to Medium articles, blog posts, research papers, GitHub Gists
3. **Certifications**: Display credentials including:
   - CFA Level I Candidate (in progress)
   - University Engineering Scholar (NUS)
   - Online courses (Coursera, DataCamp, etc.)

### Content Optimization for Target Roles
**Target positions**: Fintech Developer, Quantitative Analyst, Data Scientist, ML Engineer

**Enhancements:**
- Emphasize quantitative skills (stochastic calculus, derivatives pricing, market microstructure)
- Highlight domain expertise (fixed income analytics, algorithmic trading, HFT)
- Add ATS keywords naturally throughout content
- Showcase statistical modeling and financial analytics projects
- Create Technical Expertise subsection in Resume with skill categorization

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
- **Last major update**: [Date of last commit]
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
- **LinkedIn**: [To be added after profile optimization]
- **Website**: https://lmdlifers.github.io/TonyKoo/

---

**Last Updated**: 2026-02-16
**Version**: 1.0 (Pre-enhancement)
**Status**: Active Development - Major enhancements in progress

