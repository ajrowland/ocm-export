import consola from "consola";
import {
  getOutputDirectories,
  fetchItems,
  getBinaries,
  saveBinary,
  saveData,
  getTransformer,
} from "./lib/util";
import type { Item } from "./lib/types";

const contentTypes = process.env.CONTENT_TYPES?.split(",") || [];

if (contentTypes.length === 0) {
  consola.error("Must have at least one content type to export");
  process.exit(0);
}

const languages = process.env.LANGUAGES?.split(",") || [];
const languageQuery = languages.length
  ? ` and (language eq "${languages.join('" or language eq "')}")`
  : "";

const getContentTypeItems = async (contentType: string) => {
  const contentTypeQuery = `type eq "${contentType}"${languageQuery}`;

  consola.info(`Exporting content with query: ${contentTypeQuery}`);

  const dirs = getOutputDirectories(contentType);

  // Get transformer, if one is available for this content type.
  const transformer = await getTransformer(contentType);

  const scrollItems = async (scrollId?: string) => {
    // Query required items.
    const itemsResponse = await fetchItems(contentTypeQuery, scrollId);

    // Get binaries and transform data for each item.
    itemsResponse.items?.forEach(async (item: Item) => {
      // Get required binaries for item.
      const binaryUrls = getBinaries(Object.values(item), "image/webp");

      // Download all binaries.
      binaryUrls.forEach(async (binary) => saveBinary(binary, dirs.binaries));

      // Save transformed data.
      if (transformer) {
        saveData(
          `${dirs.transforms}/${item.id}-${item.language}.json`,
          transformer(item)
        );
      }

      // Save original data.
      saveData(`${dirs.data}/${item.id}-${item.language}.json`, item);

      consola.success(`Exported ${item.name} (${item.id})`);
    });

    return itemsResponse.scrollId;
  };

  let scrollId = "";

  do {
    scrollId = await scrollItems(scrollId);
    consola.info(`Attempting to scroll with id ${scrollId}`);
  } while (scrollId);
};

for (const contentType of contentTypes) {
  await getContentTypeItems(contentType);
}
