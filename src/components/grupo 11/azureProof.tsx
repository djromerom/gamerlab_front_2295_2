import React, { useEffect, useRef, useState } from 'react'
import { uploadImage, getImageUrl, UploadResult } from './azureFile.ts'

// Small example component to upload an image and display it using the
// backend helpers in `azureFile.ts`. The component handles previewing the
// local file, uploading, then requesting a temporary URL from the backend.
// If the temporary URL expires (image fails to load), the component will
// attempt to refresh the URL a few times by calling `getImageUrl` again.

export const AzureProof: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // track retry attempts when image fails to load (likely expired token)
  const retryRef = useRef(0)

  useEffect(() => {
    if (!file) {
      setLocalPreview(null)
      return
    }

    const url = URL.createObjectURL(file)
    setLocalPreview(url)
    return () => {
      URL.revokeObjectURL(url)
      setLocalPreview(null)
    }
  }, [file])

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setError(null)
    const f = e.target.files?.[0] ?? null
    setFile(f)
    // reset previous state
    setUploadResult(null)
    setImageUrl(null)
    retryRef.current = 0
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const result = await uploadImage(file)
      setUploadResult(result)

      // immediately request a temporary URL to display the image
      const url = await getImageUrl(result.id)
      setImageUrl(url)
      retryRef.current = 0
    } catch (err: any) {
      setError(err?.message ?? String(err))
    } finally {
      setLoading(false)
    }
  }

  // try to refresh temporary URL if the image fails to load (token expired)
  const refreshUrl = async () => {
    if (!uploadResult) return
    setError(null)
    try {
      const url = await getImageUrl(uploadResult.id)
      setImageUrl(url)
    } catch (err: any) {
      setError(err?.message ?? String(err))
    }
  }

  const handleImgError = () => {
    // attempt a few refreshes when the token expires; after that show error
    if (retryRef.current < 3) {
      retryRef.current += 1
      refreshUrl()
    } else {
      setError('Unable to load image after several attempts (token may be expired).')
    }
  }

  return (
    <div className="max-w-[700px] mx-auto p-4">
      <h3 className="text-lg font-semibold mb-3">Azure image upload demo</h3>

      <div className="mb-3">
        <label htmlFor="azure-proof-file" className="block text-sm font-medium text-gray-700 mb-1">Select an image</label>
        <input id="azure-proof-file" type="file" accept="image/*" onChange={onFileChange} className="block" />
      </div>

      {localPreview && (
        <div className="mb-3">
          <strong>Local preview (before upload):</strong>
          <div>
            <img src={localPreview} alt="preview" className="max-w-full max-h-[300px] mt-2 block" />
          </div>
        </div>
      )}

      <div className="mb-3">
        <button onClick={handleUpload} disabled={!file || loading} className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
          {loading ? 'Uploading...' : 'Upload image'}
        </button>
      </div>

      {error && (
        <div className="text-red-600 mb-3">
          <strong>Error:</strong> {error}
        </div>
      )}

      {uploadResult && (
        <div className="mb-3">
          <h4 className="font-medium">Upload metadata</h4>
          <pre className="whitespace-pre-wrap bg-gray-100 p-2">{JSON.stringify(uploadResult, null, 2)}</pre>
        </div>
      )}

      {imageUrl && (
        <div className="mb-3">
          <h4 className="font-medium">Remote image (temporary URL)</h4>
          <img src={imageUrl} alt="uploaded" className="max-w-full max-h-[500px] block" onError={handleImgError} />

          <div className="mt-2">
            <button onClick={refreshUrl} disabled={!uploadResult} className="px-3 py-1 bg-gray-200 rounded">
              Refresh URL
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AzureProof
