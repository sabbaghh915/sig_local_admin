import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Separator } from "../../components/ui/separator";
import { Badge } from "../../components/ui/badge";
import { adminApi } from "../../services/adminApi";
import { Building2, RefreshCcw, Download, Printer, AlertCircle, BarChart3 } from "lucide-react";

type Center = {
  _id: string;
  name: string;
  code?: string;
  ip?: string;
  province?: string;
  isActive?: boolean;
};

type FinanceRow = {
  centerId: string;
  centerName?: string;
  centerCode?: string;
  centerIp?: string;
  province?: string;
  totalAmount: number;
  paymentsCount: number;
};

type FinanceResponse = {
  success: boolean;
  from: string | Date;
  to: string | Date;
  grandTotal: number;
  grandCount: number;
  data: FinanceRow[];
};

const toYMD = (d: Date) => d.toISOString().slice(0, 10);

const formatCurrency = (n: number) => (Number(n || 0)).toLocaleString("ar") + " ل.س";
const formatNumber = (n: number) => Number(n || 0).toLocaleString("ar");

export default function AdminFinance() {
  const [from, setFrom] = useState(() => toYMD(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [to, setTo] = useState(() => toYMD(new Date()));

  const [centers, setCenters] = useState<Center[]>([]);
  const [centerId, setCenterId] = useState<string>("all");

  const [rows, setRows] = useState<FinanceRow[]>([]);
  const [grandTotal, setGrandTotal] = useState<number>(0);
  const [grandCount, setGrandCount] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const selectedCenter = useMemo(() => {
    if (centerId === "all") return null;
    return centers.find((c) => c._id === centerId) || null;
  }, [centerId, centers]);

  const rangeLabel = useMemo(() => {
    const fromLabel = new Date(from + "T00:00:00").toLocaleDateString("ar");
    const toLabel = new Date(to + "T00:00:00").toLocaleDateString("ar");
    return `من ${fromLabel} إلى ${toLabel}`;
  }, [from, to]);

  const loadCenters = async () => {
    const list = await adminApi.getCenters();
    // اختياري: فقط النشط
    const active = Array.isArray(list) ? list.filter((c: any) => c.isActive !== false) : [];
    setCenters(active);
  };

  const loadFinance = async () => {
    setError("");
    setLoading(true);
    try {
      const res = (await adminApi.getFinanceByCenter(from, to, centerId === "all" ? undefined : centerId)) as any;

      // adminApi عندك يعمل unwrapArray للـ GET عادة، لكن هون نحتاج object كامل
      // لذلك إذا رجع array بالغلط، اعتبره بيانات فقط
      if (Array.isArray(res)) {
        setRows(res);
        setGrandTotal(res.reduce((a, r) => a + (r.totalAmount || 0), 0));
        setGrandCount(res.reduce((a, r) => a + (r.paymentsCount || 0), 0));
      } else {
        const r = res as FinanceResponse;
        setRows(r.data || []);
        setGrandTotal(r.grandTotal || 0);
        setGrandCount(r.grandCount || 0);
      }
    } catch (e: any) {
      setError(e?.message || "فشل تحميل البيانات المالية");
    } finally {
      setLoading(false);
    }
  };

  const rebuildAndSave = async () => {
    setError("");
    setLoading(true);
    try {
      await adminApi.rebuildFinanceByCenter({ from, to });
      await loadFinance();
      alert("تمت إعادة الحساب والحفظ ✅");
    } catch (e: any) {
      setError(e?.message || "فشل إعادة الحساب");
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const header = ["المركز", "المحافظة", "IP", "عدد الدفعات", "الإجمالي"];
    const lines = [header.join(",")];

    for (const r of rows) {
      const centerLabel = r.centerName || r.centerCode || r.centerId;
      const province = r.province || "";
      const ip = r.centerIp || "";
      const count = String(r.paymentsCount || 0);
      const total = String(r.totalAmount || 0);
      // حماية من الفواصل داخل النص
      const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
      lines.push([esc(centerLabel), esc(province), esc(ip), count, total].join(","));
    }

    const csv = "\uFEFF" + lines.join("\n"); // BOM للعربي
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `finance_by_center_${from}_to_${to}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const printPDF = () => {
    const title = "المالية - إحصائيات المبالغ حسب المراكز";
    const centerFilter = selectedCenter ? `المركز: ${selectedCenter.name}` : "كل المراكز";

    const tableRows = rows
      .map((r) => {
        const c = r.centerName || r.centerCode || r.centerId;
        const p = r.province || "—";
        const ip = r.centerIp || "—";
        const cnt = formatNumber(r.paymentsCount || 0);
        const tot = formatCurrency(r.totalAmount || 0);
        return `
          <tr>
            <td>${c}</td>
            <td>${p}</td>
            <td>${ip}</td>
            <td>${cnt}</td>
            <td><b>${tot}</b></td>
          </tr>
        `;
      })
      .join("");

    const html = `
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 16px; }
          h1 { margin: 0 0 8px; font-size: 18px; }
          .meta { margin: 0 0 12px; color: #444; font-size: 12px; }
          .cards { display: flex; gap: 12px; margin: 12px 0 16px; }
          .card { border: 1px solid #ddd; border-radius: 10px; padding: 10px 12px; flex: 1; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
          th { background: #f5f5f5; }
          @media print {
            .noprint { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="noprint" style="margin-bottom:10px;">
          <button onclick="window.print()">طباعة / حفظ PDF</button>
        </div>
        <h1>${title}</h1>
        <div class="meta">${rangeLabel} — ${centerFilter}</div>

        <div class="cards">
          <div class="card"><div>إجمالي المبالغ</div><div style="font-size:16px;"><b>${formatCurrency(grandTotal)}</b></div></div>
          <div class="card"><div>عدد الدفعات</div><div style="font-size:16px;"><b>${formatNumber(grandCount)}</b></div></div>
        </div>

        <table>
          <thead>
            <tr>
              <th>المركز</th>
              <th>المحافظة</th>
              <th>IP</th>
              <th>عدد الدفعات</th>
              <th>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows || `<tr><td colspan="5">لا يوجد بيانات</td></tr>`}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return alert("المتصفح منع فتح نافذة جديدة للطباعة");
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  useEffect(() => {
    loadCenters().catch(() => {});
    loadFinance().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div dir="rtl" className="p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold">المالية</div>
            <div className="text-sm text-muted-foreground">{rangeLabel}</div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button onClick={exportCSV} disabled={loading || !rows.length} variant="secondary">
            <Download className="h-4 w-4 ml-2" />
            تصدير CSV
          </Button>
          <Button onClick={printPDF} disabled={loading || !rows.length} variant="secondary">
            <Printer className="h-4 w-4 ml-2" />
            طباعة / PDF
          </Button>
          <Button onClick={rebuildAndSave} disabled={loading} variant="outline">
            <RefreshCcw className="h-4 w-4 ml-2" />
            إعادة حساب + حفظ
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-white/20 bg-white/90 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            الفلاتر
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>من</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} disabled={loading} />
            </div>

            <div className="space-y-2">
              <Label>إلى</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} disabled={loading} />
            </div>

            <div className="space-y-2">
              <Label>المركز</Label>
              <Select value={centerId} onValueChange={setCenterId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر مركز" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المراكز</SelectItem>
                  {centers.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                      {c.ip ? ` — ${c.ip}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button className="w-full" onClick={loadFinance} disabled={loading}>
                {loading ? "جاري التحميل..." : "تحديث"}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant="secondary">الإجمالي: {formatCurrency(grandTotal)}</Badge>
            <Badge variant="secondary">عدد الدفعات: {formatNumber(grandCount)}</Badge>
            {selectedCenter && (
              <Badge>
                المركز: {selectedCenter.name} {selectedCenter.ip ? `(${selectedCenter.ip})` : ""}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>إجمالي المبالغ</CardTitle></CardHeader>
          <CardContent className="text-2xl font-extrabold">{formatCurrency(grandTotal)}</CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>عدد الدفعات</CardTitle></CardHeader>
          <CardContent className="text-2xl font-extrabold">{formatNumber(grandCount)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الإحصائيات حسب المركز</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="p-3 text-right">المركز</th>
                  <th className="p-3 text-right">المحافظة</th>
                  <th className="p-3 text-right">IP</th>
                  <th className="p-3 text-right">عدد الدفعات</th>
                  <th className="p-3 text-right">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.centerId} className="border-b hover:bg-muted/30">
                    <td className="p-3">
                      <div className="font-semibold">
                        {r.centerName || r.centerCode || r.centerId}
                      </div>
                      {r.centerCode && <div className="text-xs text-muted-foreground">كود: {r.centerCode}</div>}
                    </td>
                    <td className="p-3">{r.province || "—"}</td>
                    <td className="p-3">{r.centerIp || "—"}</td>
                    <td className="p-3">{formatNumber(r.paymentsCount || 0)}</td>
                    <td className="p-3 font-extrabold">{formatCurrency(r.totalAmount || 0)}</td>
                  </tr>
                ))}

                {!rows.length && (
                  <tr>
                    <td className="p-4 text-center text-muted-foreground" colSpan={5}>
                      لا يوجد بيانات ضمن هذه الفترة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="text-xs text-muted-foreground mt-3">
            ملاحظة: يتم جمع المبالغ من payments حسب <b>amount</b> (مع فلترة paymentStatus=completed إن كنت فعلتها في الباك).
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
