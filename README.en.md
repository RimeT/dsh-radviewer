# MedView

[中文](README.md)

A radiology viewer for the DeepSeek Harness right sidebar. It opens DICOM, NIfTI, and NRRD, overlays a paired mask on the slices, and draws each ROI class in its own color.

This release is 0.1.0-alpha.2. The English tab name is MedView; the Chinese tab name is 医学三维. The slash command is `/radviewer`.

## Requirements

DeepSeek Harness desktop 0.2.1-rc.

## Install

1. Open **Plugins**.
2. Choose **Add plugin** → **Install a third-party plugin**.
3. Set the install source to the official npm registry: `https://registry.npmjs.org/`.
4. Enter the package name:

   ```
   dsh-radviewer
   ```

5. Quit the desktop app completely, then open it again. MedView appears in the right sidebar.

Until it finishes syncing, the China mirror (`https://registry.npmmirror.com/`) resolves this name to the placeholder `0.0.0-stage`. Install from the official registry.

If the repository is already cloned, the local directory path can be used instead. Source: [github.com/RimeT/dsh-radviewer](https://github.com/RimeT/dsh-radviewer).

## Open a study

Place a DICOM series, NIfTI, or NRRD file in the current chat workspace.

- Open MedView on the right, enter a folder, scan, and open a study.
- In chat, enter `/radviewer` followed by a workspace path. `/radviewer` alone opens the study list.
- @-mention a DICOM folder, a `.dcm` file, a `.nii` / `.nii.gz`, or a `.nrrd` / `.nrrd.gz` / `.nhdr`.

Drag with the left button to change window width and level, scroll to step through slices, click to place the crosshair, pan with the middle button, and zoom with the right button. The 3D viewport supports orbit.

## File formats

| Format | Path |
| --- | --- |
| DICOM | One `.dcm`, or one directory of uncompressed 16-bit little-endian slices |
| NIfTI | `.nii`, `.nii.gz` |
| NRRD | `.nrrd`, `.nrrd.gz`, `.nhdr` (data file beside the header) |

The mask sits in the same directory as the image, under a paired name:

- `image.nii.gz` with `mask.nii.gz`, or `xxx.nii.gz` with `xxx-label.nii.gz`
- `image.nrrd` with `mask.nrrd`, or `vol.nhdr` with `vol-label.nhdr`

Class 0 is hidden. Class 1 is green, class 2 is cyan, and class 3 is magenta.

NRRD encoding may be raw, gzip, or ascii, including a gzip-wrapped `.nrrd.gz`. Coordinates are displayed in LPS; a RAS header is converted to LPS. bzip2, zstd, and vector or RGB volumes are outside this release.

## Example

![cas045: axial, sagittal, coronal, and 3D vessels](docs/images/cas045.png)

The figure shows training case cas045 from the MICCAI 2023 Cerebral Artery Segmentation Challenge (CAS 2023). The task is segmentation of cerebral arteries on 3D TOF-MRA in patients with symptomatic intracranial artery stenosis.

> Huijun Chen, Xihai Zhao, Haozhong Sun, Jiaqi Dou, Chenlin Du, Runyu Yang, Xiaoqi Lin, Shuwan Yu, Jiachen Liu, Chun Yuan, Niranjan Balu. Cerebral artery segmentation Challenge, MICCAI 2023. Zenodo. [https://doi.org/10.5281/zenodo.7839969](https://doi.org/10.5281/zenodo.7839969)

- Data record: [10.5281/zenodo.7839970](https://doi.org/10.5281/zenodo.7839970)
- Challenge: [Codalab](https://codalab.lisn.upsaclay.fr/competitions/9804)
- Overview: [SMRA CAS 2023](https://society4mra.org/cerebral-artery-segmentation-challenge-cas2023/)

## Development

```bash
npm install
npm run build
```

After a UI change, run `npm run build` again and restart the desktop app.

## License

The plugin code is released under the [MIT License](LICENSE).
