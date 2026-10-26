import type { DirEntry, StudySource } from './types.ts';

export type { DirEntry };

const NIFTI_RE = /\.nii(?:\.gz)?$/i;
const DICOM_RE = /\.dcm$/i;
const LABEL_RE = /^(?:mask\.nii(?:\.gz)?|.+-label\.nii(?:\.gz)?)$/i;

export function joinPath(dir: string, name: string): string {
  const root = dir.replace(/\\/g, '/').replace(/\/$/, '');
  return root ? `${root}/${name}` : name;
}

export function parentPath(path: string): string {
  const normalized = path.replace(/\\/g, '/').replace(/\/$/, '');
  const index = normalized.lastIndexOf('/');
  return index < 0 ? '' : normalized.slice(0, index);
}

export function baseName(path: string): string {
  const normalized = path.replace(/\\/g, '/');
  return normalized.slice(normalized.lastIndexOf('/') + 1);
}

function maskName(image: string, names: Set<string>): string | undefined {
  if (/^image\.nii(?:\.gz)?$/i.test(image)) {
    if (names.has('mask.nii.gz')) return 'mask.nii.gz';
    if (names.has('mask.nii')) return 'mask.nii';
  }
  const stem = image.replace(/\.nii(?:\.gz)?$/i, '');
  const gzip = `${stem}-label.nii.gz`;
  const plain = `${stem}-label.nii`;
  if (names.has(gzip)) return gzip;
  if (names.has(plain)) return plain;
  return undefined;
}

/** Pair a directory listing into volumes. Labels are never opened as their own study. */
export function studiesFromListing(dir: string, entries: readonly DirEntry[]): StudySource[] {
  const files = entries.filter((entry) => entry.type === 'file');
  const studies: StudySource[] = [];
  const dicom = files.filter((entry) => DICOM_RE.test(entry.name)).map((entry) => joinPath(dir, entry.name));
  if (dicom.length > 0) {
    dicom.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const title = baseName(dir) || 'DICOM';
    studies.push({ id: `${dir}/*.dcm`, title, kind: 'dicom', imagePaths: dicom });
  }
  const names = new Set(files.map((entry) => entry.name));
  for (const file of files) {
    if (!NIFTI_RE.test(file.name) || LABEL_RE.test(file.name)) continue;
    const mask = maskName(file.name, names);
    studies.push({
      id: joinPath(dir, file.name),
      title: file.name.replace(/\.nii(?:\.gz)?$/i, ''),
      kind: 'nifti',
      imagePaths: [joinPath(dir, file.name)],
      maskPath: mask ? joinPath(dir, mask) : undefined,
    });
  }
  return studies;
}

export function studyForPath(dir: string, entries: readonly DirEntry[], filePath: string): StudySource | undefined {
  const studies = studiesFromListing(dir, entries);
  const name = baseName(filePath);
  return studies.find((study) =>
    study.imagePaths.some((path) => baseName(path) === name)
    || (study.maskPath !== undefined && baseName(study.maskPath) === name),
  ) ?? studies[0];
}
