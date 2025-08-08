/* eslint-disable no-console */
import mongoose, { Types } from "mongoose";
import { UserSchema } from "../src/user/entities/user.entity";

const REBUILD_AUTO_SLUGS = process.env.REBUILD_AUTO_SLUGS === "1";
const DRY_RUN = process.env.DRY_RUN === "1";

const BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function base62FromObjectId(id: string): string {
  const buf = Types.ObjectId.createFromHexString(id).id;
  let num = 0n;
  for (const b of buf) num = (num << 8n) + BigInt(b);
  if (num === 0n) return "0";
  let out = "";
  while (num > 0n) {
    const rem = Number(num % 62n);
    out = BASE62[rem] + out;
    num = num / 62n;
  }
  return out.slice(0, 8);
}
function slugify(input: string): string {
  return (input || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}
function buildBaseSlug(firstName?: string, age?: number, city?: string): string {
  const parts = [firstName ?? "", age ? String(age) : "", city ?? ""]
    .map(slugify)
    .filter(Boolean);
  return slugify(parts.join("-")) || "user";
}

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is required");

  await mongoose.connect(uri);
  const UserModel = mongoose.model("User", UserSchema);

  const cursor = UserModel.find(
    {},
    { slug: 1, slugStatus: 1, aliases: 1, shortId: 1, firstName: 1, age: 1, city: 1 }
  ).cursor();

  let processed = 0;
  let patched = 0;

  for await (const u of cursor as any) {
    processed++;
    const id = String(u._id);
    const patch: any = {};
    const setOnInsert: any = {};

    // 1) shortId — только если отсутствует (НЕ меняем существующий!)
    if (!u.shortId) {
      setOnInsert.shortId = base62FromObjectId(id);
    }

    // 2) slug
    const base = buildBaseSlug(u.firstName, u.age, u.city);

    // (а) если нет slug — создаём
    if (!u.slug) {
      let candidate = base || "user";
      let n = 2;
      // избегаем коллизий
      // eslint-disable-next-line no-await-in-loop
      while (await UserModel.countDocuments({ slug: candidate, _id: { $ne: id } })) {
        candidate = `${base}-${n++}`;
      }
      patch.slug = candidate;
      patch.slugStatus = "auto";
    } else if (REBUILD_AUTO_SLUGS && u.slugStatus === "auto") {
      // (б) пересчёт авто-слигов, если пришли новые firstName/age/city
      let candidate = base || "user";
      if (candidate !== u.slug) {
        let n = 2;
        // eslint-disable-next-line no-await-in-loop
        while (await UserModel.countDocuments({ slug: candidate, _id: { $ne: id } })) {
          candidate = `${base}-${n++}`;
        }
        // сохраним старый слаг в aliases (для редиректов)
        const aliases = Array.isArray(u.aliases) ? u.aliases : [];
        if (!aliases.includes(u.slug)) aliases.push(u.slug);

        patch.slug = candidate;
        patch.slugStatus = "auto";
        patch.aliases = aliases;
      }
    }

    if (Object.keys(patch).length || Object.keys(setOnInsert).length) {
      patched++;
      console.log(
        `→ ${id} ${u.slug || "(no slug)"} ->`,
        { setOnInsert, patch },
        DRY_RUN ? "[DRY_RUN]" : ""
      );
      if (!DRY_RUN) {
        await UserModel.updateOne(
          { _id: id },
          { ...(Object.keys(patch).length ? { $set: patch } : {}), ...(Object.keys(setOnInsert).length ? { $setOnInsert: setOnInsert } : {}) }
        );
      }
    }

    if (processed % 1000 === 0) {
      console.log(`[progress] processed=${processed} patched=${patched}`);
    }
  }

  console.log(`Done. processed=${processed}, patched=${patched}`);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
