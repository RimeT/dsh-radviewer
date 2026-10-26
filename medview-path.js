/** Workspace path classification shared by the host tool and the sidebar opener. */

const NIFTI_RE = /\.nii(?:\.gz)?$/i;
const DICOM_RE = /\.dcm$/i;
const NRRD_RE = /\.(?:nrrd(?:\.gz)?|nhdr)$/i;

export function normalizeMedicalPath(input) {
  let path = typeof input === 'string' ? input.trim() : '';
  if ((path.startsWith('"') && path.endsWith('"')) || (path.startsWith("'") && path.endsWith("'"))) {
    path = path.slice(1, -1).trim();
  }
  path = path.replace(/\\/g, '/').replace(/^(?:\.\/)+/, '');
  if (path.startsWith('/') && !path.startsWith('//')) path = path.slice(1);
  if (path.length > 1) path = path.replace(/\/+$/, '');
  return path;
}

/** @returns {'dicom' | 'nifti' | 'nrrd' | 'folder' | 'unknown'} */
export function classifyMedicalPath(path) {
  const normalized = normalizeMedicalPath(path);
  if (!normalized) return 'unknown';
  const name = normalized.slice(normalized.lastIndexOf('/') + 1);
  if (NIFTI_RE.test(name)) return 'nifti';
  if (DICOM_RE.test(name)) return 'dicom';
  if (NRRD_RE.test(name)) return 'nrrd';
  if (name.includes('.')) return 'unknown';
  return 'folder';
}

export function describeMedicalPath(path, format) {
  if (!path) return 'MedView：没有给出路径。';
  if (format === 'unknown') return `MedView：${path} 不是 DICOM、NIfTI 或 NRRD。`;
  if (format === 'folder') return `MedView：打开文件夹 ${path} 里的第一套 DICOM、NIfTI 或 NRRD。`;
  return `MedView：打开 ${path}。`;
}

export function sessionFileAddress(sessionId, path) {
  const normalized = normalizeMedicalPath(path);
  const encode = (segment) => encodeURIComponent(segment).replace(/%3A/gi, ':');
  return `dsh-resource://file/session/${encode(sessionId)}/${normalized.split('/').map(encode).join('/')}`;
}
