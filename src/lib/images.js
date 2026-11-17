import { supabase } from './supabase.js'

// Uploaded images live in this Supabase Storage bucket (created by migration 005).
// Each upload gets a folder of its own holding the original file and every crop made
// from it. Content stores the paths; imageUrl() turns a path into an address.
const BUCKET = 'site-images'

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024

export function imageUrl(path) {
  return path ? supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl : null
}

async function upload(path, blob) {
  const { error } = await supabase.storage
    .from(BUCKET)
    // Every file gets a unique name and is never overwritten, so browsers may cache it for good.
    .upload(path, blob, { contentType: blob.type, cacheControl: '31536000' })
  if (error) throw new Error(error.message)
  return path
}

// Every upload is also recorded in the assets tables (migrations 006 and 007), which the
// Assets page of the admin dashboard lists. An asset is the original file; each crop of it
// is a row of its own holding the shape and the part of the original that was kept.

// Stores the file exactly as chosen, so it can be cropped again later. Returns its path.
//
// If the very same file (byte for byte) has been uploaded before, nothing is stored: the
// existing asset's original is returned instead, so its crops and the places it is used all
// stay together under one asset.
export async function uploadOriginal(file) {
  const hash = await fingerprint(file)
  const existing = await findOriginal(hash, file.size)
  if (existing) return existing

  const extension = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : 'jpg'
  const id = crypto.randomUUID()
  const path = await upload(`${id}/original.${extension}`, file)
  const size = await pixelSize(file)
  const { error } = await supabase.from('assets').insert({
    id,
    original_path: path,
    file_name: file.name,
    mime_type: file.type,
    size_bytes: file.size,
    width: size?.width ?? null,
    height: size?.height ?? null,
    content_hash: hash,
  })
  if (error) {
    // 23505: someone else stored the same file in the meantime. Use theirs.
    const theirs = error.code === '23505' ? await findOriginal(hash, file.size) : null
    await supabase.storage.from(BUCKET).remove([path])
    if (theirs) return theirs
    throw new Error(error.message)
  }
  return path
}

// The original path of the asset whose file has this fingerprint, or null.
async function findOriginal(hash, bytes) {
  const { data: match, error } = await supabase
    .from('assets')
    .select('original_path')
    .eq('content_hash', hash)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (match) return match.original_path

  // Images uploaded before fingerprints were kept (migration 007) don't have one yet. Only a
  // file of exactly the same size can be the same file, so just those are fetched and
  // fingerprinted now, and the result saved so this happens once per image.
  const { data: unknown, error: unknownError } = await supabase
    .from('assets')
    .select('id, original_path')
    .is('content_hash', null)
    .eq('size_bytes', bytes)
  if (unknownError) throw new Error(unknownError.message)
  for (const asset of unknown) {
    const theirs = await fingerprint(await downloadOriginal(asset.original_path))
    // Fails harmlessly if two older assets were already the same file; the first one keeps it.
    await supabase.from('assets').update({ content_hash: theirs }).eq('id', asset.id)
    if (theirs === hash) return asset.original_path
  }
  return null
}

// SHA-256 of a file's contents, as hex.
async function fingerprint(blob) {
  const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

// Crops `original` (the file stored at `originalPath`) to `preset`, keeping `area` (see
// cropImage), and stores the crop next to the original. Returns the crop's path.
//
// If this asset already has a crop of exactly that shape and area (e.g. the same image was
// uploaded again and left at the default crop), that crop is reused instead.
export async function uploadCrop(originalPath, original, area, preset) {
  const folder = originalPath.split('/')[0]
  const kept = roundArea(area)

  const { data: crops, error } = await supabase
    .from('asset_crops')
    .select('path, area')
    .eq('asset_id', folder)
    .eq('preset', preset.id)
  if (error) throw new Error(error.message)
  const same = crops.find((crop) => crop.area && Object.keys(kept).every((key) => crop.area[key] === kept[key]))
  if (same) return same.path

  const crop = await cropImage(original, area, preset)
  const path = await upload(`${folder}/cropped-${crypto.randomUUID()}.jpg`, crop.blob)
  const { error: recordError } = await supabase.from('asset_crops').insert({
    asset_id: folder,
    path,
    preset: preset.id,
    area: kept,
    width: crop.width,
    height: crop.height,
  })
  if (recordError) throw new Error(recordError.message)
  return path
}

function roundArea(area) {
  return Object.fromEntries(['x', 'y', 'width', 'height'].map((key) => [key, Math.round(area[key])]))
}

async function pixelSize(blob) {
  try {
    const bitmap = await createImageBitmap(blob)
    const size = { width: bitmap.width, height: bitmap.height }
    bitmap.close()
    return size
  } catch {
    // Some formats can't be decoded here; the size is just left unknown.
    return null
  }
}

// Storage paths are `<asset id>/original.<ext>` or `<asset id>/cropped-<id>.jpg`.
const ASSET_PATH = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/(original\.|cropped-)/

// The ids of the assets whose files appear anywhere in `value` (e.g. a section's content).
export function assetIdsIn(value, found = new Set()) {
  if (typeof value === 'string') {
    const match = ASSET_PATH.exec(value)
    if (match) found.add(match[1])
  } else if (value && typeof value === 'object') {
    for (const child of Object.values(value)) assetIdsIn(child, found)
  }
  return found
}

// Removes every stored file of an asset: the original and all its crops.
export async function deleteAssetFiles(assetId) {
  const bucket = supabase.storage.from(BUCKET)
  const { data, error } = await bucket.list(assetId, { limit: 1000 })
  if (error) throw new Error(error.message)
  if (!data.length) return
  const { error: removeError } = await bucket.remove(data.map((file) => `${assetId}/${file.name}`))
  if (removeError) throw new Error(removeError.message)
}

// Fetches a stored original back, to crop it again.
export async function downloadOriginal(path) {
  const { data, error } = await supabase.storage.from(BUCKET).download(path)
  if (error) throw new Error(error.message)
  return data
}

// Cuts `area` ({ x, y, width, height } in the image's own pixels) out of an image file and
// returns it as a JPEG, { blob, width, height }, scaled down to the target size if the cut
// is larger than that. It is never scaled up: a small image stays its own size rather than
// being blurred.
async function cropImage(blob, area, target) {
  const bitmap = await createImageBitmap(blob)
  const scale = Math.min(1, target.width / area.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(area.width * scale)
  canvas.height = Math.round(area.height * scale)
  const context = canvas.getContext('2d')
  // JPEG has no transparency; put white behind images that do.
  context.fillStyle = '#fff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(bitmap, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) =>
        result
          ? resolve({ blob: result, width: canvas.width, height: canvas.height })
          : reject(new Error('Could not crop the image.')),
      'image/jpeg',
      0.88,
    )
  })
}
