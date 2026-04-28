# App Tinh Gia Duc Thanh

## Utility tinh gia

- `calculatePaperCost(widthCm, heightCm, gsm, sheetsNeeded, pricePerTon)` trong `src/utils/numberUtils.js`: tinh tong tien giay tu kich thuoc cm, dinh luong g/m2, so to can dung va don gia theo tan. Ham giu dung quy doi hien co: dien tich cm2 -> m2, trong luong g -> kg, `pricePerTon * 1000` de doi don gia theo tan ve kg.
- `getSpoilageByQuantity(dinhMucDatabase, soToInLyThuyet, category = 'In')` trong `src/utils/numberUtils.js`: tra bang dinh muc bu hao theo khoang so to in, mac dinh tra nhom `In` va fallback `100` to.
- `filterPrintersBySize(printers, reqMax, reqMin)` trong `src/utils/finishingUtils.js`: loc may in theo kich thuoc lon/nho toi thieu, doc kich thuoc tu ten may dang `65x86`, `65 x 86` hoac dung dau `x/X/×`.
- `calculateFoilCost(finishingDatabase, lengthCm, widthCm, quantity, extraSheets = 0)` trong `src/utils/finishingUtils.js`: tinh tien khuon nhu = dai x rong x don gia `Khuon nhu` va ap toi thieu, dong thoi tinh cong ep theo dien tich/nhat tu `Ep nhu theo cm`, `Ep nhu theo nhat` tren Sheet GiaCong.
- `calculateEmbossCost(finishingDatabase, lengthCm, widthCm, quantity, extraSheets = 0)` trong `src/utils/finishingUtils.js`: tinh tien khuon thuc noi = dai x rong x don gia `Khuon thuc noi` va ap toi thieu, dong thoi tinh cong thuc theo `Luot thuc noi` tren Sheet GiaCong.

## Hang so in an dung chung

`src/constants/pricingConstants.js` export cac hang so: `PRINT_MARGIN_CM`, `DEFAULT_GAP_CM`, `DEFAULT_GRIPPER_CM`, `HAO_IN`, `HAO_CAN`, `HAO_GAP`.
