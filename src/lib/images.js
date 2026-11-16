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

// Stores the file exactly as chosen, so it can be cropped again later. Returns its path.
export function uploadOriginal(file) {
  const extension = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : 'jpg'
  return upload(`${crypto.randomUUID()}/original.${extension}`, file)
}

// Stores a crop next to the original it was made from. Returns its path.
export function uploadCropped(originalPath, blob) {
  const folder = originalPath.split('/')[0]
  return upload(`${folder}/cropped-${crypto.randomUUID()}.jpg`, blob)
}

// Fetches a stored original back, to crop it again.
export async function downloadOriginal(path) {
  const { data, error } = await supabase.storage.from(BUCKET).download(path)
  if (error) throw new Error(error.message)
  return data
}

// Cuts `area` ({ x, y, width, height } in the image's own pixels) out of an image file and
// returns it as a JPEG, scaled down to the target size if the cut is larger than that.
// It is never scaled up: a small image stays its own size rather than being blurred.
export async function cropImage(blob, area, target) {
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
      (result) => (result ? resolve(result) : reject(new Error('Could not crop the image.'))),
      'image/jpeg',
      0.88,
    )
  })
}
