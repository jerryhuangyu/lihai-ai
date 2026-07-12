/** URL of build-bundle.mjs served by this app. Base-path aware: on GitHub
 *  Pages the app lives under a subpath (/lihai-ai/), so a bare "/build-bundle.mjs"
 *  would resolve to the domain root and 404. import.meta.env.BASE_URL carries the
 *  configured base ("/lihai-ai/" in prod, "/" in dev) and always ends with "/". */
export function bundleScriptUrl(): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}build-bundle.mjs`
}

/** The one-line command shown in the import panel. The user pastes it into a
 *  terminal; it fetches the bundle generator straight from this app's origin and
 *  pipes it into node — no download, no repo clone. `--input-type=module` because
 *  the script is ESM and stdin has no package.json for node to infer that from.
 *  Output: ~/lihai-bundle.json.gz, which the user drags back into the app. */
export function exportCommand(scriptUrl: string): string {
  return `curl -fsSL ${scriptUrl} | node --input-type=module`
}
