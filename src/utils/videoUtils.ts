export function isDirectVideoUrl(url?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();
  return trimmed.startsWith("data:video") || trimmed.endsWith(".mp4") || trimmed.endsWith(".webm") || trimmed.endsWith(".ogg") || trimmed.includes("blob:");
}

/**
 * Formats video URLs (YouTube, Google Drive, Vimeo, direct MP4)
 * into proper embeddable iframe or stream URLs.
 */
export function getEmbedVideoUrl(url?: string): string {
  if (!url) return "";
  const trimmed = url.trim();

  // 1. Google Drive Video URLs
  // Formats:
  // https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // https://drive.google.com/file/d/FILE_ID/view
  // https://drive.google.com/file/d/FILE_ID/preview
  // https://drive.google.com/open?id=FILE_ID
  // https://drive.google.com/uc?id=FILE_ID
  if (trimmed.includes("drive.google.com")) {
    const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileDMatch && fileDMatch[1]) {
      return `https://drive.google.com/file/d/${fileDMatch[1]}/preview`;
    }
    const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      return `https://drive.google.com/file/d/${idMatch[1]}/preview`;
    }
  }

  // 2. YouTube Video URLs
  // Formats:
  // https://www.youtube.com/watch?v=VIDEO_ID
  // https://youtu.be/VIDEO_ID
  // https://www.youtube.com/shorts/VIDEO_ID
  // https://www.youtube.com/embed/VIDEO_ID
  if (trimmed.includes("youtube.com") || trimmed.includes("youtu.be")) {
    if (trimmed.includes("/embed/")) {
      return trimmed;
    }
    const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (watchMatch && watchMatch[1]) {
      return `https://www.youtube.com/embed/${watchMatch[1]}`;
    }
    const youtuBeMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (youtuBeMatch && youtuBeMatch[1]) {
      return `https://www.youtube.com/embed/${youtuBeMatch[1]}`;
    }
    const shortsMatch = trimmed.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
    if (shortsMatch && shortsMatch[1]) {
      return `https://www.youtube.com/embed/${shortsMatch[1]}`;
    }
  }

  // 3. Vimeo URLs
  if (trimmed.includes("vimeo.com") && !trimmed.includes("player.vimeo.com")) {
    const vimeoMatch = trimmed.match(/vimeo\.com\/([0-9]+)/);
    if (vimeoMatch && vimeoMatch[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
  }

  return trimmed;
}

export function isGoogleDriveUrl(url?: string): boolean {
  if (!url) return false;
  return url.includes("drive.google.com") || url.includes("docs.google.com");
}

export function getGoogleDriveFileId(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return fileDMatch[1];
  }
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return idMatch[1];
  }
  const openMatch = trimmed.match(/\/open\?id=([a-zA-Z0-9_-]+)/);
  if (openMatch && openMatch[1]) {
    return openMatch[1];
  }
  const ucMatch = trimmed.match(/\/uc\?.*id=([a-zA-Z0-9_-]+)/);
  if (ucMatch && ucMatch[1]) {
    return ucMatch[1];
  }
  const documentDMatch = trimmed.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (documentDMatch && documentDMatch[1]) {
    return documentDMatch[1];
  }
  const spreadDMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (spreadDMatch && spreadDMatch[1]) {
    return spreadDMatch[1];
  }
  return null;
}

/**
 * Returns an embeddable preview URL for Google Drive or Web PDFs
 */
export function getPdfEmbedPreviewUrl(url?: string): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (isGoogleDriveUrl(trimmed)) {
    const fileId = getGoogleDriveFileId(trimmed);
    if (fileId) {
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    if (!trimmed.includes("example.com")) {
      return `https://docs.google.com/gview?url=${encodeURIComponent(trimmed)}&embedded=true`;
    }
  }
  return trimmed;
}

/**
 * Returns a direct download or Google Drive download export link for PDFs/Handouts
 */
export function getPdfDownloadUrl(url?: string): string {
  if (!url) return "#";
  const trimmed = url.trim();
  if (isGoogleDriveUrl(trimmed)) {
    const fileId = getGoogleDriveFileId(trimmed);
    if (fileId) {
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
  }
  return trimmed;
}

/**
 * Returns a Google Drive view/preview link or direct link for PDF viewing
 */
export function getPdfViewUrl(url?: string): string {
  if (!url) return "#";
  const trimmed = url.trim();
  if (isGoogleDriveUrl(trimmed)) {
    const fileId = getGoogleDriveFileId(trimmed);
    if (fileId) {
      return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
    }
  }
  return trimmed;
}
