$gh = Join-Path $PSScriptRoot "bin\gh.exe"

& $gh pr create `
  --repo "hyeongsi/devnote" `
  --base "main" `
  --head "initial-devnote-webapp-setup" `
  --draft `
  --title "[codex] initial devnote webapp setup" `
  --body-file (Join-Path $PSScriptRoot "pr-body.md")
