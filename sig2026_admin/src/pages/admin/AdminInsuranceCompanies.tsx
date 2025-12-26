import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Separator } from "../../components/ui/separator";
import { Badge } from "../../components/ui/badge";
import { adminApi } from "../../services/adminApi";
import { Building2, Save, Plus, AlertCircle, RefreshCcw } from "lucide-react";

type Row = {
  companyId: string;
  name: string;
  sharePercent: number;
  isActive: boolean;
  contractsCount: number;
  totalAmount: number;
};

const toYMD = (d: Date) => d.toISOString().slice(0, 10);
const fmt = (n: number) => Number(n || 0).toLocaleString("ar");
const money = (n: number) => `${fmt(n)} ل.س`;

export default function AdminInsuranceCompanies() {
  const [from, setFrom] = useState(() => toYMD(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [to, setTo] = useState(() => toYMD(new Date()));

  const [rows, setRows] = useState<Row[]>([]);
  const [unassigned, setUnassigned] = useState<{ contractsCount: number; totalAmount: number }>({ contractsCount: 0, totalAmount: 0 });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // إضافة شركة بسيطة
  const [newName, setNewName] = useState("");
  const [newShare, setNewShare] = useState("0");

  const totalActiveShare = useMemo(
    () => rows.filter(r => r.isActive).reduce((a, r) => a + Number(r.sharePercent || 0), 0),
    [rows]
  );

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const res: any = await adminApi.getInsuranceCompaniesStats(from, to);
      setRows(res?.data || []);
      setUnassigned(res?.unassigned || { contractsCount: 0, totalAmount: 0 });
    } catch (e: any) {
      setErr(e?.message || "فشل تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateRow = (id: string, patch: Partial<Row>) => {
    setRows(prev => prev.map(r => (r.companyId === id ? { ...r, ...patch } : r)));
  };

  const saveRow = async (r: Row) => {
    await adminApi.updateInsuranceCompany(r.companyId, {
      name: r.name,
      sharePercent: Number(r.sharePercent),
      isActive: r.isActive,
    });
  };

  const saveAll = async () => {
    setLoading(true);
    setErr("");
    try {
      // تحذير لو المجموع ليس 100 (يمكنك جعله شرطاً صارماً إذا تريد)
      if (Math.round(totalActiveShare) !== 100) {
        if (!confirm(`مجموع حصص الشركات النشطة = ${totalActiveShare}%. الأفضل أن يكون 100%. هل تريد المتابعة؟`)) {
          setLoading(false);
          return;
        }
      }

      for (const r of rows) await saveRow(r);
      await load();
      alert("تم حفظ التعديلات ✅");
    } catch (e: any) {
      setErr(e?.message || "فشل الحفظ");
    } finally {
      setLoading(false);
    }
  };

  const createCompany = async () => {
    setErr("");
    const share = Number(newShare);
    if (!newName.trim()) return setErr("اسم الشركة مطلوب");
    if (!Number.isFinite(share) || share < 0 || share > 100) return setErr("الحصة يجب أن تكون بين 0 و 100");

    setLoading(true);
    try {
      await adminApi.createInsuranceCompany({ name: newName.trim(), sharePercent: share, isActive: true });
      setNewName("");
      setNewShare("0");
      await load();
    } catch (e: any) {
      setErr(e?.message || "فشل إضافة الشركة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold">شركات التأمين</div>
            <div className="text-sm text-muted-foreground">توزيع العقود حسب الشركات</div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={load} disabled={loading} variant="secondary">
            <RefreshCcw className="h-4 w-4 ml-2" />
            تحديث
          </Button>
          <Button onClick={saveAll} disabled={loading}>
            <Save className="h-4 w-4 ml-2" />
            حفظ التعديلات
          </Button>
        </div>
      </div>

      {err && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>الفترة</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label>من</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label>إلى</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} disabled={loading} />
          </div>
          <div className="md:col-span-2 flex flex-wrap gap-2 items-center">
            <Badge variant="secondary">مجموع حصص الشركات النشطة: {fmt(totalActiveShare)}%</Badge>
            <Badge variant="secondary">غير موزعة: {fmt(unassigned.contractsCount)} عقد — {money(unassigned.totalAmount)}</Badge>
            {Math.round(totalActiveShare) !== 100 && (
              <Badge variant="destructive">تنبيه: الأفضل أن يكون المجموع 100%</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>إضافة شركة</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-3 items-end">
          <div className="space-y-2">
            <Label>اسم الشركة</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="مثال: شركة XYZ" />
          </div>
          <div className="space-y-2">
            <Label>حصة التوزيع (%)</Label>
            <Input value={newShare} onChange={(e) => setNewShare(e.target.value)} type="number" min={0} max={100} />
          </div>
          <Button onClick={createCompany} disabled={loading}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>جدول الشركات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="p-3 text-right">الشركة</th>
                  <th className="p-3 text-right">الحصة (%)</th>
                  <th className="p-3 text-right">نشطة</th>
                  <th className="p-3 text-right">عدد العقود</th>
                  <th className="p-3 text-right">قيمة العقود</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.companyId} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-semibold">{r.name}</td>

                    <td className="p-3">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={String(r.sharePercent)}
                        onChange={(e) => updateRow(r.companyId, { sharePercent: Number(e.target.value) })}
                        className="w-28"
                      />
                    </td>

                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={r.isActive}
                        onChange={(e) => updateRow(r.companyId, { isActive: e.target.checked })}
                      />
                    </td>

                    <td className="p-3">{fmt(r.contractsCount)}</td>
                    <td className="p-3 font-extrabold">{money(r.totalAmount)}</td>
                  </tr>
                ))}

                {!rows.length && (
                  <tr>
                    <td className="p-4 text-center text-muted-foreground" colSpan={5}>
                      لا توجد شركات
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Separator className="my-4" />

          <div className="text-xs text-muted-foreground">
            يتم حساب عدد/قيمة العقود من جدول <b>payments</b> حيث paymentStatus=completed ضمن الفترة، ويتم التجميع حسب <b>insuranceCompany</b>.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
