import { appEnv } from './env';
import { SUBMISSION_ASSET_MAX_BYTES } from './constants';
import { getSupabaseBrowserClient } from './supabase';

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24;

function sanitizeFileName(fileName: string) {
  const dotIndex = fileName.lastIndexOf('.');
  const baseName = dotIndex >= 0 ? fileName.slice(0, dotIndex) : fileName;
  const extension = dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : '';

  return `${baseName
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '') || 'submission'}${extension === '.pdf' ? '.pdf' : ''}`;
}

export function validateSubmissionPdf(file: File) {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('PDF 파일만 업로드할 수 있습니다.');
  }

  if (file.size > SUBMISSION_ASSET_MAX_BYTES) {
    throw new Error('PDF 파일은 20MB 이하만 업로드할 수 있습니다.');
  }
}

export async function createSignedSubmissionAssetUrls(paths: string[]) {
  const uniquePaths = [...new Set(paths.filter(Boolean))];
  if (!uniquePaths.length) {
    return new Map<string, string>();
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return new Map<string, string>();
  }

  const { data, error } = await supabase.storage
    .from(appEnv.supabaseSubmissionBucket)
    .createSignedUrls(uniquePaths, SIGNED_URL_TTL_SECONDS);

  if (error) {
    throw error;
  }

  return new Map(
    (data ?? [])
      .filter((entry) => entry.path && entry.signedUrl)
      .map((entry) => [entry.path, entry.signedUrl])
  );
}

export async function uploadSubmissionPdf(file: File, payload: { hackathonId: string; teamId: string }) {
  validateSubmissionPdf(file);

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error('Supabase 설정이 필요합니다.');
  }

  const safeName = sanitizeFileName(file.name);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const path = `${payload.teamId}/${payload.hackathonId}-${timestamp}-${safeName || 'submission.pdf'}`;

  const { error: uploadError } = await supabase.storage
    .from(appEnv.supabaseSubmissionBucket)
    .upload(path, file, {
      upsert: false,
      contentType: 'application/pdf',
      cacheControl: '3600',
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(appEnv.supabaseSubmissionBucket)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (signedUrlError || !signedUrlData?.signedUrl) {
    throw signedUrlError ?? new Error('업로드한 파일 링크를 만들지 못했습니다.');
  }

  return {
    path,
    url: signedUrlData.signedUrl,
  };
}
