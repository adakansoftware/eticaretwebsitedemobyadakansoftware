# Adakan Commerce Core Strengthening Plan

Saved on: 2026-05-17

## Goal

Move the project from a solid MVP foundation to a more production-ready e-commerce core.

## Priority Areas

### 1. Production Security

- Add rate limiting for login and register flows.
- Add CSRF protection for sensitive mutations.
- Add brute-force protection and lockout strategy.
- Add audit logs for admin actions.
- Tighten admin authorization beyond simple role checks where needed.
- Support session invalidation and device-based session visibility.

### 2. Real Admin Panel

- Product create, edit, delete flows.
- Category and brand management.
- Order status update flows.
- Inventory movement management screens.
- Customer detail pages.
- Banner and site settings editing UI.
- Coupon creation and tracking.

### 3. Checkout and Sales Flow

- Address CRUD for end users.
- Cargo/shipping integration layer.
- Coupon application in cart and checkout.
- Tax and shipping rules.
- Guest/user cart merge logic.
- Abandoned cart follow-up flow.
- Real payment integration such as iyzico or PayTR.

### 4. Performance and Scalability

- Add cache strategy for storefront data.
- Improve image handling and delivery.
- Optimize Prisma queries and page data loading.
- Add pagination, filtering, and sorting.
- Add stronger search capability.
- Introduce background jobs and queue-based workflows.
- Prepare indexing for larger catalogs.

### 5. User Experience

- Favorites / wishlist.
- Better variant selection UX.
- Reviews and ratings.
- Order tracking details.
- Mobile UX polish.
- Better loading, empty, and error states.
- Expand the design system for consistency.

### 6. Operational Quality

- Unit and integration test setup.
- End-to-end test coverage.
- Monitoring and alerting.
- Error tracking.
- Structured logging.
- CI/CD pipeline.
- Staging and production environment separation.
- Migration and seed discipline.

### 7. Commercial Growth Features

- Campaign and promotion engine.
- Multiple pricing strategies.
- B2B / B2C separation if needed.
- Dealer / wholesaler flows.
- Multi-language support.
- Multi-currency support.
- Invoice / e-archive integration.
- ERP, cargo, and marketplace integrations.

## First Recommended 10 Steps

1. Add address CRUD.
2. Build admin product CRUD.
3. Build admin order status management.
4. Add coupon usage flow.
5. Add login/register rate limiting.
6. Add structured error handling and logging.
7. Add test foundation for auth, cart, and checkout.
8. Add payment provider abstraction.
9. Add pagination and filtering to product/admin pages.
10. Add monitoring and deployment hardening.

## Resume Note

When we continue, we should turn this into:

- a phased roadmap,
- a 5-hour highest-impact execution plan,
- and then implement the first batch directly in code.
