import fs from "node:fs";
import consola from "consola";
import transform from "./lib/transform";
import {
  getOutputDirectories,
  loadData,
  saveData,
  getTransformer,
} from "./lib/util";

const contentTypes = process.env.CONTENT_TYPES?.split(",") || [];

if (contentTypes.length === 0) {
  consola.error("Must have at least one content type to export");
  process.exit(0);
}

const languages = process.env.LANGUAGES?.split(",") || [];
const languageQuery = languages.length
  ? ` and (language eq "${languages.join('" or language eq "')}")`
  : "";

const transformContentTypeItems = async (contentType: string) => {
  const contentTypeQuery = `type eq "${contentType}"${languageQuery}`;

  consola.info(`Transforming content with query: ${contentTypeQuery}`);

  const dirs = getOutputDirectories(contentType);

  // Get transformer, if one is available for this content type.
  const transformer = await getTransformer(contentType);

  if (!transform) {
    consola.error(`No transformer found to content type ${contentType}`);
    process.exit(0);
  }

  // Obtain data for content type.
  fs.readdirSync(dirs.data).forEach((file) => {
    console.log(file);

    const itemExpanded = loadData(`${dirs.data}/${file}`);

    // Perform transform.
    saveData(
      `${dirs.transforms}/${file}`,
      transform(itemExpanded, transformer)
    );
  });
};

contentTypes.forEach(async (contentType) => {
  transformContentTypeItems(contentType);
});
