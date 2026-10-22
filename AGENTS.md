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
- The private address column has no SELECT grant for anon or authenticated; public reads use generated public_address, admins read address via admin_property_addresses() (has_role check). Never re-grant SELECT on address.
- Public signup is disabled; admins are created via the auth admin API and granted by inserting into user_roles (no auto-admin trigger).
- Photos live in the private property-photos bucket (public buckets are blocked); rows store the object path and the app resolves signed URLs via resolvePhotos. Anon may read only objects linked to published properties.
- Keep listing types, queries and form validation in browser-safe modules (src/lib/properties.ts, property-form.ts) so they stay unit-testable.

- MCP server (src/lib/mcp/, one tool per file) is public read-only over published listings only; never expose private data there without OAuth. WebMCP page tools live in the component owning the controls.
