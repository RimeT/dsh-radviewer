# 医学三维

[English](README.en.md)

DeepSeek Harness 右侧栏中的放射影像查看器。支持 DICOM、NIfTI 与 NRRD，可在切面上叠加配对 mask，并以不同颜色显示各类 ROI。

当前版本 0.1.0-alpha.2。中文界面名称为「医学三维」，英文为 MedView。斜杠命令为 `/radviewer`。

## 环境

DeepSeek Harness 桌面版 0.2.1-rc。

## 安装

1. 打开 **Plugins**。
2. 选择 **Add plugin** → **Install a third-party plugin**。
3. 安装源选择官方 npm registry：`https://registry.npmjs.org/`。
4. 填入包名：

   ```
   dsh-radviewer
   ```

5. 安装完成后完全退出并重新打开桌面版。右侧栏出现「医学三维」。

中国大陆镜像（`https://registry.npmmirror.com/`）在同步完成前会解析到占位版本 `0.0.0-stage`。请改用官方 registry 安装。

已克隆本仓库时，也可填入仓库目录路径。源码：[github.com/RimeT/dsh-radviewer](https://github.com/RimeT/dsh-radviewer)。

## 打开检查

将 DICOM、NIfTI 或 NRRD 置于当前对话的工作区。

- 在右侧打开「医学三维」，填写文件夹并扫描，然后打开检查。
- 在对话中输入 `/radviewer` 及工作区路径。仅输入 `/radviewer` 时打开检查列表。
- 在对话中 @ DICOM 文件夹、`.dcm`、`.nii` / `.nii.gz`，或 `.nrrd` / `.nrrd.gz` / `.nhdr`。

左键拖动调节窗宽窗位，滚轮切换层面，单击设置十字线，中键平移，右键缩放。三维视窗支持旋转。

## 文件格式

| 格式 | 路径 |
| --- | --- |
| DICOM | 单个 `.dcm`，或同一目录中的未压缩 16-bit little-endian 序列 |
| NIfTI | `.nii`、`.nii.gz` |
| NRRD | `.nrrd`、`.nrrd.gz`、`.nhdr`（数据文件与头文件同目录） |

Mask 与影像位于同一目录，文件名成对：

- `image.nii.gz` 与 `mask.nii.gz`，或 `xxx.nii.gz` 与 `xxx-label.nii.gz`
- `image.nrrd` 与 `mask.nrrd`，或 `vol.nhdr` 与 `vol-label.nhdr`

类别 0 不显示。类别 1 为绿色，2 为青色，3 为品红。

NRRD 支持 raw、gzip、ascii，以及整文件 gzip 的 `.nrrd.gz`。坐标按 LPS 显示；头文件标明 RAS 时转换为 LPS。bzip2、zstd，以及向量或 RGB 体数据不在本版本范围内。

## 示例

![cas045 的轴位、矢状位、冠状位与三维血管](docs/images/cas045.png)

截图所示为 MICCAI 2023 Cerebral Artery Segmentation Challenge（CAS 2023）训练病例 cas045。该挑战的任务是在症状性颅内动脉狭窄患者的三维 TOF-MRA 上分割脑动脉。

> Huijun Chen, Xihai Zhao, Haozhong Sun, Jiaqi Dou, Chenlin Du, Runyu Yang, Xiaoqi Lin, Shuwan Yu, Jiachen Liu, Chun Yuan, Niranjan Balu. Cerebral artery segmentation Challenge, MICCAI 2023. Zenodo. [https://doi.org/10.5281/zenodo.7839969](https://doi.org/10.5281/zenodo.7839969)

- 数据说明：[10.5281/zenodo.7839970](https://doi.org/10.5281/zenodo.7839970)
- 竞赛：[Codalab](https://codalab.lisn.upsaclay.fr/competitions/9804)
- 介绍：[SMRA CAS 2023](https://society4mra.org/cerebral-artery-segmentation-challenge-cas2023/)

## 开发

```bash
npm install
npm run build
```

修改界面后需重新执行 `npm run build` 并重启桌面版。

## 许可证

插件代码采用 [MIT 许可证](LICENSE)。
