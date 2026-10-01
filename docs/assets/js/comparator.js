/**
 * @file 比较器页面的交互、lang 差异分析与翻译逻辑。
 */

/* global Vue, axios, $, CryptoJS */

/** 单次批量翻译包含的条目数。 */
const TRANSLATION_BATCH_SIZE = 20;

/** 单批翻译的最大尝试次数。 */
const TRANSLATION_MAX_ATTEMPTS = 2;

/** 批量翻译使用的分隔符。 */
const TRANSLATION_SEPARATOR = '|||SEP|||';

/** 重试翻译前的等待时间（毫秒）。 */
const TRANSLATION_RETRY_DELAY = 1000;

/** 有道 JSONP 请求的超时时间（毫秒）。 */
const YOUDAO_REQUEST_TIMEOUT = 15000;

/** 比较器页面的 Vue 应用。 */
const app = Vue.createApp({
  /**
   * 创建文件、差异项与翻译服务的页面状态。
   *
   * @return {Object} 页面初始状态。
   */
  data() {
    return {
      /**
       * 文件内容解析（key/value）
       */
      // 新版源语言
      menuStringsNewSrc: [],
      // 旧版目标语言
      menuStringsOldTar: [],
      // 旧版源语言
      menuStringsOldSrc: [],
      // 新版源语言文件原始行内容（含注释、空行和缩进）
      newFileRawLines: [],
      // 结果差异
      diffItems: [],

      // 提示
      showOldSrcError: false,
      showNewSrcError: false,
      showOldTarError: false,
      saveMessage: '',
      saveMessageType: 'success',
      // 翻译状态与 API 错误提示
      isTranslating: false,
      errorMsg: null,

      /**
       * API 配置
       */
      // 默认 API
      selectedApi: 'openai',
      // OpenAI API 配置
      openai: {
        apiKey: '',
        // 默认模型
        model: 'gpt-4o-mini',
        temperature: 0.7,
      },
      // DeepSeek API 配置
      deepseek: {
        apiKey: '',
        // 默认模型
        model: 'deepseek-chat',
        temperature: 0.7,
      },
      // 有道 API 配置
      youdao: {
        appKey: '',
        appSecret: '',
        from: 'en',
        to: 'zh-CHS',
      },
      // 默认源语言
      sourceLang: 'auto',
      // 默认目标翻译语言
      translationLang: 'zhCN',

      // 固定翻译词汇
      fixedTranslations: {
        zhCN: [
          // 游戏名词
          {term: 'Bloom', translation: '泛光'},
          {term: 'Fog', translation: '雾'},
          {term: 'Biomes', translation: '生物群系'},
          {term: 'Mesa', translation: '恶地'},
          {term: 'Badland', translation: '恶地'},
          {term: 'Swamp', translation: '沼泽'},
          {term: 'Mushroom Island', translation: '蘑菇岛'},
          {term: 'Savanna', translation: '热带草原'},
          {term: 'Jungle', translation: '丛林'},
          {term: 'Superflat', translation: '超平坦世界'},
          {term: 'Superflat world', translation: '超平坦世界'},
          {term: 'Overworld', translation: '主世界'},
          {term: 'Nether', translation: '下界'},
          {term: 'End', translation: '末地'},
          {term: 'Slime blocks', translation: '黏液块'},

          // 光影名词
          {term: 'Caustics', translation: '焦散'},
          {term: 'DoF', translation: '景深'},
          {term: 'Glow', translation: '辉光'},
          {term: 'Shader', translation: '光影'},
          {term: 'Resource Pack', translation: '材质包'},
          {term: 'Ghosting', translation: '鬼影'},
          {term: 'Realtime Shadows', translation: '实时阴影'},
          {term: 'Light shaft', translation: '光束'},
          {term: 'Lens Flare', translation: '镜头光晕'},
        ],
        zhTW: [
          // 游戏名词
          {term: 'Bloom', translation: '泛光'},
          {term: 'Fog', translation: '霧'},
          {term: 'Biomes', translation: '生態域'},
          {term: 'Mesa', translation: '惡地'},
          {term: 'Badland', translation: '惡地'},
          {term: 'Swamp', translation: '沼澤'},
          {term: 'Mushroom Island', translation: '蘑菇地'},
          {term: 'Savanna', translation: '莽原'},
          {term: 'Jungle', translation: '叢林'},
          {term: 'Superflat', translation: '超平坦世界'},
          {term: 'Superflat world', translation: '超平坦世界'},
          {term: 'Overworld', translation: '主世界'},
          {term: 'Nether', translation: '地獄'},
          {term: 'End', translation: '終界'},
          {term: 'Slime blocks', translation: '史萊姆方塊'},
          // 光影名词
          {term: 'DoF', translation: '景深'},
          {term: 'Glow', translation: '輝光'},
          {term: 'Shader', translation: '光影'},
          {term: 'Resource Pack', translation: '材質包'},
          {term: 'Ghosting', translation: '鬼影'},
          {term: 'Realtime Shadows', translation: '實時陰影'},
          {term: 'Light shaft', translation: '光束'},
          {term: 'Lens Flare', translation: '鏡頭光暈'},
          // 台湾正体独有名词
          // 游戏名词
          // 光影名词
          {term: 'Anti-aliasing', translation: '反鋸齒'},
          {term: 'Load', translation: '載入'},
          {term: 'GPU', translation: '顯示卡'},
          {term: 'Hardcode', translation: '寫死'},
          {term: 'Default', translation: '預設'},
          {term: 'Setting', translation: '設置'},
          {term: 'Noise', translation: '雜訊'},
          {term: 'Video Settings', translation: '影片設置'},
          {term: 'Realtime', translation: '實時'},
          {term: 'Motion Blur', translation: '動態模糊'},
          {term: 'Smart', translation: '智慧'},
          {term: 'Compatible', translation: '相容'},
          {term: 'Horizontal Position', translation: '水準位置'},
        ]
      },

      // 需要保留的专有名词数组
      keepTranslations: [
        'Perlin',
        'Worley',
        'Blocky',
        'Optifine',
      ]
    };
  },
  methods: {
    /**
     * 导出控制台内容为 result.lang 文件。
     */
    exportFile() {
      const content = document.getElementById('textFile').value;
      if (!content.trim()) {
        alert('没有可以导出的内容');
        return;
      }

      const blob = new Blob([content], {type: 'text/plain'});
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'result.lang';
      link.click();

      URL.revokeObjectURL(link.href);
    },

    /**
     * 将控制台内容复制到剪贴板。
     *
     * @return {Promise<void>} 复制操作完成时兑现。
     */
    async copyToClipboard() {
      const content = document.getElementById('textFile').value;
      if (!content.trim()) {
        alert('没有可以复制的内容');
        return;
      }

      try {
        await navigator.clipboard.writeText(content);
      } catch (e) {
        alert('复制失败，请手动复制');
      }
    },

    /**
     * 读取指定源语言或目标语言文件。
     *
     * @param {'newSrc'|'oldTar'|'oldSrc'} type 文件角色。
     */
    loadFile(type) {
      let inputId;
      switch (type) {
        case 'newSrc':
          inputId = 'newSrcFile';
          break;
        case 'oldTar':
          inputId = 'oldTarFile';
          break;
        case 'oldSrc':
          inputId = 'oldSrcFile';
          break;
      }
      const fileInput = document.getElementById(inputId);
      if (!fileInput.files[0]) {
        alert('未选择文件');
        return;
      }
      const reader = new FileReader();
      reader.onload = e => {
        const rawText = e.target.result;
        if (typeof rawText !== 'string') return;
        this.processLangFile(rawText, type);
      };
      reader.readAsText(fileInput.files[0]);
    },

    /**
     * 解析 lang 键值，记录新版源语言文件的原始行。
     *
     * @param {string} content 文件内容。
     * @param {'newSrc'|'oldTar'|'oldSrc'} fileType 文件角色。
     */
    processLangFile(content, fileType) {
      const lines = content.split(/\r?\n/);
      const items = [];
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex === -1) return;
        const key = trimmed.substring(0, eqIndex).trim();
        const value = trimmed.substring(eqIndex + 1).trim();
        items.push({key, value});
      });
      if (fileType === 'newSrc') {
        this.newFileRawLines = lines;
        this.menuStringsNewSrc = items;
      } else if (fileType === 'oldTar') {
        this.menuStringsOldTar = items;
      } else if (fileType === 'oldSrc') {
        this.menuStringsOldSrc = items;
      }
    },

    /**
     * 检测新增、删减和改动的键，并生成目标语言文件。
     */
    compare() {
      this.showNewSrcError = false;
      this.showOldSrcError = false;
      this.showOldTarError = false;

      if (!this.menuStringsNewSrc.length) {
        this.showNewSrcError = true;
        return;
      }
      if (!this.menuStringsOldSrc.length) {
        this.showOldSrcError = true;
        return;
      }
      if (!this.menuStringsOldTar.length) {
        this.showOldTarError = true;
        return;
      }

      this.diffItems = [];
      // 新增：新版中存在但旧版中不存在的键
      this.menuStringsNewSrc.forEach(newItem => {
        const oldItem = this.menuStringsOldSrc.find(o => o.key === newItem.key);
        if (!oldItem) {
          this.diffItems.push({
            key: newItem.key,
            type: 'added',
            newValue: newItem.value,
            color: 'green'
          });
        }
      });
      // 删减：旧版中存在但新版中不存在的键
      this.menuStringsOldSrc.forEach(oldItem => {
        const newItem = this.menuStringsNewSrc.find(n => n.key === oldItem.key);
        if (!newItem) {
          this.diffItems.push({
            key: oldItem.key,
            type: 'removed',
            oldValue: oldItem.value,
            color: 'red'
          });
        }
      });
      // 改动：相同键但内容不同
      this.menuStringsNewSrc.forEach(newItem => {
        const oldItem = this.menuStringsOldSrc.find(o => o.key === newItem.key);
        if (oldItem && oldItem.value !== newItem.value) {
          this.diffItems.push({
            key: newItem.key,
            type: 'changed',
            oldValue: oldItem.value,
            newValue: newItem.value,
            color: 'blue'
          });
        }
      });

      if (!this.diffItems.length) {
        alert('未发现差异');
      }

      this.autoGen();
    },

    /**
     * 判断两个字符串是否相同。
     *
     * @param {string} a 第一个字符串。
     * @param {string} b 第二个字符串。
     * @return {boolean} 两个字符串相同时返回 true。
     */
    isSameString(a, b) {
      // 逻辑层面判断字符串是否相同
      return a === b;
    },

    /**
     * 将字符串转换为不含外围引号的 JSON 转义值。
     *
     * @param {*} str 待转义的值。
     * @return {string} 转义后的字符串。
     */
    escapeJsonValue(str) {
      if (typeof str !== 'string') {
        str = String(str);
      }
      return JSON.stringify(str).slice(1, -1);
    },

    /**
     * 以新版源语言文件为模板，合并旧译文和差异项译文。保留注释、空行、缩进和键的顺序。
     */
    autoGen() {
      // 将旧版汉化转换为字典
      const oldTarDict = {};
      this.menuStringsOldTar.forEach(item => {
        oldTarDict[item.key] = item.value;
      });

      // 构建差异映射表
      const diffMap = {};
      this.diffItems.forEach(d => {
        diffMap[d.key] = d;
      });

      // 匹配 .lang 文件中键值行的正则（忽略注释行）
      const keyValuePattern = /^(\s*)([^#\s].*?)\s*=\s*(.*)$/;
      const resultLines = [];

      // 遍历新版源语言文件原始行，保持注释、空行及顺序
      this.newFileRawLines.forEach(line => {
        if (line.trim().startsWith('#') || line.trim() === '') {
          resultLines.push(line);
          return;
        }
        const match = line.match(keyValuePattern);
        if (!match) {
          resultLines.push(line);
          return;
        }
        const leadingSpaces = match[1];
        const key = match[2].trim();
        const currentValue = match[3];  // 新版源语言文本
        if (diffMap[key]) {
          const diffInfo = diffMap[key];
          if (diffInfo.type === 'removed') {
            // 删减项不输出
            return;
          } else if (diffInfo.type === 'added' || diffInfo.type === 'changed') {
            // 使用自动翻译结果（若有）或新版源语言文本
            const finalValue = diffInfo.translatedValue
                ? this.escapeLangValue(diffInfo.translatedValue)
                : diffInfo.newValue;
            resultLines.push(`${leadingSpaces}${key}=${finalValue}`);
          }
        } else {
          // 无变化时，若旧汉化中有翻译则保留，否则使用新版源语言文本
          const finalValue = (oldTarDict[key] !== undefined) ? oldTarDict[key] : currentValue;
          resultLines.push(`${leadingSpaces}${key}=${finalValue}`);
        }
      });

      document.getElementById('textFile').value = resultLines.join('\n');
    },

    /**
     * 将译文中的实际换行表示为 lang 值中的换行转义，保证每个键占一行。
     *
     * @param {string} value 翻译服务返回的文本。
     * @return {string} 保留已有转义字符的单行 lang 值。
     */
    escapeLangValue(value) {
      return value.replace(/\r\n|\r|\n/g, '\\n');
    },

    /**
     * 自动翻译差异项，并在全部批次成功后重新生成 lang 文件。
     *
     * @return {Promise<void>} 翻译与文件生成完成时兑现。
     */
    async autoTranslate() {
      if (this.isTranslating) {
        return;
      }

      this.showNewSrcError = false;
      this.showOldSrcError = false;
      this.showOldTarError = false;
      this.errorMsg = null;

      // 验证API配置
      if (this.selectedApi === 'openai') {
        if (!this.openai.apiKey) {
          alert('请填写OpenAI API密钥');
          return;
        }
      } else if (this.selectedApi === 'deepseek') {
        if (!this.deepseek.apiKey) {
          alert('请填写DeepSeek API密钥');
          return;
        }
      } else if (this.selectedApi === 'youdao') {
        if (!this.youdao.appKey || !this.youdao.appSecret) {
          alert('请填写有道AppKey和AppSecret');
          return;
        }
      }

      if (!this.diffItems.length) {
        this.compare();
      }

      const toTranslate = this.diffItems.filter(d => (d.type === 'added' || d.type === 'changed'));
      if (!toTranslate.length) {
        alert('没有需要翻译的差异项');
        return;
      }

      this.isTranslating = true;
      try {
        for (let i = 0; i < toTranslate.length; i += TRANSLATION_BATCH_SIZE) {
          const batch = toTranslate.slice(i, i + TRANSLATION_BATCH_SIZE);
          const translations = await this.requestTranslationsWithRetry(batch, this.selectedApi);

          if (!translations) {
            if (!this.errorMsg) {
              this.errorMsg = '翻译结果数量与待翻译条目不一致，已停止生成以避免输出不完整。';
            }
            alert(this.errorMsg);
            return;
          }

          batch.forEach((item, index) => {
            item.translatedValue = translations[index];
          });

          if (i + TRANSLATION_BATCH_SIZE < toTranslate.length) {
            await this.sleep(1500);
          }
        }

        this.autoGen();
        alert('翻译并整理完成');
      } finally {
        this.isTranslating = false;
      }
    },

    /**
     * 分批请求翻译，并在结果不完整时自动重试。
     *
     * @param {Array<{newValue: string}>} batch 本批待翻译条目。
     * @param {'openai'|'deepseek'|'youdao'} provider 翻译服务提供方。
     * @return {Promise<string[]|null>} 完整翻译结果，重试后仍不完整时返回 null。
     */
    async requestTranslationsWithRetry(batch, provider) {
      const query = batch.map(item => item.newValue).join(TRANSLATION_SEPARATOR);

      for (let attempt = 1; attempt <= TRANSLATION_MAX_ATTEMPTS; attempt++) {
        try {
          let translations = [];
          if (provider === 'openai') {
            translations = await this.translateOpenAI(query);
          } else if (provider === 'deepseek') {
            translations = await this.translateDeepSeek(query);
          } else if (provider === 'youdao') {
            translations = await this.translateYoudao(query);
          }

          if (this.isValidTranslationBatch(translations, batch.length)) {
            this.errorMsg = null;
            return translations;
          }
        } catch (error) {
          this.handleTranslationError(error);
        }

        if (attempt < TRANSLATION_MAX_ATTEMPTS) {
          await this.sleep(TRANSLATION_RETRY_DELAY);
        }
      }

      return null;
    },

    /**
     * 判断翻译结果是否完整且有效。
     *
     * @param {Array} translations 翻译结果。
     * @param {number} expectedCount 预期条目数量。
     * @return {boolean} 结果数量一致且每项均为非空字符串时返回 true。
     */
    isValidTranslationBatch(translations, expectedCount) {
      return Array.isArray(translations) &&
          translations.length === expectedCount &&
          translations.every(item => typeof item === 'string' && item.trim());
    },

    /**
     * 将翻译异常转换为界面错误信息。
     *
     * @param {Error} error 翻译过程中产生的异常。
     */
    handleTranslationError(error) {
      if (error && error.response) {
        this.showErrorMsg(error);
        return;
      }

      const message = error && error.message ? error.message : '未知错误';
      this.errorMsg = `翻译失败：${message}`;
      console.error('[handleTranslationError]', error);
    },

    /**
     * 根据语言代码将固定翻译词汇数组格式化为字符串
     * @returns {string} 格式化后的字符串
     */
    formatFixedTranslations() {
      const translations = this.fixedTranslations[this.translationLang] || [];
      return translations.map(item => `- ${item.term}: "${item.translation}"`).join('\n');
    },

    /**
     * 将需要保留的专有名词数组格式化为字符串
     * @returns {string} 格式化后的字符串
     */
    formatKeepTranslations() {
      return this.keepTranslations.map(term => `- ${term}`).join('\n');
    },

    /**
     * 获取源翻译语言
     * @returns {string} 源翻译语言名称
     */
    getSourceLangPrompt() {
      if (this.sourceLang === 'auto') {
        if (this.selectedApi === 'deepseek') {
          return '自动检测源语言';
        } else {
          return 'automatically detect the source language';
        }
      } else if (this.sourceLang === 'en') {
        return 'English';
      } else if (this.sourceLang === 'zhCN') {
        return '简体中文';
      } else if (this.sourceLang === 'zhTW') {
        return '臺灣正體';
      } else {
        return 'automatically detect the source language';
      }
    },

    /**
     * 获取目标翻译语言
     * @returns {string} 目标翻译语言名称
     */
    getTargetLang() {
      if (this.translationLang === 'zhCN') {
        return '简体中文';
      } else if (this.translationLang === 'zhTW') {
        return '臺灣正體';
      } else {
        return '简体中文';
      }
    },

    /**
     * 调用 OpenAI 翻译。
     *
     * @param {string} query 使用约定分隔符连接的翻译内容。
     * @return {Promise<string[]>} 翻译结果数组。
     */
    async translateOpenAI(query) {
      this.errorMsg = null;

      if (!this.openai.apiKey) {
        throw new Error('OpenAI API 密钥未配置。');
      }

      const messages = [
        {
          role: 'system',
          content: `You are a translation expert specializing in Minecraft shader settings. Please translate the following content from ${this.getSourceLangPrompt()} to ${this.getTargetLang()}.
            The following terms should be translated using fixed translations:
            ${this.formatFixedTranslations()}

            The following terms should be kept in their original form without translation:
            ${this.formatKeepTranslations()}

            IMPORTANT: Each piece of text to translate is separated by the delimiter "${TRANSLATION_SEPARATOR}". You MUST use the exact same delimiter "${TRANSLATION_SEPARATOR}" to separate each translated result. Do NOT use newlines as separators between items. Preserve any newlines (\n) that exist within each individual text segment.
            Please note that you should only return the translated text, without engaging in conversation with the user or adding any additional content.`
        },
        {role: 'user', content: query}
      ];
      const isReasoningModel = this.isOpenAIReasoningModel(this.openai.model);
      const data = {
        model: this.openai.model,
        messages
      };
      if (!isReasoningModel) {
        data.temperature = this.openai.temperature;
      }
      const url = 'https://api.openai.com/v1/chat/completions';
      const resp = await axios.post(url, data, {
        headers: {
          'Authorization': `Bearer ${this.openai.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      const result = resp.data?.choices?.[0]?.message?.content;
      if (typeof result !== 'string' || !result.trim()) {
        throw new Error('OpenAI 返回了空内容。');
      }
      return result.split(TRANSLATION_SEPARATOR).map(line => line.trim());
    },

    /**
     * 调用 DeepSeek 翻译。
     *
     * @param {string} query 使用约定分隔符连接的翻译内容。
     * @return {Promise<string[]>} 翻译结果数组。
     */
    async translateDeepSeek(query) {
      this.errorMsg = null;

      if (!this.deepseek.apiKey) {
        throw new Error('DeepSeek API 密钥未配置。');
      }

      const messages = [
        {
          role: 'system',
          content: `你是一名翻译专家，专注于 Minecraft 光影设置的翻译。请将以下内容从${this.getSourceLangPrompt()}翻译为 ${this.getTargetLang()}。其中：
            以下术语应按照固定翻译方式进行翻译：
            ${this.formatFixedTranslations()}
            以下术语应保持原文，不要翻译：
            ${this.formatKeepTranslations()}
            重要：每段待翻译文本之间使用分隔符 "${TRANSLATION_SEPARATOR}" 分隔。你必须使用完全相同的分隔符 "${TRANSLATION_SEPARATOR}" 来分隔每段翻译结果。不要使用换行符作为不同条目之间的分隔。保留每段文本内部原有的换行符（\n）。
            请注意，你只需返回翻译后的文本，不要与用户进行对话，也不要添加任何其他内容。`
        },
        {role: 'user', content: query}
      ];
      const data = {
        model: this.deepseek.model,
        messages,
        temperature: this.deepseek.temperature
      };
      const url = 'https://api.deepseek.com/chat/completions';
      const resp = await axios.post(url, data, {
        headers: {
          'Authorization': `Bearer ${this.deepseek.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      const result = resp.data?.choices?.[0]?.message?.content;
      if (typeof result !== 'string' || !result.trim()) {
        throw new Error('DeepSeek 返回了空内容。');
      }
      return result.split(TRANSLATION_SEPARATOR).map(line => line.trim());
    },

    /**
     * 调用有道翻译。
     *
     * @param {string} query 使用约定分隔符连接的翻译内容。
     * @return {Promise<string[]>} 翻译结果数组。
     */
    async translateYoudao(query) {
      if (!this.youdao.appKey || !this.youdao.appSecret) {
        throw new Error('有道 AppKey 或 AppSecret 未配置。');
      }

      if (this.sourceLang === 'auto' || this.sourceLang === 'en') {
        this.youdao.from = 'en';
      } else if (this.sourceLang === 'zhCN') {
        this.youdao.from = 'zh-CHS';
      } else if (this.sourceLang === 'zhTW') {
        this.youdao.from = 'zh-CHT';
      }

      // 有道 API 不支持自定义分隔符，逐条翻译以避免含 \n 的值导致错位
      const items = query.split(TRANSLATION_SEPARATOR);
      const results = [];
      for (const item of items) {
        const text = item.trim();
        if (!text) {
          results.push('');
          continue;
        }
        const salt = this.createSalt();
        const curtime = Math.round(Date.now() / 1000);
        const sign = this.buildSign(text, salt, curtime);
        const url = 'https://openapi.youdao.com/api';
        const data = {
          q: text,
          appKey: this.youdao.appKey,
          salt,
          from: this.youdao.from,
          to: this.youdao.to,
          sign,
          signType: 'v3',
          curtime,
        };
        const translated = await new Promise((resolve, reject) => {
          $.ajax({
            url,
            type: 'POST',
            dataType: 'jsonp',
            data,
            timeout: YOUDAO_REQUEST_TIMEOUT,
            success: function (data) {
              if (data.errorCode !== '0') {
                reject(new Error(`有道翻译失败，错误码：${data.errorCode}`));
                return;
              }
              const translation = data.translation && data.translation[0];
              if (typeof translation !== 'string' || !translation.trim()) {
                reject(new Error('有道翻译返回了空内容。'));
                return;
              }
              resolve(translation.trim());
            },
            error: function (xhr, status) {
              const message = status === 'timeout'
                  ? '有道翻译请求超时。'
                  : `有道翻译请求失败：${status || '网络错误'}`;
              reject(new Error(message));
            }
          });
        });
        results.push(translated);
      }
      return results;
    },

    /**
     * 生成有道请求使用的随机 salt。
     *
     * @return {string} 包含时间戳和随机值的 salt。
     */
    createSalt() {
      return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    },

    /**
     * 构建有道翻译签名。
     *
     * @param {string} query 待翻译文本。
     * @param {string} salt 请求随机值。
     * @param {number} curtime 当前 Unix 时间戳（秒）。
     * @return {string} 有道 v3 签名。
     */
    buildSign(query, salt, curtime) {
      const str = this.youdao.appKey + this.truncate(query) + salt + curtime + this.youdao.appSecret;
      return CryptoJS.SHA256(str).toString(CryptoJS.enc.Hex);
    },

    /**
     * 按有道 v3 签名规则截取待翻译文本。
     *
     * @param {string} q 待翻译文本。
     * @return {string} 短文本本身或由首尾各十个字符与长度组成的签名输入。
     */
    truncate(q) {
      const len = q.length;
      if (len <= 20) return q;
      return q.substring(0, 10) + len + q.substring(len - 10, len);
    },

    /**
     * 等待指定时长。
     *
     * @param {number} time 等待时间（毫秒）。
     * @return {Promise<void>} 等待结束时兑现。
     */
    sleep(time) {
      return new Promise((resolve) => setTimeout(resolve, time));
    },

    /**
     * 判断 OpenAI 模型是否支持推理强度设置。
     *
     * @param {string} modelId 模型标识。
     * @return {boolean} 是否支持推理强度设置。
     */
    isOpenAIReasoningModel(modelId) {
      if (typeof modelId !== 'string') {
        return false;
      }

      const normalizedId = modelId.trim().toLowerCase();
      if (normalizedId.includes('-chat')) {
        return false;
      }
      if (/^o\d/.test(normalizedId)) {
        return true;
      }

      const versionMatch = /^gpt-(\d+(?:\.\d+)?)/.exec(normalizedId);
      return Boolean(versionMatch) && Number(versionMatch[1]) >= 5;
    },

    /**
     * 保存API配置
     */
    saveKeys() {
      // 获取 AppKey和 AppSecret 或 OpenAI API 密钥的表单内容
      if (this.selectedApi === 'openai') {
        const apiKey = this.openai.apiKey;
        const model = this.openai.model;

        if (!apiKey) {
          this.saveMessage = '请填写OpenAI API密钥';
          this.saveMessageType = 'error';
          return;
        }
        if (!model) {
          this.saveMessage = '请选择OpenAI模型';
          this.saveMessageType = 'error';
          return;
        }

        this.openai.apiKey = apiKey;
        this.openai.model = model;
        this.saveMessage = 'OpenAI API配置已保存';
        this.saveMessageType = 'success';

      } else if (this.selectedApi === 'deepseek') {
        const apiKey = this.deepseek.apiKey;
        const model = this.deepseek.model;

        if (!apiKey) {
          this.saveMessage = '请填写DeepSeek API密钥';
          this.saveMessageType = 'error';
          return;
        }

        this.deepseek.apiKey = apiKey;
        this.deepseek.model = model;
        this.saveMessage = 'DeepSeek API配置已保存';
        this.saveMessageType = 'success';

      } else if (this.selectedApi === 'youdao') {
        const appKey = this.youdao.appKey;
        const appSecret = this.youdao.appSecret;

        if (!appKey) {
          this.saveMessage = '请填写有道AppKey';
          this.saveMessageType = 'error';
          return;
        }
        if (!appSecret) {
          this.saveMessage = '请填写有道AppSecret';
          this.saveMessageType = 'error';
          return;
        }

        this.youdao.appKey = appKey;
        this.youdao.appSecret = appSecret;
        this.saveMessage = '有道API配置已保存';
        this.saveMessageType = 'success';
      }
    },

    /**
     * 将 API 错误转换为包含 HTTP 状态和服务端详情的页面提示。
     *
     * @param {Error} error API 请求异常。
     */
    showErrorMsg(error) {
      let errorMessage = 'API 错误：';

      // 提取后端返回的具体错误信息（OpenAI / DeepSeek 等均遵循 { error: { message, code, type } } 结构）
      const apiErr = error.response && error.response.data && error.response.data.error;
      const apiCode = apiErr && (apiErr.code || apiErr.type);
      const apiMsg = apiErr && apiErr.message;

      if (error.response) {
        const status = error.response.status;
        switch (status) {
          case 400:
            errorMessage += '请求参数错误';
            break;
          case 401:
            errorMessage += 'API 密钥无效或未授权';
            break;
          case 402:
            errorMessage += '账户余额不足或需要付费';
            break;
          case 403:
            errorMessage += '访问被拒绝（地区/权限受限）';
            break;
          case 404:
            errorMessage += 'API 端点不存在';
            break;
          case 429:
            if (apiCode === 'insufficient_quota') {
              errorMessage += '账户额度不足（insufficient_quota），请检查计费与余额';
            } else if (apiCode === 'billing_hard_limit_reached') {
              errorMessage += '已达到账户消费硬性上限（billing_hard_limit_reached）';
            } else if (apiCode === 'rate_limit_exceeded') {
              errorMessage += '请求过于频繁（rate_limit_exceeded）';
            } else {
              errorMessage += '请求被限流或额度不足（429）';
            }
            break;
          case 500:
            errorMessage += '服务器内部错误';
            break;
          case 502:
            errorMessage += '网关错误';
            break;
          case 503:
            errorMessage += '服务暂时不可用';
            break;
          case 504:
            errorMessage += '网关超时';
            break;
          default:
            errorMessage += `未知错误 (HTTP ${status})`;
        }

        // 附带后端返回的具体 code 与 message，便于排查
        const detailParts = [];
        if (apiCode) detailParts.push(`code=${apiCode}`);
        if (apiMsg) detailParts.push(apiMsg);
        if (!detailParts.length && error.message) detailParts.push(error.message);
        if (detailParts.length) {
          errorMessage += `（${detailParts.join('；')}）`;
        }
      } else if (error.request) {
        errorMessage += '无法连接到服务器';
        if (error.message) errorMessage += `（${error.message}）`;
      } else {
        errorMessage += '请求配置错误';
        if (error.message) errorMessage += `（${error.message}）`;
      }

      this.errorMsg = errorMessage;
      console.error('[showErrorMsg]', error.response || error);
    }
  }
});

app.mount('#app');
