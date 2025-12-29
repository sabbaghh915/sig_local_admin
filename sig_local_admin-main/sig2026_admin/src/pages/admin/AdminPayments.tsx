import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui/table";
import { adminApi } from "../../services/adminApi";
import { AlertCircle, Loader2, CreditCard } from "lucide-react";
import ExportButtons from "@/components/export/ExportButtons";

const extractArray = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.vehicles)) return res.vehicles;
  if (Array.isArray(res?.users)) return res.users;
  return [];
};

export default function AdminPayments() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(null);

    adminApi
      .getPayments()
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
  }, []);

  return (
    <Card className="overflow-hidden border-0 bg-white/70 backdrop-blur shadow-xl">
      <div className="h-2 bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500" />

      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <span className="w-10 h-10 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
          </span>
          <div className="flex flex-col">
            <span className="text-lg font-extrabold">الدفعات</span>
            <ExportButtons
          entity="payments"
          fileName="payments"
          params={{ from, to, q }}
          hideIfNoPermission={false} // للأدمن المساعد: ممكن تخليها true إذا بدك تخفي الأزرار بدون صلاحية
        />
            <span className="text-sm font-normal text-slate-600">({items.length}) عملية</span>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {loading && (
          <div className="flex items-center justify-center py-10 gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-rose-600" />
            <span className="text-slate-700">جاري تحميل البيانات...</span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-4">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {!loading && !error && (
          <div className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden">
            <Table>
              <TableHeader>
  <TableRow>
    <TableHead className="text-right">رقم الإيصال</TableHead>
    <TableHead className="text-right">رقم الوثيقة</TableHead>
    <TableHead className="text-right">المبلغ</TableHead>
    <TableHead className="text-right">الدافع</TableHead>
    <TableHead className="text-right">التاريخ</TableHead>
  </TableRow>
</TableHeader>


              <TableBody>
                {items.map((p) => (
                  <TableRow key={p._id}>
                    <TableCell className="font-mono text-sm">{p.receiptNumber}</TableCell>
                    <TableCell className="font-mono text-sm">{p.policyNumber}</TableCell>
                    <TableCell className="font-extrabold">{p.amount}</TableCell>
                    <TableCell>{p.paidBy}</TableCell>
                    <TableCell>{new Date(p.createdAt).toLocaleDateString("ar-SY")}</TableCell>
                  </TableRow>
                ))}

                {!items.length && !loading && !error && <TableEmptyState message="لا يوجد دفعات" colSpan={5} />}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
