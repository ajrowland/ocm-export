import fs from "node:fs";
import consola from "consola";
import transform from "./lib/transform";
import {
  fetchItems,
  fetchItem,
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

  const dirs = {
    data: `output/data/${contentType}`,
    transforms: `output/transformed/${contentType}`,
    binaries: `output/binaries/${contentType}`,
  };

  // Create directories.
  fs.mkdirSync(dirs.data, { recursive: true });
  fs.mkdirSync(dirs.transforms, { recursive: true });
  fs.mkdirSync(dirs.binaries, { recursive: true });

  // Get transformer, if one is available for this content type.
  const transformer = await getTransformer(contentType);

  // Query required items.
  const items = await fetchItems(contentTypeQuery);

  // Get all item ids.
  const itemIds: string[] = items.items
    // .slice(1, 2)
    .map((item: Item) => item.id);

  // Get expanded data for each item.
  itemIds.forEach(async (itemId) => {
    const itemExpanded = await fetchItem(itemId);

    // Get required binaries for item.
    const binaryUrls = getBinaries(Object.values(itemExpanded), "image/webp");

    // Download all binaries.
    binaryUrls.forEach(async (binary) => saveBinary(binary, dirs.binaries));

    // Save transformed data.
    if (transformer) {
      saveData(
        `${dirs.transforms}/${itemId}-${itemExpanded.language}.json`,
        transform(itemExpanded, transformer)
      );
    }

    // Save original data.
    saveData(
      `${dirs.data}/${itemId}-${itemExpanded.language}.json`,
      itemExpanded
    );

    consola.success(`Exported ${itemExpanded.name} (${itemExpanded.id})`);
  });
};

contentTypes.forEach(async (contentType) => {
  getContentTypeItems(contentType);
});
