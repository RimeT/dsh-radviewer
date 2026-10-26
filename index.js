import { classifyMedicalPath, describeMedicalPath, normalizeMedicalPath } from './medview-path.js';

export const inject = ['tools', 'commands', 'systemPrompt'];

const OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    path: { type: 'string' },
    format: { type: 'string', enum: ['dicom', 'nifti', 'nrrd', 'folder', 'unknown'] },
    supported: { type: 'boolean' },
    message: { type: 'string' },
  },
  required: ['path', 'format', 'supported', 'message'],
};

const PROMPT = `MedView shows DICOM (.dcm, including a folder of slices), NIfTI (.nii, .nii.gz), and NRRD (.nrrd, .nrrd.gz, .nhdr) in the right sidebar, with a mask when one is paired beside the volume. When the user @-mentions or otherwise points at a workspace file or folder of those images, call medview_open with the workspace-relative path. Pass the file when they named a file. Pass the directory that directly contains the slices or the volume when they named a folder. Do not decode the pixels yourself. The user can also type /radviewer and a path.`;

function outcome(rawPath) {
  const path = normalizeMedicalPath(rawPath);
  const format = path ? classifyMedicalPath(path) : 'unknown';
  const supported = format === 'dicom' || format === 'nifti' || format === 'nrrd' || format === 'folder';
  return { path, format, supported, message: describeMedicalPath(path, format) };
}

export function apply(ctx) {
  ctx.effect(() => ctx.systemPrompt.section({
    name: 'medview',
    order: 720,
    interpolate: false,
    text: PROMPT,
  }));

  ctx.effect(() => ctx.tools.register({
    name: 'medview_open',
    description: 'Open a DICOM, NIfTI, or NRRD medical volume in the MedView sidebar tab. Use this when the user @-mentions or otherwise points at a .dcm file, a folder of DICOM slices, a .nii or .nii.gz volume, or a .nrrd, .nrrd.gz, or .nhdr file. Argument path is the workspace-relative file or directory.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Workspace-relative path of a DICOM file, a DICOM series folder, a NIfTI volume, an NRRD file, or a folder that directly contains one of those.',
        },
      },
      required: ['path'],
    },
    output: {
      schema: OUTPUT_SCHEMA,
      render(_args, value) {
        return [{ type: 'text', text: value.message }];
      },
      presentationMeta(_args, value) {
        return {
          medview: 'open',
          path: value.path,
          format: value.format,
          supported: value.supported,
        };
      },
    },
    isConcurrencySafe() {
      return true;
    },
    async execute(args, exec) {
      exec.signal.throwIfAborted();
      const raw = args && typeof args === 'object' ? args.path : '';
      return outcome(raw);
    },
  }));

  ctx.effect(() => ctx.commands.register({
    name: 'radviewer',
    description: '在右侧标签页打开 DICOM、NIfTI 或 NRRD 三维影像',
    input: { hint: '工作区里的文件或文件夹' },
    handler(invocation) {
      const path = normalizeMedicalPath(invocation.rawInput);
      if (!path) return { kind: 'success', text: '打开医学三维检查列表。' };
      const result = outcome(path);
      if (!result.supported) return { kind: 'error', text: result.message };
      return { kind: 'success', text: result.message };
    },
  }));
}
