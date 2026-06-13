### Stalker

A lean site that looks like nothing much on the surface but leaks its way open. A classic web
chain rather than a scanner playground. What's inside, by class:

- **Information disclosure** — leaked Git artifacts let you recover source and history.
- **Content discovery** — a hidden admin panel that isn't linked from the front page.
- **SQL injection** — injectable queries in the application.
- **Code execution** — the panel runs input it should never trust → RCE.

No full walkthrough here — working the chain is the point. Source is linked above if you want to
read it.