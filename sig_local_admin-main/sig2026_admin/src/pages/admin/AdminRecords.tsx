import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { adminApi } from "../../services/adminApi";
import { Loader2, AlertCircle } from "lucide-react"; // اختياري للأيقونات
import ExportButtons from "@/components/export/ExportButtons";

const extractArray = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.vehicles)) return res.vehicles;
  if (Array.isArray(res?.users)) return res.users;
  return [];
};


export default function AdminRecords() {
  const [tab, setTab] = useState<"syrian" | "foreign">("syrian");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  

  useEffect(() => {
    setLoading(true);
    setError(null);

    const api = tab === "syrian" 
      ? adminApi.getSyrianVehicles() 
      : adminApi.getForeignVehicles();

    api
      .then((res) => {
  const list = extractArray(res);
  setItems(list);
  setLoading(false);
})

      .catch((err) => {
        console.error(err);
        setError("فشل تحميل البيانات. تأكد من تسجيل الدخول كمشرف.");
        setLoading(false);
      });
  }, [tab]);

  const filtered = (Array.isArray(items) ? items : []).filter((x) => {

    const s = q.toLowerCase().trim();
    if (!s) return true;
    return (
      String(x.plateNumber || "").toLowerCase().includes(s) ||
      String(x.ownerName || "").toLowerCase().includes(s) ||
      String(x.nationalId || "").toLowerCase().includes(s)
    );
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>سجل المركبات</CardTitle>
        <div className="flex gap-4 mt-4">
          <Button
            variant={tab === "syrian" ? "default" : "outline"}
            onClick={() => setTab("syrian")}
          >
            مركبات سورية
          </Button>
          <Button
            variant={tab === "foreign" ? "default" : "outline"}
            onClick={() => setTab("foreign")}
          >
            مركبات أجنبية
          </Button>
          <ExportButtons
          entity="payments"
          fileName="payments"
          params={{ from, to, q }}
          hideIfNoPermission={false} // للأدمن المساعد: ممكن تخليها true إذا بدك تخفي الأزرار بدون صلاحية
        />
        </div>
        <Input
          placeholder="ابحث برقم اللوحة أو اسم المالك أو الهوية..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="mt-4"
        />
      </CardHeader>

      <CardContent>
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="mr-2">جاري التحميل...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-600 py-4">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <p className="text-center py-8 text-gray-500">
            {q ? "لا توجد نتائج تطابق البحث" : "لا توجد مركبات مسجلة"}
          </p>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-right p-3">رقم اللوحة</th>
                  <th className="text-right p-3">اسم المالك</th>
                  <th className="text-right p-3">رقم الهوية</th>
                  <th className="text-right p-3">نوع المركبة</th>
                  {/* أضف أعمدة أخرى حسب الحاجة */}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr
    key={item._id || item.id || `${item.plateNumber || "row"}-${idx}`}
    className="border-b hover:bg-gray-50"
  >
                    <td className="p-3 text-right">{item.plateNumber || "-"}</td>
                    <td className="p-3 text-right">{item.ownerName || "-"}</td>
                    <td className="p-3 text-right">{item.nationalId || "-"}</td>
                    <td className="p-3 text-right">{tab === "syrian" ? "سورية" : "أجنبية"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}