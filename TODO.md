# TODO: Cyberpunk Admin Dashboard for Student Nagari

## Information Gathered
- Project setup: React + Vite, Tailwind CSS with custom cyberpunk colors (neonblue, neonpurple, cyberbg, etc.), Recharts for charts, Lucide icons, Framer Motion for animations.
- Existing structure: Sidebar implemented with dark theme and purple accents, routing set up for all required pages.
- Current state: Most pages and components are empty or basic headings. Tailwind config has cyberpunk theme colors and shadows.
- Dependencies: All required libraries are installed (react-router-dom, recharts, lucide-react, framer-motion).

## Plan
### Core Components
- [x] Implement StatCard component with glassmorphism, neon glow, and responsive design.
- [x] Implement RevenueChart component using Recharts with cyberpunk styling.
- [x] Implement StudentChart component for line chart.
- [x] Implement PieChart component for course categories.
- [x] Implement ActivityHeatmap component.
- [x] Implement Navbar component with search, notifications, profile.

### Dashboard Page
- [x] Add stat cards: Total Students, Total Teachers, Total Courses, Active Live Classes, Monthly Revenue with growth indicators.
- [x] Add charts: Student growth line chart, Monthly revenue bar chart, Course categories pie chart, Activity heatmap.
- [x] Layout with grid system, responsive for desktop/tablet.

### Other Pages
- [x] Teachers Management: Add/Edit/Delete, assign courses, phone login, live access, earnings.
- [ ] Students Management: Free/Paid, course access, demo access, purchase history, progress.
- [ ] Courses Management: Create courses, upload videos/notes, pricing, free/paid.
- [ ] Live Classes: Schedule, assign teacher, start/stop, attendance, chat moderation.
- [ ] Payments: Transactions table, refund control, revenue analytics (Razorpay/Stripe style).
- [ ] Settings: General settings, admin roles & permissions.

### Styling & UX
- [x] Apply glassmorphism: backdrop-blur, semi-transparent backgrounds.
- [x] Neon glow accents: box-shadow with neon colors.
- [x] Soft gradients: linear gradients with cyberpunk colors.
- [x] Micro-interactions: hover effects, smooth animations with Framer Motion.
- [x] Responsive design: Mobile-first, tablet/desktop breakpoints.

## Dependent Files
- All components in src/components/
- All pages in src/pages/
- Tailwind config already has cyberpunk colors.

## Followup Steps
- [ ] Test responsiveness on different screen sizes.
- [ ] Add sample data for charts and tables.
- [ ] Implement form validations and CRUD operations (mock for now).
- [ ] Optimize performance with lazy loading if needed.
