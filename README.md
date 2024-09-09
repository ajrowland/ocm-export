# Oracle Content Manager export

Rough and ready project to obtain content from OCM. This application is EOF 2025, so my motivation is to retrieve the content in proparation to migrate to another CMS.

## To install dependencies:

```bash
bun install
```

Create an `.env` file:

```
ENDPOINT=https://some-oracle-endpoint/content/published/api/v1.1
CHANNEL_TOKEN=token_for_channel_to_export
BEARER_TOKEN=use_bearer_token_when_logged_into_OCM
CONTENT_TYPES=some-type,another-type # At least one type required
LANGUAGES=en # Optional. Without will export all languages
```

## To perform export:

```bash
bun run export
```

## To only perform transforms:

Once you have the data in output/data, you can just perform the transformations. This avoids hitting the OCM endpoint unnecessarily.

```bash
bun run transform
```

Content is exported into the /output folder.

## Transformers

Create a file with the same content type name (but all lowercase) in the /src/transformers folders.

This must have a default export. For example (src/transformers/article-example.ts):

```
export default {
  title: "fields.page_title",
};
```
