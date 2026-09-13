# كيفية إعادة تعيين كلمة مرور Azure SQL Database

## إذا نسيت كلمة المرور

### الطريقة 1: إعادة تعيين كلمة المرور من Azure Portal

1. **افتح Azure Portal**: https://portal.azure.com
2. **ابحث عن SQL Servers** في شريط البحث
3. **اختر السيرفر**: `serverwebclub`
4. من القائمة الجانبية، اختر **"Reset password"**
5. أدخل كلمة مرور جديدة (يجب أن تحتوي على):
   - 8 أحرف على الأقل
   - حرف كبير (A-Z)
   - حرف صغير (a-z)
   - رقم (0-9)
   - رمز خاص (!@#$%^&*)
6. احفظ كلمة المرور الجديدة

### الطريقة 2: استخدام Azure Cloud Shell

```bash
# في Azure Portal، افتح Cloud Shell (أيقونة >_ في الأعلى)
az sql server update \
  --resource-group YourResourceGroupName \
  --name serverwebclub \
  --admin-password "NewPassword123!"
```

## بعد الحصول على كلمة المرور

1. **افتح ملف**: `MSC.WebAPI\.env`
2. **ابحث عن السطر**:
   ```
   AZURE_SQL_CONNECTION_STRING=Server=tcp:serverwebclub.database.windows.net,1433;Initial Catalog=SqlWebClub;Persist Security Info=False;User ID=AdminClub;Password=YourPasswordHere;...
   ```
3. **استبدل `YourPasswordHere`** بكلمة المرور الفعلية:
   ```
   Password=NewPassword123!
   ```

## مثال على كلمة مرور قوية

إذا كنت تريد اقتراحات لكلمة مرور جديدة:
- `MscScu@2025!`
- `AdminClub#2025`
- `WebClub$ecure123`

⚠️ **مهم جدًا**: 
- لا تشارك كلمة المرور مع أي شخص
- الملف `.env` محمي بـ `.gitignore` ولن يتم رفعه على GitHub
- احتفظ بنسخة من كلمة المرور في مكان آمن (مثل Azure Key Vault أو password manager)
