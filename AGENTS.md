# QuantumRig Codebase Guidelines

## Purpose & Goals
QuantumRig is a full-stack e-commerce platform and custom PC building tool ("By Gamers, For Gamers"). The primary goals of the application are:
1.  **Immersive E-commerce:** Provide a sleek, fast catalog for buying PC components.
2.  **Interactive PC Builder:** Supply an intuitive part-selection pipeline that allows users to assemble compatible computer parts based on categories.
3.  **User Ownership:** Manage robust user state including carts, saved products, viewable active/past orders, and printable order receipts.
4.  **Admin Control:** Manage products, inventory limits, discount coupons, and order lifecycles via a central admin dashboard.

## Critical Files & Architecture
-   **`server.ts`:** The single-file Express backend. It houses all RESTful `/api/*` endpoints (authentication, products, orders, user profiles, coupons) and the in-memory persistence data arrays.
-   **`src/store.ts`:** The central client-side Zustand store. It manages active UI states, including the `builderCart` (PC builder state), user sessions, shopping cart, and catalog data fetching.
-   **`src/types.ts`:** The domain schema source-of-truth. Every new data field (e.g., `brand`, `specs`, `stockStatus`, `inventoryCount`) must be defined here before being implemented.
-   **`src/pages/Builder.tsx`:** The core structural pipeline of the app, organizing parts into an assembly list.
-   **`src/pages/admin/`**: A suite of tabbed views for managing the store's backend capabilities.
-   **`src/lib/api.ts`:** The sole mechanism for standardizing frontend layout API interactions and handling HTTP errors.

## Visual Identity & Design System
Maintain a clean, technical, high-contrast aesthetic modeled after standard Tailwind tokens present in the codebase:

-   **Color Palette:**
    -   **Surfaces:** Utilize the `slate` scale heavily (`bg-slate-50` for light components, `slate-800/900` for deep backgrounds and text).
    -   **Primary Accents:** `indigo` (`indigo-600`, `indigo-500`) mapped to calls to action, active navigation elements, and energetic gradients (paired with `cyan-400`).
    -   **System Logic:** Status indicators use literal colors: `rose` (Out of stock / Warnings / Destructive), `emerald` (In stock / Success), and `amber` (Low stock).
-   **Typography:**
    -   Standard sans-serif for standard UI (buttons, paragraphs, general titles) utilizing deep spacing (`tracking-tight`).
    -   `font-mono` is reserved exclusively for technical specs (e.g., `Cores: 24`, `DDR5`), hardware metadata, and technical badging (e.g., "By Gamers, For Gamers" overlines).
-   **Component Patterns:**
    -   Layouts are securely contained within `max-w-7xl mx-auto` boundary boxes.
    -   Container styles prefer neat, structured borders (`border-slate-200`) and soft radiuses (`rounded-xl`, `rounded-2xl`).
-   **Copy & Content:** Use literal configurations. Call to actions should state exactly what they do ("Print Receipt", "Add to cart", "Save").

## Core Logic Principles
-   **Start with Real Content:** Pull terms and labels directly from the `Project` or `Order` interfaces inside `src/types.ts`.
-   **Dual-Layer Data:** Client-UI always dispatches changes via the Zustand store (`src/store.ts`), syncing explicitly with the REST API housed in `server.ts`. Assume this full-stack architecture for data management.
