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
- Luna cycle data lives in the cycle_settings table (RLS: owner only); /app is under the _authenticated layout; old localStorage data is migrated on first cloud load. AI runs via createServerFn in src/lib/luna/ai.functions.ts — keeps the gateway key server-side.
