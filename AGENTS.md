<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Application rules
- Implement the uploaded prototype as React components in the existing TanStack routes, with the original visual system in global CSS; this preserves appearance without embedding a separate HTML application.
- Listings live in the database (properties + ordered property_images); public reads go through fetchPublishedProperties with status='published', admin writes use the browser client under RLS gated by has_role('admin'); keeps a single query path for site and MCP.
- Visitors never get the private address column: anon has column-level grants and reads the generated public_address; never grant anon SELECT on address.
- The first account created becomes admin via an auth.users trigger; later admins are granted by inserting into user_roles.
- Keep listing types, queries and form validation in browser-safe modules (src/lib/properties.ts, property-form.ts) so they stay unit-testable.

- MCP server (src/lib/mcp/, one tool per file) is public read-only over published listings only; never expose private data there without OAuth. WebMCP page tools live in the component owning the controls.
