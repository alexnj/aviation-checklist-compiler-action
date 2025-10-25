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
| `efis_editor_ref`              | The branch, tag or SHA to checkout from the efis-editor repository | `string`  | `main`                 |
| `efis_editor_patch`            | The patch to apply to the efis-editor                              | `string`  |                        |
| `formats`                      | A comma-separated list of FormatIds to compile.                    | `string`  |                        |
| `pdf_output_group_heading`     | PDF: Whether to output group headings                              | `boolean` | `true`                 |
| `pdf_max_indented_text_height` | PDF: Maximum height for indented text items                        | `number`  | `40`                   |
| `pdf_color_heading`            | PDF: Color for headings                                            | `string`  | `#0000FF`              |
| `pdf_color_emergency`          | PDF: Color for emergency items                                     | `string`  | `#FF0000`              |
| `pdf_color_abnormal`           | PDF: Color for abnormal items                                      | `string`  | `#CF3400`              |
| `pdf_font_size`                | PDF: Font size for text                                            | `number`  | `9`                    |
