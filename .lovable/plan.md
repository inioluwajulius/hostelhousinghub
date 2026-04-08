## Full Build Plan — Hostel & Housing Hub

Based on your project document, here's everything I'll build:

### Phase 1: Database Schema
Create all tables from the document:
- **profiles** (linked to auth.users) — full_name, phone, role, university_id, matric_number, is_verified, is_student_verified, profile_photo_url
- **user_roles** — secure role management (student, host, admin)
- **universities** — name, short_name, state, city, latitude, longitude (pre-seeded with Nigerian universities)
- **properties** — host_id, university_id, title, description, address, lat/lng, distance, property_type, gender_restriction, amenities, etc.
- **rooms** — property_id, room_type, pricing, occupancy, photos
- **bookings** — student_id, room_id, property_id, dates, status, payment info
- **reviews** — booking_id, reviewer/reviewee, rating, comment, review_type
- **messages** — sender/receiver, booking_id, content, read_at
- **inspections** — student_id, property_id, scheduled_at, status
- **saved_listings** — user_id, property_id
- **notifications** — user_id, type, message, is_read
- All with proper RLS policies

### Phase 2: Authentication
- Sign up page (student vs host selection)
- Login page
- Auth context with role-based routing
- Student matric verification flow
- Password reset flow

### Phase 3: Student Features
- University-based search with real data
- Advanced filters (room type, price range, distance, amenities, gender)
- Map view showing listings near campus
- Listing detail page with booking flow
- Inspection scheduling
- Reviews (read & write)
- Saved listings / wishlist
- In-app messaging with host
- Student dashboard (bookings, messages, saved)

### Phase 4: Host Dashboard
- Property listing form (step-by-step with photos, rooms, pricing, rules)
- Availability calendar management
- Booking management (approve/decline)
- Earnings & analytics dashboard
- Messaging with students
- Verification status & badge

### Phase 5: Platform Features
- Notification system
- Roommate finder
- Community verification (upvote/flag listings)

This is a large build. I'll tackle it in order, starting with database → auth → core pages → dashboards.