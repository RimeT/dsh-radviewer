# 医学三维

[English](README.en.md)

DeepSeek Harness 右侧栏里的放射影像查看器。打开 DICOM、NIfTI、NRRD，把配对的 mask 叠在切面上，并用不同颜色画出各类 ROI。

当前版本 **0.1.0-alpha.1**。界面名称是「医学三维」，英文界面是 MedView。斜杠命令是 `/radviewer`。

插件代码使用 [MIT 许可证](LICENSE)。

![cas045 在查看器中的轴位、矢状位、冠状位和三维血管](docs/images/cas045.png)

上图是界面示例。绿色是动脉 mask。界面语言跟随桌面版。这张图对应的影像文件不在本仓库里。

## 安装

需要 DeepSeek Harness 桌面版（在 0.2.1-rc 上用过）。

1. 打开 **Plugins**。
2. **Add plugin** → **Install a third-party plugin**。
3. 在输入框填 npm 包名：

   ```
   dsh-radviewer
   ```

   安装源用官方 npm，或用中国大陆镜像。镜像刚同步时可能还没有这一版，等一两分钟再装，或改回官方源。
4. 装好后完全退出桌面版，再重新打开。右侧会出现「医学三维」。

本机已经克隆仓库时，也可以填这个文件夹的路径。源码在 [github.com/RimeT/dsh-radviewer](https://github.com/RimeT/dsh-radviewer)。

查看器已经打好包，安装时不用在本机编译，也不会带上示例影像。

## 打开一幅图

把 DICOM、NIfTI 或 NRRD 放进当前对话的工作区。

- 右侧点「医学三维」，填写文件夹，扫描，再点开检查。
- 对话里输入 `/radviewer`，后面跟工作区里的文件或文件夹。
- 在对话里 @ 一个 DICOM 文件夹、`.dcm`、`.nii` / `.nii.gz`，或 `.nrrd` / `.nrrd.gz` / `.nhdr`。模型会在右侧标签页打开它。

只输入 `/radviewer` 会打开检查列表。

左键拖动调节窗宽窗位，滚轮翻层，单击放置十字线，中键平移，右键缩放。三维那一格可以旋转。

## 能打开的文件

| 格式 | 路径 |
| --- | --- |
| DICOM | 一个 `.dcm`，或同一文件夹里的一组切片（未压缩 16-bit little-endian） |
| NIfTI | `.nii`、`.nii.gz` |
| NRRD | `.nrrd`、`.nrrd.gz`、`.nhdr`（数据文件放在旁边） |

Mask 和影像放在同一目录，名字成对：

- `image.nii.gz` 配 `mask.nii.gz`，或 `xxx.nii.gz` 配 `xxx-label.nii.gz`
- `image.nrrd` 配 `mask.nrrd`，`vol.nhdr` 配 `vol-label.nhdr`

类别 0 不显示。类别 1 绿色，2 青色，3 品红。

NRRD 可读 raw、gzip、ascii，以及整文件压缩的 `.nrrd.gz`。头里的坐标按 LPS 显示；写成 RAS 时会转到 LPS。bzip2、zstd 和向量 / RGB 不在这一版里。

## 截图里的病例

截图来自 MICCAI 2023 Cerebral Artery Segmentation Challenge（CAS 2023，亦见于 SMRA 2023）的一个训练病例，编号 cas045。任务是从症状性颅内动脉狭窄患者的三维 TOF-MRA 中分割脑动脉。

本仓库只放这张界面图，不附带 `image.nii.gz` 和 `mask.nii.gz`。要看自己的数据，请从竞赛获取，再放到工作区里打开。数据集许可证是 [CC BY-ND 4.0](https://creativecommons.org/licenses/by-nd/4.0/)：可以原样转发，必须署名，改过的数据文件不能再公开传播。MIT 只覆盖本插件的代码。

> Huijun Chen, Xihai Zhao, Haozhong Sun, Jiaqi Dou, Chenlin Du, Runyu Yang, Xiaoqi Lin, Shuwan Yu, Jiachen Liu, Chun Yuan, Niranjan Balu. Cerebral artery segmentation Challenge, MICCAI 2023. Zenodo. [https://doi.org/10.5281/zenodo.7839969](https://doi.org/10.5281/zenodo.7839969)

- 数据说明：[10.5281/zenodo.7839970](https://doi.org/10.5281/zenodo.7839970)
- 竞赛页面：[Codalab](https://codalab.lisn.upsaclay.fr/competitions/9804)
- 介绍：[SMRA CAS 2023](https://society4mra.org/cerebral-artery-segmentation-challenge-cas2023/)

## 改代码

```bash
npm install
npm run build
```

`npm run build` 会重新生成 `client.js`。改完界面后重启桌面版。
