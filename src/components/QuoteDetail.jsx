import React, { useMemo, useState } from 'react';
import { Copy, Edit3, FileText, Layers, Loader2, X } from 'lucide-react';
import CatalogueSignatureCanvas from './viewers/CatalogueSignatureCanvas';
import ImpositionCanvas from './viewers/ImpositionCanvas';

function formatCurrency(value) {
  const amount = Number(value) || 0;
  return `${Math.round(amount).toLocaleString('vi-VN')} đ`;
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function safeParseSpecifications(rawSpecifications) {
  if (!rawSpecifications) return {};
  if (typeof rawSpecifications === 'object' && !Array.isArray(rawSpecifications)) return rawSpecifications;
  if (typeof rawSpecifications !== 'string') return {};

  try {
    const parsed = JSON.parse(rawSpecifications);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    return {};
  }
}

function normalizeText(value) {
  return String(value || '').replace(/_/g, ' ').trim();
}

function formatBoolean(value) {
  if (value === true) return 'Có';
  if (value === false) return 'Không';
  return '';
}

function formatValue(value, suffix = '') {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'boolean') return formatBoolean(value);
  if (typeof value === 'number') return `${value.toLocaleString('vi-VN')}${suffix}`;
  return `${normalizeText(value)}${suffix}`;
}

function pushLine(lines, label, value, suffix = '') {
  const formattedValue = formatValue(value, suffix);
  if (!formattedValue) return;
  lines.push({ label, value: formattedValue });
}

function pushMoneyLine(lines, label, value) {
  if (value === null || value === undefined || value === '') return;
  lines.push({ label, value: formatCurrency(value), isMoney: true });
}

function getTechnicalSections(specs) {
  const technical = [];
  const cover = [];
  const inner = [];
  const finishing = [];

  pushLine(technical, 'Số lượng', specs.quantity);
  pushLine(technical, 'Khổ thành phẩm', specs.productSize);
  if (specs.dimensions) {
    pushLine(technical, 'Kích thước thành phẩm', `${specs.dimensions.width || '-'} x ${specs.dimensions.depth || '-'} x ${specs.dimensions.height || '-'} cm`);
  }
  pushLine(technical, 'Tổng số trang', specs.totalPages ? `${specs.totalPages} (bìa + ruột)` : '');
  pushLine(technical, 'Đóng cuốn', specs.bindingType);
  pushLine(technical, 'In bìa chung ruột', specs.isCombinedPrint);
  pushLine(technical, 'Kiểu bình bản', specs.impositionStyle);
  pushLine(technical, 'Loại hộp', specs.boxType);
  pushLine(technical, 'Mặt túi', specs.matTui);
  pushLine(technical, 'Số mảnh túi', specs.soManh);
  pushLine(technical, 'Loại quai', specs.quai);

  if (specs.cover) {
    pushLine(cover, 'Loại giấy', [specs.cover.paperType, specs.cover.paperGsm && `${specs.cover.paperGsm} gsm`].filter(Boolean).join(' '));
    pushLine(cover, 'In', [specs.cover.printColors && `${specs.cover.printColors} màu`, specs.cover.printSides && `${specs.cover.printSides} mặt`].filter(Boolean).join(', '));
    pushLine(cover, 'Cán màng', specs.cover.lamination === 'none' ? 'Không' : specs.cover.lamination);
  } else {
    pushLine(cover, 'Loại giấy', [specs.paperType, specs.paperGsm && `${specs.paperGsm} gsm`].filter(Boolean).join(' '));
    pushLine(cover, 'In', [specs.printColors && `${specs.printColors} màu`, specs.printSides && `${specs.printSides} mặt`].filter(Boolean).join(', '));
    pushLine(cover, 'Cán màng', specs.lamination === 'none' ? 'Không' : specs.lamination);
  }

  if (specs.inner) {
    pushLine(inner, 'Loại giấy', [specs.inner.paperType, specs.inner.paperGsm && `${specs.inner.paperGsm} gsm`].filter(Boolean).join(' '));
    pushLine(inner, 'In', [specs.inner.printColors && `${specs.inner.printColors} màu`, specs.inner.printSides && `${specs.inner.printSides} mặt`].filter(Boolean).join(', '));
    pushLine(inner, 'Cán màng', specs.inner.lamination === 'none' ? 'Không' : specs.inner.lamination);
  } else if (specs.isCombinedPrint) {
    inner.push({ label: 'Ghi chú', value: 'Không có vì in chung với bìa.' });
  }

  pushLine(finishing, 'Số vạch gấp', specs.foldingLines);
  pushLine(finishing, 'Ép nhũ', specs.hasFoil);
  if (specs.hasFoil) pushLine(finishing, 'Kích thước nhũ', `${specs.foilLength || '-'} x ${specs.foilWidth || '-'} cm`);
  pushLine(finishing, 'Thúc nổi', specs.hasEmboss);
  if (specs.hasEmboss) pushLine(finishing, 'Kích thước thúc nổi', `${specs.embossLength || '-'} x ${specs.embossWidth || '-'} cm`);
  pushMoneyLine(finishing, 'Tiền khuôn bế nhập tay', specs.dieCost);

  return [
    { title: 'Thông số kỹ thuật', lines: technical },
    { title: 'Bìa / Vật liệu chính', lines: cover },
    { title: 'Ruột', lines: inner },
    { title: 'Gia công bổ sung', lines: finishing },
  ].filter((section) => section.lines.length > 0);
}

function getCostLines(specs, quote) {
  const costs = specs.result?.costs || {};
  const lines = [];

  pushMoneyLine(lines, 'Tiền giấy', costs.tongTienGiay ?? costs.tienGiay);
  pushMoneyLine(lines, 'Tiền xả lô', costs.tongTienXaLo ?? costs.tienXaLo);
  pushMoneyLine(lines, 'Tiền xuất kẽm', costs.tongTienKem ?? costs.tienKem);
  pushMoneyLine(lines, 'Tiền công in', costs.tongTienIn ?? costs.tienIn);
  pushMoneyLine(lines, 'Tiền cán màng', costs.tongTienCan ?? costs.tienCan);
  pushMoneyLine(lines, 'Tiền xén thành phẩm', costs.tienXen);
  pushMoneyLine(lines, 'Tiền gấp vạch', costs.tienGapVach);
  pushMoneyLine(lines, 'Tiền đóng cuốn', costs.tienDongCuon);
  pushMoneyLine(lines, 'Tiền khuôn nhũ', costs.foilDieCost);
  pushMoneyLine(lines, 'Tiền ép nhũ', costs.foilCost);
  pushMoneyLine(lines, 'Tiền khuôn thúc nổi', costs.embossDieCost);
  pushMoneyLine(lines, 'Tiền thúc nổi', costs.embossCost);
  pushMoneyLine(lines, 'Tiền gia công', costs.tienGiaCong);
  pushMoneyLine(lines, 'Tiền khuôn bế', costs.tienKhuonBe);
  pushMoneyLine(lines, 'Tiền vận chuyển', costs.tienVanChuyen);

  return {
    lines,
    productionTotal: costs.giaSanXuat,
    saleTotal: costs.giaBan ?? quote.totalAmount,
    unitPrice: costs.donGiaSP,
    markup: costs.markup ?? specs.markup,
  };
}

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">{title}</h4>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function LineList({ lines }) {
  return (
    <div className="space-y-2">
      {lines.map((line) => (
        <div key={line.label} className="flex gap-2 text-sm leading-relaxed">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
          <div className="min-w-0">
            <span className="font-semibold text-slate-700">{line.label}: </span>
            <span className={line.isMoney ? 'font-bold text-emerald-700' : 'text-slate-600'}>{line.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function QuoteDrawingPreview({ specs, productCategory }) {
  const result = specs.result;
  const normalizedCategory = String(productCategory || '').toLowerCase();

  if (Array.isArray(result?.signatures) && result.signatures.length > 0) {
    return (
      <Section title="Bản vẽ tay sách">
        <div className="space-y-4">
          {result.signatures.map((sig, index) => (
            <CatalogueSignatureCanvas key={sig.id || index} sig={sig} />
          ))}
        </div>
      </Section>
    );
  }

  if (Array.isArray(result?.blocks) && result.blocks.length > 0 && result.parentW && result.parentH) {
    return (
      <Section title="Bản vẽ bình bản">
        <div className="min-h-[360px] rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
          <ImpositionCanvas result={result} />
        </div>
      </Section>
    );
  }

  if (normalizedCategory.includes('hộp') || normalizedCategory.includes('túi')) {
    return (
      <Section title="Bản vẽ">
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
          Báo giá này chưa lưu đủ dữ liệu bản vẽ để dựng lại mô hình. Các thông số kỹ thuật vẫn được hiển thị đầy đủ ở cột trái.
        </div>
      </Section>
    );
  }

  return null;
}

function QuoteDetail({ quote, onClose, onDuplicate, onEdit }) {
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [isDuplicating, setIsDuplicating] = useState(false);

  const specs = useMemo(() => safeParseSpecifications(quote?.specifications), [quote]);
  const technicalSections = useMemo(() => getTechnicalSections(specs), [specs]);
  const costData = useMemo(() => getCostLines(specs, quote || {}), [specs, quote]);

  if (!quote) return null;

  const handleDuplicate = async () => {
    if (!onDuplicate) return;
    setIsDuplicating(true);
    setActionMessage('');
    setActionError('');

    try {
      const duplicatedQuote = await onDuplicate(quote);
      setActionMessage(`Đã sao chép thành báo giá ${duplicatedQuote?.quoteCode || 'mới'}.`);
    } catch (error) {
      setActionError(error?.message || 'Không sao chép được báo giá.');
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(quote);
      setActionMessage('Đã gửi yêu cầu chỉnh sửa báo giá.');
      setActionError('');
      return;
    }
    setActionError('Chưa có luồng chỉnh sửa báo giá.');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Chi tiết báo giá</p>
            <h3 className="mt-1 text-xl font-bold text-slate-900">{quote.quoteCode || '-'}</h3>
            <p className="mt-1 text-sm text-slate-500">{quote.productCategory || '-'} - {quote.productName || '-'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-white hover:text-red-500"
            aria-label="Đóng chi tiết báo giá"
          >
            <X size={22} />
          </button>
        </div>

        <div className="overflow-y-auto bg-slate-100/70 p-5 custom-scrollbar">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(380px,0.75fr)]">
            <div className="space-y-5">
              <Section title="Thông tin báo giá">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Ngày tạo</div>
                    <div className="mt-1 text-sm font-semibold text-slate-800">{formatDateTime(quote.createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Tên khách hàng</div>
                    <div className="mt-1 text-sm font-semibold text-slate-800">{quote.customerName || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Người báo giá</div>
                    <div className="mt-1 text-sm font-semibold text-slate-800">{quote.quotedBy || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Tổng tiền</div>
                    <div className="mt-1 text-base font-bold text-emerald-700">{formatCurrency(quote.totalAmount)}</div>
                  </div>
                </div>
              </Section>

              {technicalSections.length === 0 ? (
                <Section title="Thông số kỹ thuật">
                  <p className="text-sm text-slate-500">Không có thông số kỹ thuật để hiển thị.</p>
                </Section>
              ) : (
                technicalSections.map((section) => (
                  <Section key={section.title} title={section.title}>
                    <LineList lines={section.lines} />
                  </Section>
                ))
              )}

              <QuoteDrawingPreview specs={specs} productCategory={quote.productCategory} />
            </div>

            <div className="space-y-5 xl:sticky xl:top-0 xl:self-start">
              <Section title="Bảng giá chi tiết">
                {costData.lines.length === 0 ? (
                  <p className="text-sm text-slate-500">Không có bảng giá chi tiết.</p>
                ) : (
                  <ol className="space-y-2">
                    {costData.lines.map((line, index) => (
                      <li key={line.label} className="flex items-start justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                        <span className="text-slate-600">{index + 1}. {line.label}</span>
                        <span className="shrink-0 font-semibold text-slate-900">{line.value}</span>
                      </li>
                    ))}
                  </ol>
                )}

                <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="font-bold text-slate-700">Tổng sản xuất</span>
                    <span className="font-bold text-slate-900">{costData.productionTotal ? formatCurrency(costData.productionTotal) : '-'}</span>
                  </div>
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-bold text-blue-900">Giá bán {costData.markup ? `(x ${costData.markup})` : ''}</span>
                      <span className="text-xl font-bold text-blue-700">{formatCurrency(costData.saleTotal)}</span>
                    </div>
                    {costData.unitPrice && (
                      <div className="mt-1 text-right text-sm font-semibold text-blue-600">~ {formatCurrency(costData.unitPrice)} / SP</div>
                    )}
                  </div>
                </div>
              </Section>

              <Section title="Hành động">
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleDuplicate}
                    disabled={isDuplicating || !onDuplicate}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isDuplicating ? <Loader2 size={16} className="animate-spin" /> : <Copy size={16} />}
                    <span>{isDuplicating ? 'Đang sao chép...' : 'Sao chép báo giá'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <Edit3 size={16} />
                    <span>Chỉnh sửa báo giá</span>
                  </button>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
                    <div className="mb-1 flex items-center gap-1.5 font-semibold text-slate-700">
                      <FileText size={14} />
                      Ghi chú
                    </div>
                    Sao chép sẽ tạo một báo giá mới từ dữ liệu đang xem. Chỉnh sửa phát sự kiện để nối vào luồng chỉnh sửa calculator sau này.
                  </div>
                  {actionMessage && <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{actionMessage}</p>}
                  {actionError && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">{actionError}</p>}
                </div>
              </Section>

              <Section title="Tóm tắt dữ liệu bản vẽ">
                <div className="grid gap-3 text-sm">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <span className="flex items-center gap-2 text-slate-600"><Layers size={15} /> Số tay / cụm</span>
                    <span className="font-semibold text-slate-900">{specs.result?.totalTayIn || specs.result?.itemsPerSheet || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <span className="text-slate-600">Số tờ in</span>
                    <span className="font-semibold text-slate-900">{formatValue(specs.result?.costs?.tongSoToIn ?? specs.result?.sheetsNeeded)}</span>
                  </div>
                </div>
              </Section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuoteDetail;
