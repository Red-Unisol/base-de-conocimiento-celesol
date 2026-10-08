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
- The "Políticas" module (SIISA policy design) lives in its own `policies*` tables, `policy-docs` bucket and `/politicas` + `/admin/politicas` routes, fully separate from processes/categories, so the RAG and process permissions stay untouched.
- Policy traces are graphs (`policy_traces` → `policy_siisa_nodes`/`policy_siisa_edges`) edited with @xyflow/react; the walkthrough is manual-only and flags nodes without a CONFIRMADA, fully parameterised rule as "NO EVALUABLE", because no validated SIISA contract exists to auto-decide credit.
- `policy_change_log` is insert-only (no UPDATE/DELETE grants) so history stays immutable.
