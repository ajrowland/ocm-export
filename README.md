# Oracle Content Manager export

Rough and ready project to obtain content from OCM. This application is EOF 2025, so my motivation is to retrieve the content in proparation to migrate to another CMS.

To install dependencies:

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

To run:

```bash
bun run export
```

Content is exported into the /output folder.
