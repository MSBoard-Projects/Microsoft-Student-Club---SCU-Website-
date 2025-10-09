# ✅ تم إصلاح مشكلة تسجيل الدخول - دليل الاختبار

## 🔧 المشاكل التي تم إصلاحها:

### 1️⃣ **مشكلة CORS**
- ❌ **قبل**: Backend يسمح فقط بـ `localhost:3000`
- ✅ **بعد**: Backend يسمح بـ `localhost:3000` و `localhost:3001`

### 2️⃣ **مشكلة API URL**
- ❌ **قبل**: Frontend يحاول الاتصال بـ `https://localhost:7157/api`
- ✅ **بعد**: Frontend يتصل بـ `http://localhost:5113/api` (الـ Backend الفعلي)

### 3️⃣ **صيغة ملف `.env`**
- ✅ **الصيغة الصحيحة**: بدون علامات اقتباس
  ```properties
  AZURE_SQL_CONNECTION_STRING=Server=tcp:...
  ```
- ❌ **صيغة خاطئة**: مع علامات اقتباس (لا تستخدم)
  ```properties
  AZURE_SQL_CONNECTION_STRING="Server=tcp:..."
  ```

---

## 🚀 الآن اختبر تسجيل الدخول:

### الخطوات:

#### 1. **تأكد من تشغيل الـ Backend والـ Frontend**

**Backend** (يجب أن يعمل على port 5113):
```
✅ Now listening on: http://localhost:5113
✅ CORS configured for origins: http://localhost:3000,http://localhost:3001
```

**Frontend** (يعمل على port 3000):
```
✅ Local: http://localhost:3000
```

---

#### 2. **افتح صفحة تسجيل الدخول**

```
URL: http://localhost:3000/admin/login
```

أو مباشرة:
```
URL: http://localhost:3000/admin
```

---

#### 3. **أدخل بيانات الدخول**

```
Email: admin@msc-scu.com
Password: Admin123!
```

ثم اضغط **"تسجيل الدخول"**

---

#### 4. **ماذا يجب أن يحدث:**

✅ **إذا نجح**: 
- ستظهر رسالة "تم تسجيل الدخول بنجاح"
- سيتم توجيهك إلى لوحة التحكم (Dashboard)
- ستشاهد قوائم: Members, Events, Site Content, Admin Users

❌ **إذا فشل**:
- افتح **Developer Tools** (F12)
- اذهب إلى تبويب **Console**
- ابحث عن أخطاء مثل:
  - `CORS error` → مشكلة في Backend
  - `Network error` → Backend لا يعمل
  - `401 Unauthorized` → بيانات خاطئة
  - `404 Not Found` → API URL خطأ

---

## 🔍 استكشاف الأخطاء (Troubleshooting)

### إذا لم يعمل تسجيل الدخول:

#### أ) **تحقق من Backend يعمل**
افتح في المتصفح:
```
http://localhost:5113/api/members
```

**النتيجة المتوقعة**: 
```json
[]
```
(قائمة فارغة لأنك لم تضف أعضاء بعد)

**إذا لم يعمل**: Backend لا يعمل، أعد تشغيله:
```powershell
cd MSC.WebAPI
dotnet run
```

---

#### ب) **تحقق من CORS في Backend Logs**
ابحث في terminal Backend عن:
```
CORS configured for origins: http://localhost:3000,http://localhost:3001
```

**إذا لم تجدها**: أعد تشغيل Backend

---

#### ج) **تحقق من اتصال Frontend بـ Backend**
افتح **Developer Tools (F12)** → **Network** tab
حاول تسجيل الدخول ولاحظ الطلبات:

**الطلب المتوقع**:
```
POST http://localhost:5113/api/auth/login
Status: 200 OK
Response: { "token": "...", "email": "admin@msc-scu.com", ... }
```

**إذا كان Status 404**: Frontend يتصل بـ URL خطأ
**إذا كان CORS error**: Backend CORS غير مُكوّن صحيحًا

---

#### د) **تحقق من بيانات Admin في قاعدة البيانات**

تأكد من أن Admin تم إنشاؤه في Azure SQL:
```powershell
cd MSC.WebAPI
dotnet run seed-admin
```

**النتيجة المتوقعة**:
```
✅ SuperAdmin user already exists: admin@msc-scu.com
```
أو
```
✅ SuperAdmin user created successfully!
   Email: admin@msc-scu.com
   Password: Admin123!
```

---

## 📋 قائمة التحقق السريعة:

قبل تسجيل الدخول، تأكد من:

- [ ] ✅ Backend يعمل على `http://localhost:5113`
- [ ] ✅ Frontend يعمل على `http://localhost:3000`
- [ ] ✅ ملف `.env` يحتوي على كلمة مرور Azure SQL الصحيحة
- [ ] ✅ CORS في Backend يسمح بـ `localhost:3000`
- [ ] ✅ `apiClient.js` يشير إلى `http://localhost:5113/api`
- [ ] ✅ مستخدم Admin موجود في قاعدة البيانات

---

## 🧪 اختبار API مباشرة (PowerShell)

لاختبار تسجيل الدخول مباشرة من Terminal:

```powershell
# اختبار Login API
$body = @{
    email = "admin@msc-scu.com"
    password = "Admin123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5113/api/auth/login" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

**النتيجة المتوقعة**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "email": "admin@msc-scu.com",
  "role": "SuperAdmin",
  "expiresAt": "2025-10-09T08:47:00Z"
}
```

**إذا حصلت على هذه النتيجة**: Backend يعمل بشكل صحيح، المشكلة في Frontend
**إذا حصلت على خطأ**: المشكلة في Backend أو قاعدة البيانات

---

## 📞 مراجع سريعة

### URLs مهمة:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5113
- **Login Page**: http://localhost:3000/admin/login
- **Admin Dashboard**: http://localhost:3000/admin
- **Test API**: http://localhost:5113/api/members

### ملفات تم تعديلها:
- ✅ `msc-webapp/src/services/apiClient.js` → تغيير URL من 7157 إلى 5113
- ✅ `MSC.WebAPI/.env` → إضافة port 3001 في CORS
- ✅ `MSC.WebAPI/Program.cs` → قراءة CORS من متغيرات البيئة

---

## 🎯 الخطوات التالية بعد تسجيل الدخول بنجاح:

1. **غيّر كلمة المرور** من لوحة التحكم
2. **أضف عضو جديد** مع صورة
3. **أضف فعالية جديدة** مع صورة
4. **تحقق من رفع الصور** في Azure Blob Storage
5. **شاهد البيانات** في الصفحة الرئيسية

---

**آخر تحديث**: October 9, 2025 - 07:48 AM  
**Status**: ✅ Fixed - Ready for Testing
