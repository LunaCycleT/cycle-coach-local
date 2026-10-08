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
- The app favicon in public/favicon.svg mirrors Luna's existing moon brand mark; keep the browser icon consistent with the on-page logo.
- Luna cycle data lives in the cycle_settings table (RLS: owner only); /app is under the _authenticated layout; old localStorage data is migrated on first cloud load. AI runs via createServerFn in src/lib/luna/ai.functions.ts — keeps the gateway key server-side.
- Capture browser installation events in the root LunaInstallationProvider and render the automatic offer only inside the authenticated app, recording its first display per browser so it does not repeat.
- Keep the installation service worker network-only with no data caching, so authenticated pages and private health data are never retained by the worker.
