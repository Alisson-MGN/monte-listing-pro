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
- Keep demonstration listings in React session state only until backend work is authorized; refreshing must restore the supplied examples, not imply saved or published listings.
- Keep listing data and filtering in a browser-safe module, and store original illustrative photo URLs through asset pointers; this supports independent behavior tests and avoids external image hotlinks.
