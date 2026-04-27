export const GOOGLE_SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbxxxG6_SjHC3__zrbNV2s5wTr2ngrj_4Az1xcxhpe9xR-KSowPMnwcKF_ro5s3Le-J0/exec';

export const DEFAULT_PAPER_DATA = [
  { paperType: 'Couche', gsm: 80, price: 22.4, rolls: '62; 65; 72; 79; 86; 109' },
  { paperType: 'Couche', gsm: 100, price: 20.8, rolls: '62; 65; 72; 79; 86; 102; 109' },
  { paperType: 'Couche', gsm: 120, price: 20.8, rolls: '62; 65; 72; 79; 86; 102; 109' },
  { paperType: 'Couche', gsm: 150, price: 20.8, rolls: '62; 65; 72; 79; 86; 102; 109' },
  { paperType: 'Couche', gsm: 180, price: 20.8, rolls: '62; 86' },
  { paperType: 'Couche', gsm: 200, price: 20.8, rolls: '62; 65; 72; 79; 86; 102; 109' },
  { paperType: 'Couche', gsm: 230, price: 20.8, rolls: '79; 109' },
  { paperType: 'Couche', gsm: 250, price: 20.8, rolls: '62; 65; 72; 79; 86; 102; 109' },
  { paperType: 'Couche', gsm: 300, price: 20.8, rolls: '62; 65; 72; 79; 86; 102; 109' },
  { paperType: 'Couche Matt', gsm: 100, price: 20.8 },
  { paperType: 'Couche Matt', gsm: 120, price: 20.8 },
  { paperType: 'Off', gsm: 200, price: 26.0 },
  { paperType: 'Off', gsm: 250, price: 26.0 },
  { paperType: 'Ivory', gsm: 210, price: 18.7 },
  { paperType: 'Ivory', gsm: 230, price: 17.7 },
  { paperType: 'Ivory', gsm: 250, price: 17.7 },
  { paperType: 'Ivory', gsm: 300, price: 17.7 },
  { paperType: 'Ivory', gsm: 350, price: 17.7 },
  { paperType: 'Ivory', gsm: 400, price: 17.7 },
  { paperType: 'Duplex', gsm: 250, price: 17.0 },
  { paperType: 'Duplex', gsm: 270, price: 17.0 },
  { paperType: 'Duplex', gsm: 300, price: 15.8 },
  { paperType: 'Duplex', gsm: 310, price: 15.8 },
  { paperType: 'Duplex', gsm: 350, price: 15.3 },
  { paperType: 'Duplex', gsm: 400, price: 15.3 },
  { paperType: 'Duplex', gsm: 450, price: 15.3 },
  { paperType: 'Kraft trắng', gsm: 100, price: 30.7 },
  { paperType: 'Kraft trắng', gsm: 120, price: 30.7 },
  { paperType: 'Kraft nâu', gsm: 170, price: 13.6 },
  { paperType: 'Kraft nâu', gsm: 250, price: 17.0 },
  { paperType: 'Kraft nâu', gsm: 280, price: 17.0 },
  { paperType: 'Kraft nâu', gsm: 300, price: 17.0 },
  { paperType: 'Kraft nâu', gsm: 350, price: 17.0 },
  { paperType: 'Bãi Bằng', gsm: 60, price: 25.5 },
  { paperType: 'Bãi Bằng', gsm: 70, price: 25.5 },
  { paperType: 'Bãi Bằng', gsm: 80, price: 25.5 },
  { paperType: 'Bãi Bằng', gsm: 100, price: 25.5 },
];

export const DEFAULT_PRINTER_DATA = [
  { id: 'fallback_1', name: '65x86', platePrice: 100000, runPrice: 500000 },
  { id: 'fallback_2', name: '52x72', platePrice: 80000, runPrice: 400000 },
  { id: 'fallback_3', name: '72x102', platePrice: 150000, runPrice: 800000 },
];

export const DEFAULT_FINISHING_DATA = [
  { item: 'Xả lô', price: 0, unit: 'VNĐ / 1 bài', minPrice: 150000 },
  { item: 'Cán mờ', price: 0.25, unit: 'VNĐ / 1 cm2', minPrice: 150000 },
  { item: 'Cán bóng', price: 0.23, unit: 'VNĐ / 1 cm2', minPrice: 150000 },
  { item: 'Gấp vạch', price: 15, unit: 'VNĐ / 1 vạch / 1 tờ', minPrice: 200000 },
  { item: 'Xén', price: 30000, unit: 'VNĐ / 1 ream', minPrice: 80000 },
  { item: 'Ghim gáy', price: 15, unit: 'VNĐ / 1 trang', minPrice: 600000 },
  { item: 'Keo gáy', price: 20, unit: 'VNĐ / 1 trang', minPrice: 1000000 },
  { item: 'Khâu keo', price: 20, unit: 'VNĐ / 1 trang', minPrice: 1500000 },
  { item: 'Gáy lò xo A4', price: 4500, unit: 'VNĐ / 1 quyển', minPrice: 300000 },
  { item: 'Gáy lò xo A5', price: 3500, unit: 'VNĐ / 1 quyển', minPrice: 300000 },
  // Gia công túi (Sheet GiaCong — Hông Y map vào cột “cạnh” trên sheet; đồng bộ văn bản hạng mục)
  { item: 'Túi 1 mảnh có cạnh <=10', price: 1500, unit: 'VNĐ / 1 chiếc', minPrice: 300000 },
  { item: 'Túi 1 mảnh có cạnh <=14', price: 1500, unit: 'VNĐ / 1 chiếc', minPrice: 300000 },
  { item: 'Túi 1 mảnh có cạnh <=17', price: 1700, unit: 'VNĐ / 1 chiếc', minPrice: 300000 },
  { item: 'Túi 1 mảnh có cạnh >17', price: 1900, unit: 'VNĐ / 1 chiếc', minPrice: 300000 },
  { item: 'Túi 2 mảnh có cạnh <=10', price: 1800, unit: 'VNĐ / 1 chiếc', minPrice: 300000 },
  { item: 'Túi 2 mảnh có cạnh <=14', price: 1900, unit: 'VNĐ / 1 chiếc', minPrice: 300000 },
  { item: 'Túi 2 mảnh có cạnh <=17', price: 2000, unit: 'VNĐ / 1 chiếc', minPrice: 300000 },
  { item: 'Túi 2 mảnh có cạnh >17', price: 2100, unit: 'VNĐ / 1 chiếc', minPrice: 300000 },
  // Khuôn bế túi (Sheet GiaCong — phân loại thể tích X×Y×Z)
  { item: 'Khuôn bế túi 1 mảnh nhỏ', price: 220000, unit: 'VNĐ / 1 chiếc', minPrice: 0 },
  { item: 'Khuôn bế túi 1 mảnh trung bình', price: 250000, unit: 'VNĐ / 1 chiếc', minPrice: 0 },
  { item: 'Khuôn bế túi 1 mảnh to', price: 350000, unit: 'VNĐ / 1 chiếc', minPrice: 0 },
  { item: 'Khuôn bế túi 2 mảnh nhỏ', price: 180000, unit: 'VNĐ / 1 chiếc', minPrice: 0 },
  { item: 'Khuôn bế túi 2 mảnh trung bình', price: 210000, unit: 'VNĐ / 1 chiếc', minPrice: 0 },
  { item: 'Khuôn bế túi 2 mảnh to', price: 290000, unit: 'VNĐ / 1 chiếc', minPrice: 0 },
];

export const DEFAULT_DINHMUC_DATA = [
  { category: 'In', fromQty: 1, toQty: 5000, name: 'Ít', spoilage: 100, unit: 'Tờ in' },
  { category: 'In', fromQty: 5001, toQty: 7000, name: 'Trung bình', spoilage: 150, unit: 'Tờ in' },
  { category: 'In', fromQty: 7001, toQty: 10000, name: 'Nhiều', spoilage: 200, unit: 'Tờ in' },
  { category: 'In', fromQty: 10001, toQty: 9999999999, name: 'Rất nhiều', spoilage: 300, unit: 'Tờ in' },
];

export const PARENT_PAPER_SIZES = [
  '27 x 52',
  '36.3 x 39.5',
  '36 x 52',
  '32.5 x 43',
  '39.5 x 54.5',
  '43 x 62',
  '43 x 65',
  '52 x 72',
  '54.5 x 79',
  '62 x 86',
  '65 x 86',
  '72 x 102',
  '79 x 109',
].map((size) => {
  const [a, b] = size.split('x').map((s) => parseFloat(s.trim()));
  return { label: size, w: Math.max(a, b), h: Math.min(a, b) };
});

export const PRODUCT_SIZES = [
  { label: 'A3 (42 x 29.7)', w: 42, h: 29.7 },
  { label: 'A4 (29.7 x 21)', w: 29.7, h: 21 },
  { label: 'A5 (21 x 14.8)', w: 21, h: 14.8 },
  { label: 'Kích thước khác', w: 0, h: 0 },
];

export const KHO_THIEU_SIZES = {
  0: { w: 41.8, h: 29.7, label: 'A3 thiếu (41.8 x 29.7)' },
  1: { w: 29.7, h: 20.7, label: 'A4 thiếu (29.7 x 20.7)' },
  2: { w: 20.7, h: 14.8, label: 'A5 thiếu (20.7 x 14.8)' },
};

export const LAMINATION_TYPES = [
  { id: 'none', label: 'Không cán' },
  { id: 'matte', label: 'Cán mờ' },
  { id: 'glossy', label: 'Cán bóng' },
];

export const MARKUP_RATES = [
  1.1, 1.15, 1.2, 1.25, 1.3, 1.35, 1.4, 1.45, 1.5, 1.55, 1.6, 1.65, 1.7, 1.75, 1.8,
];

export const BINDING_TYPES = [
  { id: 'ghim', label: 'Ghim gáy' },
  { id: 'keo', label: 'Keo gáy' },
  { id: 'khau', label: 'Khâu keo' },
  { id: 'loxo', label: 'Gáy lò xo' },
];
