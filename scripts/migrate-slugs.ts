/* eslint-disable no-console */
import mongoose, { Types } from "mongoose";
// ⚠️ Путь проверь: из /scripts к файлу сущности
import { UserSchema } from "../src/user/entities/user.entity";

// --- helpers ---
const BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function base62FromObjectId(id: string): string {
  const buf = Types.ObjectId.createFromHexString(id).id; // Buffer(12)
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

// --- main ---
async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is required");
  }

  await mongoose.connect(uri);

  // ⬇️ РЕГИСТРИРУЕМ схему перед использованием
  const UserModel = mongoose.model("User", UserSchema);

  const cursor = UserModel.find(
    {},
    { slug: 1, shortId: 1, firstName: 1, age: 1, city: 1 }
  )
    .cursor();

  let processed = 0;
  let patched = 0;

  for await (const u of cursor as any) {
    processed++;
    const id = String(u._id);
    const patch: any = {};

    if (!u.shortId) patch.shortId = base62FromObjectId(id);

    if (!u.slug) {
      const base = buildBaseSlug(u.firstName, u.age, u.city);
      // обеспечиваем уникальность
      let candidate = base || "user";
      let n = 2;
      // проверяем уникальность в БД
      // eslint-disable-next-line no-await-in-loop
      while (await UserModel.countDocuments({ slug: candidate, _id: { $ne: id } })) {
        candidate = `${base}-${n++}`;
      }
      patch.slug = candidate;
      patch.slugStatus = "auto";
    }

    if (Object.keys(patch).length) {
      patched++;
      console.log(`→ ${id} ${u.slug || "(no slug)"} ->`, patch);
      // eslint-disable-next-line no-await-in-loop
      await UserModel.updateOne({ _id: id }, { $set: patch });
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
