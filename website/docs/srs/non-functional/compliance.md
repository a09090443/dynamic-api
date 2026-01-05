---
sidebar_position: 6
---

# 法規與合規要求

本章節定義系統的法規遵循要求。

---

## NFR-COMP-001：開源授權合規

### 描述
系統使用的開源套件應符合授權要求。

### 使用的開源授權

| 授權類型 | 套件 | 說明 |
|---------|------|------|
| **Apache License 2.0** | Spring Boot, Apache CXF | 允許商業使用，需保留版權聲明 |
| **MIT License** | React, Next.js | 允許商業使用，需保留版權聲明 |

### 驗收標準

:::tip 授權管理
- 所有開源套件的授權已檢查
- LICENSE 檔案包含所有引用的授權聲明
:::

---

## 其他法規要求

<!-- TODO: 其他法規要求（如：GDPR、個資法）待評估 -->

### GDPR（歐盟一般資料保護規範）

:::note 評估中
若系統處理歐盟公民個人資料，需符合 GDPR 要求：
- 資料最小化原則
- 使用者同意機制
- 刪除權（Right to be Forgotten）
- 資料可攜權
:::

### 個資法（台灣個人資料保護法）

:::note 評估中
若系統處理個人資料，需符合個資法要求：
- 告知義務
- 當事人同意
- 資料安全維護
- 洩漏通報義務
:::

---

## 合規檢查清單

### 開源授權檢查

```bash
# 產生授權報告
./gradlew generateLicenseReport

# 檢查授權相容性
./gradlew checkLicense
```

### 第三方套件清單

:::warning 定期檢查
建議每季度檢查第三方套件是否有安全漏洞：
- 使用 `npm audit`（前端）
- 使用 `./gradlew dependencyCheckAnalyze`（後端）
:::

---

## 授權檔案範例

```
MIT License

Copyright (c) 2026 Dynamic API Manager Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 參考資源

- Apache License 2.0：https://www.apache.org/licenses/LICENSE-2.0
- MIT License：https://opensource.org/licenses/MIT
- GDPR 官方網站：https://gdpr.eu/
- 台灣個資法：https://law.moj.gov.tw/
