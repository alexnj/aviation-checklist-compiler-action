# Aviation Checklist Compiler

This is an action that compiles an aviation checklist template repository,
such as the [aviation-checklists](https://github.com/alexnj/aviation-checklists)
repository.

## Inputs

| Input                          | Description                                                        | Type      | Default                |
| ------------------------------ | ------------------------------------------------------------------ | --------- | ---------------------- |
| `checklists_directory`         | The directory containing the checklist JSON files                  | `string`  | `checklists`           |
| `compiler_output_directory`    | The directory where the compiled checklists will be saved          | `string`  | `artifacts`            |
| `release_directory`            | The directory where the final release artifacts will be saved      | `string`  | `output-release`       |
| `create_release`               | Whether to create a GitHub release                                 | `boolean` | `true`                 |
| `efis_editor_repository`       | The repository containing the efis-editor                          | `string`  | `rdamazio/efis-editor` |
| `efis_editor_ref`              | The branch, tag or SHA to checkout from the efis-editor repository. Leave unset to use the verified pin, or set to `main` to track upstream (see [Upstream compatibility](#upstream-compatibility)) | `string`  | SHA in `efis-editor.ref` |
| `efis_editor_patch`            | The patch to apply to the efis-editor                              | `string`  |                        |
| `formats`                      | A comma-separated list of FormatIds to compile.                    | `string`  |                        |
| `pdf_output_group_heading`     | PDF: Whether to output group headings                              | `boolean` | `false`                |
| `pdf_max_indented_text_height` | PDF: Maximum height for indented text items                        | `number`  | `40`                   |
| `pdf_color_heading`            | PDF: Color for headings                                            | `string`  | `#0000FF`              |
| `pdf_color_emergency`          | PDF: Color for emergency items                                     | `string`  | `#FF0000`              |
| `pdf_color_abnormal`           | PDF: Color for abnormal items                                      | `string`  | `#CF3400`              |
| `pdf_font_size`                | PDF: Font size for text                                            | `number`  | `9`                    |

## Upstream compatibility

The action builds on [efis-editor](https://github.com/rdamazio/efis-editor).
To keep upstream changes from breaking your builds, it uses an efis-editor
commit that has been verified to work. That commit's SHA is stored in
[`efis-editor.ref`](efis-editor.ref).

- Every night, the [upstream canary](.github/workflows/upstream-canary.yml)
  builds and tests the action against efis-editor `main`. If the build passes,
  `efis-editor.ref` moves to that commit. If it fails, the canary opens an
  `upstream-break` issue and the pin stays on the last good commit.
- The compiler exits with an error when any checklist fails to convert to any
  format, so your workflow fails instead of publishing an incomplete release.

### Tracking upstream `main`

Versions before the pin always built against efis-editor `main`. To get that
behavior back, for example to pick up a new upstream format before the canary
pins it, set `efis_editor_ref: main`:

```yaml
- uses: alexnj/aviation-checklist-compiler-action@main
  with:
    efis_editor_ref: main
```

If you do this, a breaking upstream change will fail your build until it is
fixed here. To use a specific upstream commit, set `efis_editor_ref` to its SHA.

### Local testing

To test locally, run `./verify_action_local.sh`. To test a different
efis-editor ref, set `EFIS_REF`, for example
`EFIS_REF=main ./verify_action_local.sh`.

### Automatic fixes with Copilot (optional)

If the `COPILOT_ASSIGN_TOKEN` repository secret is set, new `upstream-break`
issues are assigned to the
[Copilot coding agent](https://docs.github.com/en/copilot/using-github-copilot/coding-agent/using-copilot-to-work-on-an-issue),
which opens a PR with a proposed fix. The secret must be a fine-grained
personal access token from a user who has Copilot coding agent access, with
read/write access to Actions, Contents, Issues and Pull requests.
