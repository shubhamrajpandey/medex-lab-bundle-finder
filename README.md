# MedEx Lab Test Bundle Finder

## 1. Overview
MedEx Lab Test Bundle Finder is a full-stack web application that helps patients find the most cost-effective combination of laboratory tests and health packages. Given an arbitrary selection of diagnostic tests, the engine calculates the cheapest combination of bundle packages and standalone tests to cover all selections, automatically applying package discounts and showing any bonus tests included.

## 2. Tech Stack & Project Structure

- **Backend**: Node.js (v24), TypeScript, Express 5, Vitest, tsx.
- **Frontend**: React 19, TypeScript, Vite, ESLint, Vanilla CSS (custom responsive design system, mobile-first down to 375px).

```text
medex-lab-bundle-finder/
├── backend/
│   ├── data/
│   │   └── lab-catalog.json              # Canonical laboratory catalog & expected examples
│   ├── src/
│   │   ├── common/                       # Shared errors, logger, Express middlewares
│   │   ├── config/                       # Environment configuration (loadEnv)
│   │   ├── modules/
│   │   │   ├── catalog/                  # Catalog loader, sanitizer, repository, controller, routes
│   │   │   └── plan/                     # Bundle optimization engine
│   │   │       ├── domain/               # Pure algorithmic solver & tie-breaker comparator
│   │   │       ├── plan.controller.ts
│   │   │       ├── plan.validator.ts
│   │   │       ├── plan.service.ts
│   │   │       └── plan.routes.ts
│   │   ├── app.ts                        # Express application factory
│   │   └── main.ts                       # Entry point and bootstrap
│   ├── test/
│   │   └── integration/                  # API integration tests & exact catalog example replays
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/                   # TestSelector, SelectedChips, PlanSummary, PlanItemCard, Header
│   │   ├── hooks/                        # useCatalog, usePlanCalculator (with race-condition guards)
│   │   ├── services/                     # API client & plain-language error translator
│   │   ├── types/                        # TypeScript DTOs and view models
│   │   ├── App.tsx
│   │   └── App.css                       # Responsive layout styles
│   ├── index.html
│   ├── vite.config.ts                    # Dev server & /api proxy to backend
│   └── package.json
└── README.md
```

## 3. How to Run

### Prerequisites
- Node.js >= 20.x (tested on Node.js v24)
- npm >= 10.x

### Installation
Install dependencies in both workspaces:
```bash
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### Running the Services
1. **Backend**:
```bash
cd backend
npm run dev      # Runs with tsx watch on http://localhost:3001
# Or for production:
npm run build && npm start
```

2. **Frontend**:
```bash
cd frontend
npm run dev      # Runs Vite dev server on http://localhost:5173
```
Open your browser at `http://localhost:5173`. The Vite dev server proxies all `/api` requests directly to `http://localhost:3001`.

### Running Tests, Typechecks, and Lints
```bash
# Backend unit & integration tests (Vitest)
npm --prefix backend test

# Backend TypeScript compilation check
npm --prefix backend run build

# Frontend linting (ESLint)
npm --prefix frontend run lint

# Frontend production build
npm --prefix frontend run build
```

### Environment Variables
Configured in `backend/src/config/env.ts`:
| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP server port | `3001` |
| `NODE_ENV` | Runtime environment (`development`, `production`, `test`) | `development` |
| `CATALOG_PATH` | Absolute or relative path to the catalog JSON file | `backend/data/lab-catalog.json` |
| `CORS_ORIGIN` | Allowed CORS origins (CORS middleware enabled) | `*` (all origins) |

## 4. API Specification

### `GET /api/tests`
Returns all active, selectable tests (`status === true`). Tests with `price: null` are included because they can be requested as part of a package. Inactive tests (e.g. `T19`) are excluded.
- **Response `200 OK`**:
```json
[
  {
    "id": "T01",
    "code": "CBC",
    "name": "Complete Blood Count",
    "price": 250,
    "status": true
  }
]
```

### `GET /api/packages`
Returns all active, usable packages (`status === true`). Inactive packages (e.g. `P10`) are excluded. Nonexistent test IDs (`T99`) and duplicate test IDs are sanitized.
- **Response `200 OK`**:
```json
[
  {
    "id": "P01",
    "name": "Diabetes Basic",
    "price": 500,
    "testIds": ["T02", "T03"],
    "status": true
  }
]
```

### `POST /api/plan`
Calculates the optimal, lowest-cost plan covering every requested test.
- **Request Body**:
```json
{
  "testIds": ["T02", "T03", "T04", "T06"]
}
```
- **Response `200 OK`**:
```json
{
  "items": [
    {
      "type": "package",
      "id": "P02",
      "name": "Diabetes Plus",
      "price": 1500,
      "covers": ["T02", "T03", "T04", "T06"]
    }
  ],
  "total": 1500,
  "extraTests": [],
  "individualTotal": 1820,
  "savings": 320
}
```

### Error Responses
All error responses return the consistent JSON shape `{ "error": CODE, "testIds": [...] }`.

1. **`EMPTY_SELECTION` (HTTP 400)**: Missing, non-array, or empty `testIds`.
```json
// POST /api/plan with { "testIds": [] }
{
  "error": "EMPTY_SELECTION",
  "testIds": []
}
```

2. **`INVALID_TESTS` (HTTP 400)**: Unknown test IDs, non-string IDs, or inactive test IDs.
```json
// POST /api/plan with { "testIds": ["T01", "T19", "T99", 123] }
{
  "error": "INVALID_TESTS",
  "testIds": ["T19", "T99", "123"]
}
```

3. **`NOT_AVAILABLE` (HTTP 422)**: Requested tests that cannot be obtained (e.g., test has `price: null` and is not part of any active package).
```json
// When an unpriced test has no active package covering it
{
  "error": "NOT_AVAILABLE",
  "testIds": ["T16_ORPHAN"]
}
```

## 5. How the Solver Works and WHY

The bundle optimization problem is a variant of the **Weighted Set Cover** problem (an NP-hard combinatorial optimization problem). Because real-world clinical catalogs feature a modest number of candidate packages, an exact **Branch and Bound** search guarantees the mathematically optimal lowest price without heuristics.

### Algorithmic Strategy
1. **Filtering Relevant Packages**: Usable packages (`status === true`) that do not cover at least one requested test are filtered out upfront, reducing search space.
2. **Branch and Bound Exploration**:
   - The algorithm branches on package inclusion.
   - **Pruning**: If the cumulative package cost of the current branch already equals or exceeds the best total cost found so far, the branch is immediately pruned.
   - **Base Evaluation**: For any combination of packages, any requested tests not covered by the packages must be purchased individually. If any uncovered test has `price: null`, that branch is invalid and discarded.
3. **Deterministic Tie-Breaking Hierarchy**:
   When candidate plans achieve identical total prices, ties are broken strictly according to MedEx business rules:
   1. Lowest total price.
   2. Fewer items (combining packages and standalone tests).
   3. Fewer extra tests (unrequested bonus tests included in packages).
   4. Lexicographically smaller list of item IDs (sorted alphabetically).
   This hierarchy is isolated in [`plan-comparator.ts`](backend/src/modules/plan/domain/plan-comparator.ts).
4. **Covers Allocation**:
   Each selected test is credited to exactly one item. When two packages in the plan cover the same selected test, the item with the smaller ID receives the credit in its `covers` array, preserving the patient's selection order.

## 6. Performance & Scalability

### Measured Performance
On an Apple Silicon machine (macOS, Node 24), HTTP `POST /api/plan` with all 19 selectable tests selected:
- **Average HTTP latency**: 3.71 ms
- **Maximum HTTP latency**: 5.95 ms
- **Pure solver execution time**: 4.50 ms
This easily exceeds the 300 ms SLA requirement by a factor of 50x.

### Scaling to 40 Packages
With 13 packages ($2^{13} = 8,192$ combinations in the absolute worst case), the search takes under 5 ms even before branch pruning.
With 40 packages ($2^{40} \approx 10^{12}$ combinations):
- **Why Branch & Bound still performs well in practice**: Most packages do not cover any requested tests and are filtered upfront. Branch pruning quickly cuts off branches once a viable individual or small-package baseline is found.
- **Worst-case risk**: If many overlapping, similarly-priced packages exist, the search tree can degrade toward exponential runtime.
- **Next Steps / Production Roadmap**:
  - Implement dynamic programming over a bitmask of the selected tests. Since a customer typically selects $k \le 15$ tests, the state space is $2^k \le 32,768$ states, solving in $O(M \cdot 2^k)$ where $M$ is the number of packages.
  - Add in-memory LRU caching or Redis memoization keyed by sorted selected test IDs.

## 7. Catalog Mistakes & Handling

The raw catalog `data/lab-catalog.json` contains intentional real-world data discrepancies. The catalog sanitizer (`backend/src/modules/catalog/catalog.sanitizer.ts`) handles and logs each at application startup:
1. **P06 lists `T02` twice**: De-duplicated; P06's `testIds` retains only a single `T02`.
2. **P12 lists unknown `T99`**: Nonexistent test ID is stripped from P12's `testIds`.
3. **P10 is inactive (`status: false`)**: Filtered out and excluded from `usablePackages`.
4. **T19 is inactive (`status: false`)**: Excluded from `selectableTests`. Requesting it triggers `400 INVALID_TESTS`.
5. **T15 has `price: null`**: Allowed in catalog; can only be acquired via package `P08`. Requesting it standalone returns `P08` with `individualTotal: null` and `savings: null`.

## 8. Assumptions & Decisions

1. **Test Assignment in "covers"**:
   Every selected test appears in the `covers` array of exactly one plan item. If two chosen packages overlap, the package with the alphabetically smaller ID is credited with the test. Tests appear in user-selection order.
2. **Malformed Requests**:
   Malformed JSON bodies (triggering Express body-parser `SyntaxError`) return a clean HTTP 400 `EMPTY_SELECTION`. Arrays with non-string elements (e.g. `[123, null]`) return HTTP 400 `INVALID_TESTS` listing the non-string values stringified.
3. **Inclusion of `price: null` Tests in `GET /api/tests`**:
   Tests with null prices (such as `T15`) are selectable diagnostic options that medical centers offer exclusively inside packages. They are returned in `GET /api/tests` so customers can select them, and the bundle calculator finds the package that provides them.

## 9. Testing Strategy

The test suite is built on Vitest and covers:
- **Sanitizer tests** (`catalog.sanitizer.test.ts`): Verifies filtering inactive tests/packages, de-duplicating test IDs, and stripping nonexistent IDs.
- **Validator tests** (`plan.validator.test.ts`): Verifies 400 EMPTY_SELECTION, 400 INVALID_TESTS (unknown, inactive, and non-string types), 422 NOT_AVAILABLE, and deduplication of input IDs.
- **Comparator & Tie-Breaking tests** (`plan-solver.test.ts`): Verifies all 4 tie-breaking levels (price, item count, extra tests, alphabetical ID).
- **Exact Catalog Replays** (`plan.examples.test.ts`): Loads raw `lab-catalog.json` and asserts deep equality against every example (`Example 1`, `Example 2`, `Example 3`).
- **Integration API tests** (`catalog.api.test.ts`): Verifies endpoint status codes, response contracts, and 404 fallbacks.

## 10. Limitations & Future Improvements

1. **Bitmask Dynamic Programming**: For enterprise catalogs with >100 packages, replace the branch-and-bound recursion with a bitmask DP to guarantee sub-millisecond polynomial bounds regardless of catalog structure.
2. **End-to-End Testing**: Add Playwright integration tests testing the live React UI search input, chip removal, and responsive layout across mobile and desktop viewport sizes.
3. **Telemetry & Observability**: Add structured request logging (e.g., OpenTelemetry or Pino) to monitor solver latency percentiles in production.

## 11. AI Usage

Antigravity (Google DeepMind) was used during this project to assist with project scaffolding, initial boilerplate generation, unit test case creation, UI component structuring, and generating this README. I fully understand and can explain every architectural decision and line of code during the interview.

*Candidate note: [Reviewed by Shubham Raj Pandey]*
