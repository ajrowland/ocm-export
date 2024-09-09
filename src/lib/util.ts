import fs from "fs";
import path from "node:path";
import { Readable } from "node:stream";
import type { Binary } from "./types";

const {
  CHANNEL_TOKEN: channelToken = "",
  BEARER_TOKEN: bearerToken,
  ENDPOINT: endpoint,
} = process.env;

const headers = { Authorization: `Bearer ${bearerToken}` };

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

export const fetchItems = (q: string) =>
  fetch(
    `${endpoint}/items?${new URLSearchParams({
      channelToken,
      q,
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

export const saveData = (filename: string, data: any) =>
  fs.writeFileSync(path.resolve(filename), JSON.stringify(data, null, 2));

export const saveBinary = async (binary: Binary, dir: string) => {
  const url = `${endpoint}/assets/${binary.id}/native/?format=webp&channelToken=${channelToken}`;

  Readable.fromWeb((await fetch(url)).body as any).pipe(
    fs.createWriteStream(`${dir}/${binary.name}.webp`)
  );
};
