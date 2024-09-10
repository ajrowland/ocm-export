import fs from "fs";
import path from "node:path";
import { Readable } from "node:stream";
import type { Binary } from "./types";
import consola from "consola";

const {
  CHANNEL_TOKEN: channelToken = "",
  BEARER_TOKEN: bearerToken,
  ENDPOINT: endpoint,
} = process.env;

const headers = { Authorization: `Bearer ${bearerToken}` };

export const getOutputDirectories = (contentType: string) => {
  const dirs = {
    data: `output/${channelToken}/data/${contentType}`,
    transforms: `output/${channelToken}/transforms/${contentType}`,
    binaries: `output/${channelToken}/binaries`,
  };

  // Create directories.
  fs.mkdirSync(dirs.data, { recursive: true });
  fs.mkdirSync(dirs.transforms, { recursive: true });
  fs.mkdirSync(dirs.binaries, { recursive: true });

  return dirs;
};

export const getIdFromUrl = (url: string) => {
  const paths = path.parse(url);
  const slugs = paths.dir.split("/");
  const id = slugs[slugs.length - 2];

  return id;
};

export const getBinaries = (data: any[], mimeType: string) => {
  const tranverseBinaries = (
    binaries: { [key: string]: string },
    item: any
  ): { [key: string]: string } => {
    for (let key in item) {
      if (typeof item[key] === "object") {
        return Object.values(item).reduce(tranverseBinaries, binaries);
      }
    }

    if (item?.mediaType?.startsWith(mimeType)) {
      const id = getIdFromUrl(item.href);

      binaries[id] = path.parse(item.href).name;
    }

    return binaries;
  };

  const binaryUrls = data.reduce(tranverseBinaries, {});

  return Object.keys(binaryUrls).map(
    (key) =>
      ({
        id: key,
        name: binaryUrls[key],
      }) as Binary
  );
};

export const fetchItems = (q: string, scrollId: string = "") =>
  fetch(
    `${endpoint}/items?${new URLSearchParams({
      channelToken,
      q,
      scroll: "true",
      scrollId,
    })}`,
    { headers }
  ).then((res) => res.json());

export const fetchItem = (itemId: string) =>
  fetch(
    `${endpoint}/items/${itemId}?${new URLSearchParams({
      channelToken,
      expand: "all",
    })}`,
    { headers }
  ).then((res) => res.json());

export const loadData = (filepath: string) =>
  JSON.parse(fs.readFileSync(filepath, "utf8"));

export const loadTransformData = (
  id: string,
  contentType: string,
  language: string
) => {
  const dirs = getOutputDirectories(contentType);

  const filepath = `${dirs.transforms}/${id}-${language}.json`;

  return fs.existsSync(filepath) ? loadData(filepath) : {};
};

export const saveData = (filepath: string, data: any) =>
  fs.writeFileSync(path.resolve(filepath), JSON.stringify(data, null, 2));

export const saveBinary = async (binary: Binary, dir: string) => {
  const url = `${endpoint}/assets/${binary.id}/native/?format=webp&channelToken=${channelToken}`;

  Readable.fromWeb((await fetch(url)).body as any).pipe(
    fs.createWriteStream(
      `${dir}/${binary.id}-${binary.name.replace("_", "-")}.webp`
    )
  );
};

export const getTransformer = async (contentType: string) => {
  try {
    return (
      await import(
        path.resolve(`src/transformers/${contentType.toLocaleLowerCase()}`)
      )
    ).default;
  } catch {
    consola.info(
      "No transformer available for this content type. The data will not be tranformered."
    );
  }
};
