export const react = {
  questions: [
    [1, 'What is the Virtual DOM and how does reconciliation work?', 'React keeps a lightweight in-memory tree of elements. On state change it builds a new tree, diffs it against the previous one (same type = update, different type = replace, keys identify list items) and applies only the minimal DOM changes.'],
    [1, 'What are props vs state?', 'Props are read-only inputs passed from parent to child. State is data owned and updated by a component (useState) that triggers re-render. Data flows down; events flow up.'],
    [1, 'Why do lists need keys?', 'Keys give elements stable identity so React can match, reorder and preserve state correctly. Use stable unique ids, not array indexes for dynamic lists.'],
    [2, 'Explain useEffect and its dependency array.', 'useEffect runs side effects after render. [] runs once on mount, [a,b] re-runs when they change, no array runs every render. Return a cleanup function for subscriptions/timers. Missing dependencies cause stale closures.'],
    [2, 'useMemo vs useCallback vs React.memo?', 'useMemo caches a computed value; useCallback caches a function identity; React.memo skips re-rendering a component when props are shallow-equal. Use them for measured performance problems, not everywhere.'],
    [2, 'Controlled vs uncontrolled components?', 'Controlled: form value lives in React state and updates via onChange. Uncontrolled: DOM holds the value, read via refs. Controlled is preferred for validation and dynamic UIs.'],
    [2, 'How do you manage global state?', 'Lift state up for local sharing; Context for low-frequency values (theme, auth); Redux Toolkit/Zustand for complex client state; React Query/SWR for server state (caching, refetching). Avoid putting everything in global state.'],
    [2, 'What are custom hooks?', 'Functions starting with use that compose built-in hooks to reuse stateful logic (useFetch, useDebounce). They share logic, not state - each call has its own state.'],
    [3, 'How do you optimize React performance?', 'Measure with the Profiler; avoid unnecessary re-renders (memo, stable props, colocate state), code-split with lazy/Suspense, virtualize long lists, debounce inputs, use transitions (useTransition) for heavy updates, and optimize bundle size.'],
    [3, 'Explain React 18 concurrent features and Server Components.', 'Concurrent rendering lets React interrupt low-priority work: automatic batching, useTransition, useDeferredValue, Suspense for data. Server Components render on the server, ship no JS to the client, and can access data directly, reducing bundle size.'],
    [3, 'How do you test React apps?', 'Jest/Vitest with React Testing Library focusing on user-visible behaviour (roles, text), mock network with MSW, component tests for logic, Playwright/Cypress for E2E, and accessibility checks (axe).'],
    [4, 'How do you architect a large React application with many teams?', 'Feature-based folder structure, design system and shared component library, typed APIs (TypeScript, OpenAPI codegen), clear state boundaries, micro-frontends only when organizational scaling demands it, performance budgets, CI checks, and observability (error tracking, web vitals).'],
  ],
  notes: [
    { title: 'Render Cycle', diagram: { type: 'flow', items: ['setState', 'Re-render', 'Diff VDOM', 'Patch DOM', 'useEffect'] }, points: ['State change triggers render', 'Effects run after paint', 'Keys keep list identity'] },
    { title: 'Hooks Cheat-Sheet', points: ['useState: local state', 'useEffect: side effects + cleanup', 'useRef: mutable box / DOM ref', 'useMemo / useCallback: cache', 'useContext: read context'], code: 'useEffect(() => {\n  const id = setInterval(tick, 1000);\n  return () => clearInterval(id);\n}, []);' },
    { title: 'State Management Ladder', diagram: { type: 'stack', items: ['Server state: React Query', 'Global client: Redux / Zustand', 'Shared: Context', 'Local: useState'] }, points: ['Start at the bottom', 'Move up only when needed'] },
  ],
};

export const javascript = {
  questions: [
    [1, 'var vs let vs const?', 'var is function-scoped and hoisted (initialized undefined). let and const are block-scoped with a temporal dead zone. const prevents reassignment (objects remain mutable). Prefer const, then let.'],
    [1, '== vs === and truthy/falsy values?', '=== compares without coercion; == coerces types (0 == "0" is true). Falsy: false, 0, -0, 0n, "", null, undefined, NaN. Prefer ===.'],
    [1, 'What is a closure?', 'A function that remembers variables from its lexical scope even after the outer function has returned. Used for data privacy, factories, memoization and callbacks - and the classic loop-with-var bug.'],
    [1, 'Explain this in JavaScript.', 'this depends on how a function is called: method call -> the object, plain call -> undefined (strict) or global, new -> the new instance, call/apply/bind -> explicit. Arrow functions inherit this lexically.'],
    [2, 'Explain the event loop, call stack, microtasks and macrotasks.', 'JS is single-threaded. The call stack runs synchronous code; async callbacks wait in queues. After the stack empties, all microtasks (Promise.then, queueMicrotask) run, then one macrotask (setTimeout, IO, UI events), repeat.'],
    [2, 'Promises vs async/await; how do you handle errors?', 'Promises represent a future value (then/catch/finally). async/await is syntax sugar that reads sequentially; errors are handled with try/catch. Use Promise.all for parallel, allSettled to tolerate failures, race/any for first result.'],
    [2, 'Explain prototypes and prototypal inheritance.', 'Every object has an internal [[Prototype]] link; property lookup walks the chain. Classes are syntactic sugar over prototypes. Object.create sets the prototype explicitly.'],
    [2, 'Hoisting and the temporal dead zone?', 'Declarations are processed before execution: function declarations are fully hoisted, var is hoisted as undefined, let/const are hoisted but inaccessible until initialized (TDZ) causing ReferenceError.'],
    [2, 'Debounce vs throttle?', 'Debounce delays execution until events stop for N ms (search input). Throttle allows at most one execution per N ms (scroll/resize). Both use timers and closures.'],
    [3, 'Explain ES modules vs CommonJS and tree shaking.', 'ESM uses static import/export (analyzable, async, live bindings) enabling tree shaking of unused code; CommonJS uses require/module.exports, synchronous and dynamic. Bundlers rely on ESM statics to drop dead code.'],
    [3, 'How do you find and fix memory leaks in JS apps?', 'Use Chrome DevTools heap snapshots and allocation timelines to find detached DOM nodes and growing retained sizes. Common causes: forgotten timers/listeners, closures holding large data, global caches. Fix by cleanup, weak references (WeakMap), and bounded caches.'],
    [3, 'What are generators, iterators and Symbol.iterator?', 'Iterators expose next() returning {value, done}; iterables implement [Symbol.iterator]. Generators (function*) produce values lazily with yield and can pause/resume - basis of many async patterns and lazy sequences.'],
    [4, 'How do you secure a JavaScript front end?', 'Prevent XSS (escape output, CSP, avoid innerHTML/dangerouslySetInnerHTML), protect tokens (HttpOnly SameSite cookies over localStorage), CSRF defenses, validate on the server, dependency auditing, subresource integrity, and strict CORS.'],
  ],
  notes: [
    { title: 'Event Loop', diagram: { type: 'flow', items: ['Call stack', 'Microtasks', 'Macrotask', 'Render', 'Repeat'] }, points: ['Promises = microtasks (run first)', 'setTimeout = macrotask', 'Never block the stack'], code: 'console.log(1);\nsetTimeout(() => console.log(2));\nPromise.resolve().then(() => console.log(3));\nconsole.log(4); // 1 4 3 2' },
    { title: 'Scope & Closures', points: ['let/const are block scoped', 'Closures capture variables, not values', 'Arrow functions keep outer this'], code: 'function counter() {\n  let n = 0;\n  return () => ++n;\n}\nconst c = counter(); c(); c(); // 2' },
    { title: 'Async Patterns', points: ['Promise.all: all or fail fast', 'allSettled: every result', 'race: first settled', 'Always handle rejections'], code: 'try {\n  const [a, b] = await Promise.all([f1(), f2()]);\n} catch (e) { handle(e); }' },
  ],
};

export const html = {
  questions: [
    [1, 'What is semantic HTML and why does it matter?', 'Using elements that convey meaning (header, nav, main, article, section, footer, button) instead of generic divs. It improves accessibility for screen readers, SEO, and maintainability.'],
    [1, 'Difference between block, inline and inline-block elements?', 'Block elements start on a new line and take full width (div, p). Inline flow within text and ignore width/height (span, a). Inline-block flows inline but accepts width, height and vertical margins.'],
    [1, 'What is the CSS box model?', 'Each element is content + padding + border + margin. box-sizing: border-box makes width/height include padding and border, which is usually what you want.'],
    [1, 'What are the differences between id and class?', 'id must be unique per page (anchors, JS hooks, label targets); classes are reusable and used for styling. Prefer classes for CSS, avoid high-specificity id selectors.'],
    [2, 'Flexbox vs Grid?', 'Flexbox is one-dimensional (row or column) for aligning items along an axis; Grid is two-dimensional for layouts with rows and columns. They are complementary: grid for page layout, flex for components.'],
    [2, 'Explain CSS specificity and the cascade.', 'Order of precedence: !important, inline style, id, class/attribute/pseudo-class, element. Equal specificity: later rule wins. Keep selectors low-specificity and use cascade layers or BEM to stay manageable.'],
    [2, 'How do you build a responsive layout?', 'Mobile-first CSS with media queries, fluid units (rem, %, clamp), flexible grids, responsive images (srcset, picture), and the viewport meta tag. Test across breakpoints and orientations.'],
    [2, 'What are the essentials of web accessibility (a11y)?', 'Semantic elements, alt text, labels for inputs, keyboard focus order and visible focus, sufficient contrast, ARIA only when native semantics are insufficient, and testing with screen readers and axe/Lighthouse.'],
    [2, 'What is the difference between localStorage, sessionStorage and cookies?', 'localStorage persists until cleared (~5MB, same-origin, JS-only). sessionStorage lasts per tab session. Cookies are sent with every request, have expiry and flags (HttpOnly, Secure, SameSite) - use them for session tokens.'],
    [3, 'How do you improve page load performance (Core Web Vitals)?', 'Optimize LCP (compress/preload hero images, critical CSS, CDN), reduce CLS (reserve space for media), improve INP (less main-thread JS), lazy-load below-the-fold assets, use HTTP caching, and code splitting.'],
    [3, 'What are Web Components / Shadow DOM?', 'Custom Elements, Shadow DOM (style/DOM encapsulation) and templates let you create reusable framework-independent components with scoped styles.'],
  ],
  notes: [
    { title: 'Box Model', diagram: { type: 'stack', items: ['Margin', 'Border', 'Padding', 'Content'] }, points: ['Use box-sizing: border-box', 'Margins can collapse vertically'] },
    { title: 'Flex vs Grid', points: ['Flex = 1D (row or column)', 'Grid = 2D layout', 'gap works in both', 'Center anything: display:grid; place-items:center'], code: '.row { display:flex; gap:1rem;\n       justify-content:space-between;\n       align-items:center; }' },
    { title: 'Semantic Page Skeleton', points: ['header, nav, main, footer', 'article / section for content', 'One h1, ordered headings', 'label every input'], diagram: { type: 'stack', items: ['<header> + <nav>', '<main> <article>', '<aside>', '<footer>'] } },
  ],
};
