import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const imageCache = {};

const BUCKET_CANDIDATES = [
  'profile-attachments',
  'user-profiles',
  'profiles',
  'user-images',
  'avatars',
  'group-images',
];

const extractFileInfo = (url) => {
  if (!url) {
    return { bucket: null, path: null };
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return { bucket: null, path: url };
  }

  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    for (const bucket of BUCKET_CANDIDATES) {
      const marker = `/${bucket}/`;
      const idx = pathname.indexOf(marker);
      if (idx !== -1) {
        const afterBucket = pathname.substring(idx + marker.length);
        const cleanPath = afterBucket.split('?')[0];
        return { bucket, path: cleanPath };
      }
    }

    const publicMarker = '/storage/v1/object/public/';
    const publicIdx = pathname.indexOf(publicMarker);
    if (publicIdx !== -1) {
      const afterPublic = pathname.substring(publicIdx + publicMarker.length);
      const [bucket, ...rest] = afterPublic.split('/');
      return { bucket, path: rest.join('/').split('?')[0] };
    }

    const cleanPath = pathname.replace(/^\/+/, '').split('?')[0];
    return { bucket: null, path: cleanPath };
  } catch (e) {
    return { bucket: null, path: null };
  }
};

const useSignedProfileImage = (imageUrl) => {
  const [resolvedUrl, setResolvedUrl] = useState(imageUrl || null);

  useEffect(() => {
    let isMounted = true;

    if (!imageUrl) {
      setResolvedUrl(null);
      return () => {
        isMounted = false;
      };
    }

    const cached = imageCache[imageUrl];
    if (cached && cached.expiresAt > Date.now()) {
      setResolvedUrl(cached.signedUrl);
      return () => {
        isMounted = false;
      };
    }

    const { bucket: initialBucket, path } = extractFileInfo(imageUrl);

    if (!path) {
      setResolvedUrl(imageUrl);
      return () => {
        isMounted = false;
      };
    }

    const fetchSignedUrl = async () => {
      const bucketsToTry = initialBucket
        ? [initialBucket, ...BUCKET_CANDIDATES.filter((bucket) => bucket !== initialBucket)]
        : BUCKET_CANDIDATES;

      for (const bucket of bucketsToTry) {
        try {
          const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(path, 3600);

          if (!error && data?.signedUrl) {
            const expiresAt = Date.now() + 3600 * 1000 - 60000; // 1 hour minus 1 minute
            imageCache[imageUrl] = {
              signedUrl: data.signedUrl,
              expiresAt,
            };
            if (isMounted) {
              setResolvedUrl(data.signedUrl);
            }
            return;
          }
        } catch (e) {
          // continue to next bucket
        }
      }

      if (isMounted) {
        setResolvedUrl(imageUrl);
      }
    };

    fetchSignedUrl();

    return () => {
      isMounted = false;
    };
  }, [imageUrl]);

  return resolvedUrl;
};

export default useSignedProfileImage;

