# Minecraft 语言文件自动本地化工具

中文 | [English](#minecraft-language-file-auto-localisation-tool)

---

### 目录

[介绍](#介绍) | [功能](#功能) | [引用](#引用) | [安装](#安装) | [使用方法](#使用方法) | [配置详情](#配置详情) | [故障排除](#故障排除) | [许可证](#许可证)

### 介绍

一款基于网页的 Minecraft `.lang` 语言文件自动本地化工具，支持同一文件的更新翻译。  
通过对比旧版与新版的源语言文件以及旧版翻译文件，检测出新增、删减和改动的条目，  
然后利用翻译 API 自动生成翻译结果，最终生成可直接使用的本地化语言文件。

### 功能

- 自动检测源语言文件中的新增、删减和改动，并用不同颜色标识。
- 支持选择源语言（自动检测、英文、简体中文、臺灣正體、<待添加>）和目标翻译语言（简体中文、臺灣正體、<待添加>）。
- 集成 OpenAI 和 DeepSeek API。（DeepSeek API 未经测试，当前没有测试条件）
- 固定翻译词汇根据目标语言自动调整，保证 Minecraft 专业术语的一致性。
- 生成的本地化文件格式符合 Minecraft 语言文件要求，可直接覆盖原文件。

### 引用

代码继承自项目 [gitkraken-chinese](https://github.com/yk47g/gitkraken-chinese) 中 [@DreamSaddle](https://github.com/DreamSaddle) 构建的 `compare.html` 文件。  
该项目目前主要由本人维护，并逐渐更新为现在的 `comparator.html`。  
由于本人也有 BSL 光影的汉化项目，因此将 `comparator.html` 改写为适配 Minecraft `.lang` 文件的版本。

### 安装

1. 克隆项目仓库
2. 启动本地服务器（推荐使用 VS Code 的 Live Server 插件或其他静态服务器）
3. 在浏览器中访问

### 使用方法

1. 填写“API 配置”区域
2. 分别上传旧版源语言文件、新版源语言文件和旧版翻译文件（均为 `.lang` 格式）。
3. 点击【对比】按钮检测文件差异，然后点击【自动翻译】按钮自动生成翻译。
4. 使用【导出 lang 文件】或【复制到剪切板】获取生成的本地化文件，覆盖原有文件后重启 Minecraft。
5. 如果要从头开始创建一个本地化文件，则在“旧版源语言文件”和“旧版翻译文件”中上传空的 `.lang` 文件。

### 配置详情

- **固定翻译词汇：** 固定翻译词汇会根据目标语言（简体中文或臺灣正體）自动更新，保证 Minecraft 专业术语的一致性。如果有新的点子请
  [加入讨论](https://github.com/YuanXiQWQ/lang-localisation-tool/discussions) 或
  [提交 Issue](https://github.com/YuanXiQWQ/lang-localisation-tool/issues)。

### 故障排除

- **API 调用失败：** 检查 API 配置是否正确，网络连接是否正常；对于 DeepSeek，请关注其服务状态。
- **无差异提示：** 请确认新版与旧版源语言文件确实存在差异。

### 许可证

本项目采用 [AGPLv3](https://www.gnu.org/licenses/agpl-3.0.html) 许可证。该许可证拥有下列非正式翻译版本，仅供参考。

[简体中文](https://www.chinasona.org/gnu/agpl-3.0-cn.html) | [臺灣正體](https://www.chinasona.org/gnu/agpl-3.0-tw.html)

---

# Minecraft Language File Auto-Localisation Tool

[中文](#minecraft-语言文件自动本地化工具) | English

---

### Table of Contents

[Introduction](#introduction) | [Features](#features) | [Credits](#credits) | [Installation](#installation) | [Usage](#usage) | [Configuration Details](#configuration-details) | [Troubleshooting](#troubleshooting) | [Licence](#licence)

### Introduction

A web-based tool for automatically localising Minecraft `.lang` language files. It supports updating translations within the same file by comparing the old and new source language files as well as the previous translation file. The tool detects added, removed, and modified entries, then uses a translation API to automatically generate the translated results, ultimately producing a localisation file that can be used directly.

### Features

- Automatically detects new, removed, and modified entries in the source language file, highlighting them in different colours.
- Supports selection of source language (auto-detect, English, Simplified Chinese, Traditional Chinese (Taiwan), <to be added>) and target translation language (Simplified Chinese, Traditional Chinese (Taiwan), <to be added>).
- Integrates with OpenAI and DeepSeek APIs. (Note: DeepSeek API has not been tested due to current limitations.)
- Automatically adjusts fixed translation terms based on the target language to ensure consistency in Minecraft-specific terminology.
- Generates localisation files in a format compliant with Minecraft language file requirements, allowing direct replacement of the original file.

### Credits

The code is derived from the [gitkraken-chinese](https://github.com/yk47g/gitkraken-chinese) project, specifically from the `compare.html` file constructed by [@DreamSaddle](https://github.com/DreamSaddle).  
This project is primarily maintained by me and is gradually being updated to the current `comparator.html`.  
Since I also manage a BSL shader Chinese localisation project, I have adapted `comparator.html` to suit Minecraft `.lang` files.

### Installation

1. Clone the project repository.
2. Start a local server (using VS Code’s Live Server plugin, or any other static server is recommended).
3. Access the tool via your web browser.

### Usage

1. Fill in the "API Configuration" section.
2. Upload the old source language file, the new source language file, and the old translation file (all in `.lang` format) respectively.
3. Click the **Compare** button to detect file differences, then click the **Auto Translate** button to generate the translations automatically.
4. Use the **Export lang File** or **Copy to Clipboard** option to retrieve the generated localisation file. Replace the original file and restart Minecraft.
5. If you wish to create a localisation file from scratch, upload an empty `.lang` file for both the "old source language file" and the "old translation file."

### Configuration Details

- **Fixed Translation Terms:** The fixed translation terms will be updated automatically based on the target language (Simplified Chinese or Traditional Chinese (Taiwan)) to ensure consistency in Minecraft-specific terminology. If you have new ideas, please  
  [join the discussion](https://github.com/YuanXiQWQ/lang-localisation-tool/discussions) or  
  [submit an Issue](https://github.com/YuanXiQWQ/lang-localisation-tool/issues).

### Troubleshooting

- **API Call Failure:** Check whether the API configuration is correct and if the network connection is stable. For DeepSeek, please monitor its service status.
- **No Difference Detected:** Ensure that there are indeed differences between the new and old source language files.

### Licence

This project is licenced under the [AGPLv3](https://www.gnu.org/licenses/agpl-3.0.en.html) licence.
This licence has
[unofficial translated versions](https://www.gnu.org/licenses/translations.en.html), for reference only.