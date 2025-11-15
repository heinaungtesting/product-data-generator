# MyApp - Multilingual Product Database

## Project Overview

MyApp is a Progressive Web Application (PWA) designed for drugstore staff to present health products to customers in both English and Japanese. The application serves local customers and international tourists, providing detailed product information, search capabilities, and multilingual support.

**Primary Use Cases:**
- Product catalog browsing for drugstore customers
- Bilingual product information (English/Japanese)
- Mobile-first experience for staff and customers
- Offline-capable PWA for reliable access
- Product search and filtering
- Product recommendations and comparisons

## Tech Stack

### Frontend
- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **UI Components:** React with TypeScript
- **State Management:** React hooks and context
- **Internationalization:** Next-intl or similar for EN/JP support

### Backend
- **API:** Next.js API Routes
- **Database ORM:** Prisma
- **Database:** SQLite (development/production)
- **Validation:** Zod or similar
- **Error Handling:** Custom error middleware

### Development & Deployment
- **Package Manager:** npm/yarn
- **Version Control:** Git/GitHub
- **Deployment:** Vercel or Railway
- **Environment:** Node.js 18+
- **Testing:** Jest, React Testing Library

### PWA Features
- Service Worker for offline support
- App manifest for installability
- Responsive design (mobile-first)
- Fast performance and caching

## Development Team Configuration

This project uses a **Full-Stack Development Team** approach with 5 specialized agents:

### 1. Frontend Developer
**Role:** React/Next.js Component Development  
**Responsibilities:**
- Build React components with TypeScript
- Implement Next.js 14 App Router patterns
- Create responsive, mobile-first layouts
- Develop bilingual UI components (EN/JP)
- Implement PWA features and offline capabilities
- Ensure accessibility (WCAG compliance)
- Optimize performance and bundle size

**Guidelines:**
- Always use TypeScript with explicit types
- Use Tailwind CSS utility classes for styling
- Follow React best practices and hooks patterns
- Keep components small and reusable
- Consider mobile users (drugstore staff use phones)
- Support both English and Japanese text
- Use semantic HTML for better SEO

### 2. Backend Developer
**Role:** API Routes & Business Logic  
**Responsibilities:**
- Design and implement Next.js API routes
- Write Prisma ORM queries efficiently
- Implement data validation and sanitization
- Handle errors gracefully with proper status codes
- Design RESTful API endpoints
- Implement authentication/authorization if needed
- Optimize database queries for performance

**Guidelines:**
- Use proper HTTP status codes (200, 201, 400, 404, 500)
- Validate all input data before processing
- Use Prisma transactions for data consistency
- Implement proper error handling and logging
- Return consistent JSON response formats
- Consider rate limiting for public endpoints
- Document API endpoints with clear examples

### 3. Database Engineer
**Role:** Database Schema & Optimization  
**Responsibilities:**
- Design Prisma schema for health products
- Create and manage database migrations
- Optimize queries for performance
- Ensure data integrity with constraints
- Model relationships between entities
- Plan for scalability and growth
- Backup and data recovery strategies

**Guidelines:**
- Use appropriate field types (String, Int, DateTime, etc.)
- Define relations clearly (one-to-many, many-to-many)
- Add indexes for frequently queried fields
- Use unique constraints where needed
- Document schema changes in migrations
- Consider multilingual data storage (EN/JP fields)
- Test migrations thoroughly before applying

### 4. DevOps Engineer
**Role:** Deployment & Environment Setup  
**Responsibilities:**
- Configure deployment pipelines
- Manage environment variables
- Set up CI/CD workflows
- Monitor application performance
- Handle build optimization
- Manage production/staging environments
- Troubleshoot deployment issues

**Guidelines:**
- Use .env files for environment configuration
- Never commit secrets to version control
- Optimize build times and bundle size
- Set up error monitoring (Sentry, etc.)
- Configure proper caching strategies
- Use environment-specific configurations
- Document deployment procedures

### 5. QA/Testing Specialist
**Role:** Testing & Quality Assurance  
**Responsibilities:**
- Write unit tests for components and functions
- Create integration tests for API endpoints
- Test mobile responsiveness on real devices
- Validate bilingual functionality (EN/JP)
- Check accessibility compliance
- Perform cross-browser testing
- Test PWA features (offline mode, install)

**Guidelines:**
- Write tests before fixing bugs (TDD approach)
- Aim for meaningful test coverage (not just 100%)
- Test edge cases and error scenarios
- Verify mobile experience on small screens
- Check both English and Japanese content
- Test offline functionality thoroughly
- Use accessibility testing tools

## Custom Commands

### Product Management

#### `/product-crud`
Generate CRUD operations for product management.

**Usage:** `/product-crud [operation] [details]`

**Examples:**
- `/product-crud create` - Generate code to create a new product
- `/product-crud read all` - Generate code to fetch all products
- `/product-crud update price` - Generate code to update product price
- `/product-crud delete` - Generate code to delete a product

**Output:** Complete TypeScript code with Prisma queries, API routes, and React components.

#### `/product-search`
Implement product search functionality.

**Usage:** `/product-search [criteria]`

**Examples:**
- `/product-search by-name` - Search products by name
- `/product-search by-category` - Filter by category
- `/product-search multilingual` - Search in both EN/JP

**Output:** Search implementation with database queries and UI components.

### API Development

#### `/api-endpoint`
Create a new Next.js API route with proper structure.

**Usage:** `/api-endpoint [method] [path] [description]`

**Examples:**
- `/api-endpoint GET /api/products "Fetch all products"`
- `/api-endpoint POST /api/products "Create new product"`
- `/api-endpoint PUT /api/products/[id] "Update product"`
- `/api-endpoint DELETE /api/products/[id] "Delete product"`

**Output:** Complete API route file with TypeScript, validation, error handling, and Prisma queries.

#### `/api-test`
Generate test cases for API endpoints.

**Usage:** `/api-test [endpoint-path]`

**Example:** `/api-test /api/products`

**Output:** Jest test file with test cases for success, validation errors, and edge cases.

### Database Operations

#### `/database-schema`
Update Prisma schema with new models or fields.

**Usage:** `/database-schema [model] [fields]`

**Examples:**
- `/database-schema Product "name, price, description, categoryId"`
- `/database-schema Category "name, description"`
- `/database-schema add-field Product "stock Int @default(0)"`

**Output:** Updated schema.prisma file with migration command.

#### `/prisma-query`
Write optimized Prisma queries.

**Usage:** `/prisma-query [model] [operation] [details]`

**Examples:**
- `/prisma-query Product findMany "include category and images"`
- `/prisma-query Product create "with nested category creation"`
- `/prisma-query Product update "where id equals productId"`

**Output:** TypeScript code with type-safe Prisma queries.

#### `/database-migration`
Create and apply database migrations.

**Usage:** `/database-migration [description]`

**Example:** `/database-migration "add stock field to products"`

**Output:** Migration file and commands to apply it.

### Frontend Development

#### `/component`
Generate a React component with TypeScript.

**Usage:** `/component [name] [props] [description]`

**Examples:**
- `/component ProductCard "product: Product" "Display product information"`
- `/component SearchBar "onSearch: (query: string) => void" "Product search input"`
- `/component ProductList "products: Product[]" "Grid of product cards"`

**Output:** Complete component file with TypeScript types, props validation, and styling.

#### `/page`
Create a Next.js page with layout.

**Usage:** `/page [route] [description]`

**Examples:**
- `/page /products "Product listing page"`
- `/page /products/[id] "Product detail page"`
- `/page /search "Product search page"`

**Output:** Page component with Server/Client component patterns, metadata, and layout.

#### `/mobile-test`
Check mobile responsiveness and layout.

**Usage:** `/mobile-test [component-or-page]`

**Example:** `/mobile-test ProductCard`

**Output:** Responsive design checklist and test code for mobile viewports.

### Internationalization

#### `/translate`
Add translation keys for English and Japanese.

**Usage:** `/translate [key] [en-text] [jp-text]`

**Examples:**
- `/translate product.name "Product Name" "製品名"`
- `/translate search.placeholder "Search products..." "製品を検索..."`
- `/translate button.addToCart "Add to Cart" "カートに追加"`

**Output:** Updated translation files (en.json, ja.json) with new keys.

#### `/i18n-setup`
Configure internationalization for the project.

**Usage:** `/i18n-setup`

**Output:** Complete i18n configuration with language switching, routing, and translation files.

### Testing & Quality

#### `/test-coverage`
Generate tests for components or API endpoints.

**Usage:** `/test-coverage [file-path] [test-type]`

**Examples:**
- `/test-coverage components/ProductCard.tsx unit`
- `/test-coverage app/api/products/route.ts integration`

**Output:** Test file with comprehensive test cases.

#### `/accessibility-check`
Check accessibility compliance.

**Usage:** `/accessibility-check [component-or-page]`

**Example:** `/accessibility-check ProductCard`

**Output:** Accessibility audit with WCAG compliance checks and fixes.

#### `/bug-fix`
Debug and fix reported issues.

**Usage:** `/bug-fix [description] [file-path]`

**Example:** `/bug-fix "Product price not updating" app/api/products/[id]/route.ts`

**Output:** Root cause analysis and code fix with tests.

### Deployment

#### `/deploy-check`
Pre-deployment validation checklist.

**Usage:** `/deploy-check [environment]`

**Examples:**
- `/deploy-check production`
- `/deploy-check staging`

**Output:** Checklist covering build, tests, environment variables, database migrations, and monitoring.

#### `/env-setup`
Configure environment variables.

**Usage:** `/env-setup [environment]`

**Example:** `/env-setup production`

**Output:** .env.example file with all required variables and setup instructions.

#### `/build-optimize`
Optimize build performance and bundle size.

**Usage:** `/build-optimize`

**Output:** Analysis of bundle size with optimization recommendations and implementation.

## Code Style & Standards

### TypeScript
```typescript
// ✅ Good: Explicit types, descriptive names
interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string) => void;
  locale: 'en' | 'ja';
}

// ❌ Bad: Any types, unclear names
interface Props {
  data: any;
  onClick: Function;
}
```

### Prisma Queries
```typescript
// ✅ Good: Type-safe, efficient, with error handling
const product = await prisma.product.findUnique({
  where: { id: productId },
  include: {
    category: true,
    images: true,
  },
});

if (!product) {
  throw new Error('Product not found');
}

// ❌ Bad: No error handling, missing types
const product = await prisma.product.findUnique({
  where: { id: productId },
});
```

### API Routes
```typescript
// ✅ Good: Proper error handling, validation, status codes
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = productSchema.parse(body);
    
    const product = await prisma.product.create({
      data: validatedData,
    });
    
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ❌ Bad: No validation, poor error handling
export async function POST(request: NextRequest) {
  const body = await request.json();
  const product = await prisma.product.create({ data: body });
  return NextResponse.json(product);
}
```

### React Components
```typescript
// ✅ Good: Typed props, error boundaries, accessibility
interface ProductCardProps {
  product: Product;
  locale: 'en' | 'ja';
}

export function ProductCard({ product, locale }: ProductCardProps) {
  const displayName = locale === 'ja' ? product.nameJa : product.nameEn;
  
  return (
    <article 
      className="rounded-lg border p-4 hover:shadow-lg transition-shadow"
      role="article"
      aria-label={displayName}
    >
      <h3 className="text-lg font-semibold">{displayName}</h3>
      <p className="text-gray-600">¥{product.price.toLocaleString()}</p>
    </article>
  );
}

// ❌ Bad: No types, poor accessibility, hardcoded values
export function ProductCard({ product }) {
  return (
    <div className="card">
      <h3>{product.name}</h3>
      <p>${product.price}</p>
    </div>
  );
}
```

## Output Style Preferences

When providing code or solutions, please follow these guidelines:

### Code Quality
- Always use TypeScript with explicit type annotations
- Include JSDoc comments for complex functions
- Add inline comments for non-obvious logic
- Follow Next.js 14 best practices
- Use async/await instead of promises chains
- Implement proper error handling with try-catch

### Documentation
- Provide clear explanations of the approach
- Include usage examples for new functions/components
- Document edge cases and assumptions
- Add comments in both English and Japanese when helpful for context
- Explain database schema changes thoroughly

### Mobile-First Approach
- Always consider mobile users (drugstore staff on phones)
- Use responsive design patterns (Tailwind breakpoints)
- Test layouts on small screens (375px width)
- Optimize images and assets for mobile networks
- Consider touch targets (minimum 44x44px)

### Bilingual Support
- Store both English and Japanese text in database when needed
- Use translation keys consistently
- Test both language versions
- Consider text expansion in Japanese (often longer than English)
- Provide fallback values if translation missing

### Performance
- Optimize bundle size (code splitting, lazy loading)
- Use proper caching strategies (SWR, React Query)
- Minimize database queries (use includes wisely)
- Implement pagination for large lists
- Use Next.js Image component for images

### Security
- Validate all user inputs (use Zod or similar)
- Sanitize data before database operations
- Use parameterized queries (Prisma handles this)
- Implement rate limiting for public endpoints
- Never expose sensitive data in API responses
- Use environment variables for secrets

### Testing
- Write meaningful tests (not just for coverage)
- Test happy path and error scenarios
- Include integration tests for critical flows
- Test bilingual functionality thoroughly
- Verify mobile responsiveness
- Test PWA offline capabilities

## Project Structure

```
myapp/
├── app/
│   ├── [locale]/                 # Internationalized routes
│   │   ├── products/
│   │   │   ├── page.tsx          # Product listing
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Product detail
│   │   ├── search/
│   │   │   └── page.tsx          # Search page
│   │   └── layout.tsx            # Root layout
│   ├── api/
│   │   └── products/
│   │       ├── route.ts          # GET /api/products, POST /api/products
│   │       └── [id]/
│   │           └── route.ts      # GET, PUT, DELETE /api/products/[id]
│   └── globals.css
├── components/
│   ├── ui/                       # Reusable UI components
│   ├── ProductCard.tsx
│   ├── ProductList.tsx
│   ├── SearchBar.tsx
│   └── LanguageSwitcher.tsx
├── lib/
│   ├── prisma.ts                 # Prisma client instance
│   ├── utils.ts                  # Utility functions
│   └── validations.ts            # Zod schemas
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── migrations/               # Migration files
├── public/
│   ├── images/
│   ├── manifest.json             # PWA manifest
│   └── sw.js                     # Service worker
├── locales/
│   ├── en.json                   # English translations
│   └── ja.json                   # Japanese translations
├── types/
│   └── index.ts                  # Shared TypeScript types
├── .env.example                  # Environment variables template
├── .env.local                    # Local environment (gitignored)
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Environment Variables

Required environment variables (add to .env.local):

```bash
# Database
DATABASE_URL="file:./dev.db"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Internationalization
NEXT_PUBLIC_DEFAULT_LOCALE="en"
NEXT_PUBLIC_LOCALES="en,ja"

# Optional: Analytics, Monitoring
# NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
# SENTRY_DSN="https://..."
```

## Development Workflow

### Starting Development
```bash
# Install dependencies
npm install

# Set up database
npx prisma generate
npx prisma db push

# Run development server
npm run dev
```

### Making Changes
1. Create feature branch from main
2. Make changes following code standards
3. Test locally (unit tests + manual testing)
4. Test both EN and JP versions
5. Test on mobile device or simulator
6. Commit with descriptive message
7. Push and create pull request

### Database Changes
```bash
# Create migration
npx prisma migrate dev --name description_of_change

# Apply migration
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Deployment
```bash
# Build for production
npm run build

# Run production server locally
npm start

# Deploy to Vercel
vercel deploy --prod
```

## Best Practices

### For Drugstore Use Case
- **Simple Navigation:** Staff should find products quickly
- **Large Touch Targets:** Easy to tap on mobile devices
- **Clear Product Info:** Name, price, description visible at a glance
- **Fast Search:** Instant results as user types
- **Offline Support:** PWA works even without internet
- **Bilingual:** Switch between EN/JP seamlessly
- **Product Images:** High quality but optimized for fast loading

### Performance Goals
- First Contentful Paint (FCP): < 1.8s
- Time to Interactive (TTI): < 3.8s
- Lighthouse Score: > 90
- Bundle Size: < 200KB initial
- API Response Time: < 200ms

### Accessibility Goals
- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader friendly
- Sufficient color contrast (4.5:1 minimum)
- Descriptive alt text for images
- Proper heading hierarchy

## Common Scenarios

### Adding a New Product Field
1. Update Prisma schema
2. Create migration
3. Update TypeScript types
4. Update API validation schema
5. Update UI components
6. Add translations (EN/JP)
7. Update tests

### Creating a New Page
1. Create page file in app/[locale]/
2. Define metadata for SEO
3. Build component structure
4. Add translations
5. Test responsiveness
6. Add to navigation if needed

### Implementing Search
1. Create search API endpoint
2. Add database indexes for search fields
3. Build SearchBar component
4. Implement debounced search
5. Support both EN and JP search
6. Add loading states
7. Handle empty results

## Additional Resources

### Documentation
- Next.js 14: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- TypeScript: https://www.typescriptlang.org/docs
- Tailwind CSS: https://tailwindcss.com/docs

### Tools
- Next.js DevTools
- Prisma Studio (database GUI)
- React DevTools
- Lighthouse (performance)
- axe DevTools (accessibility)

---

## Notes

- This configuration is optimized for a solo developer working on a drugstore product database
- All agents prioritize practical, maintainable solutions over complex architectures
- Mobile-first approach reflects real-world usage by drugstore staff
- Bilingual support (EN/JP) is a first-class feature, not an afterthought
- Focus is on shipping working features quickly while maintaining code quality

**Last Updated:** November 2025  
**Claude Code Version:** Compatible with Claude Code Web and CLI
