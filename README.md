# المولد العراقي الذكي - Debug Runner

## هيكل المشروع الجديد

الآن المشروع مفصل بالكامل! يمكنك اختبار **code.gs** بشكل خارجي باستخدام Node.js.

## الملفات

### 1. **google-mock.js** - محاكاة Google APIs
محاكاة كاملة لجميع خدمات Google:
- `DocumentApp` - لإنشاء وتعديل المستندات
- `PropertiesService` - لحفظ الإعدادات
- `UrlFetchApp` - لاستدعاءات API
- `HtmlService` - للواجهة
- `Logger` - للتسجيل

### 2. **debug-runner.js** - مشغل الاختبارات
يستورد **code.gs** كما هو وينفذه مع Mocks
- يختبر جميع الدوال من code.gs
- يطبع كل خطوة بالتفصيل
- يدعم وضع الاختبار الحقيقي مع API

### 3. **prompts.js** - قوالب الأوامر
تم تحويلها من `promt.gs` إلى Node.js module

### 4. **code-wrapper.js** - مولد كود
يحول `code.gs` للعمل مع Node.js

## طريقة الاستخدام

### التشغيل السريع (Mock Mode)
```bash
node debug-runner.js
```

هذا سيختبر:
- ✓ حفظ واسترجاع API Key
- ✓ توليد مستند كامل مع تفاصيل كل عنصر

### التشغيل مع API حقيقي
```bash
node debug-runner.js --real-api YOUR_GEMINI_API_KEY
```

### عرض المساعدة
```bash
node debug-runner.js --help
```

## مثال المخرجات

```
╔═══════════════════════════════════════════════════════════╗
║     المولد العراقي الذكي - Debug Runner                 ║
║     Testing code.gs with Mocked Google APIs              ║
╚═══════════════════════════════════════════════════════════╝

TEST 1: API Key Management
✓ saveApiKey() worked
✓ getApiKey() retrieved the key

TEST 2: Document Generation
[Mock] DocumentApp.getActiveDocument() called.
[Mock] Body.appendTable
[Mock] Element.setFontFamily: Amiri
[Mock] Element.setAlignment: CENTER
... (كل التفاصيل)
✓ Document generated successfully!
```

## الميزات

✓ **كود منفصل** - code.gs يعمل خارجياً بدون تعديل
✓ **Logging مفصل** - ترى كل دالة Google API تُستدعى
✓ **اختبار سريع** - لا تحتاج Google Apps Script
✓ **Debug سهل** - خطأ واضح مع stack trace كامل
✓ **مرن** - يمكن استخدام Mock أو Real API

## الفوائد

1. **تطوير أسرع** - اختبر الكود بدون نشره
2. **Debug أفضل** - رؤية كل استدعاء API بالتفصيل
3. **Refactoring آمن** - اختبر التغييرات محلياً أولاً
4. **CI/CD جاهز** - يمكن دمجه في automated tests

## الملاحظات

- عند تعديل `code.gs`، شغل `node code-wrapper.js` لتحديث `code-node.js`
- الـ Mocks تحاكي السلوك لكن لا تستدعي Google APIs فعلياً
- للاختبار مع API حقيقي، استخدم `--real-api` flag
