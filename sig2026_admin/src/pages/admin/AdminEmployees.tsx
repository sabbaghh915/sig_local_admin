import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select"; // ✅ مهم: select وليس Select
import { adminApi } from "../../services/adminApi";

type User = {
  _id: string;
  username: string;
  fullName: string;
  email: string;
  role: "admin" | "employee";
  employeeId?: string;
};

const extractArray = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data; // أحيانًا axios داخل axios
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.users)) return res.users;
  return [];
};

export default function AdminEmployees() {
  const [items, setItems] = useState<User[]>([]);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState<{
    username: string;
    password: string;
    fullName: string;
    email: string;
    role: User["role"];
    employeeId: string;
  }>({
    username: "",
    password: "",
    fullName: "",
    email: "",
    role: "employee",
    employeeId: "",
  });

  const load = async () => {
    const res = await adminApi.getUsers();
    setItems(extractArray(res) as User[]);
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const create = async () => {
    await adminApi.createUser(form);
    setOpen(false);
    setForm({
      username: "",
      password: "",
      fullName: "",
      email: "",
      role: "employee",
      employeeId: "",
    });
    await load();
  };

  const remove = async (id: string) => {
    await adminApi.deleteUser(id);
    await load();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>الموظفون</CardTitle>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setOpen(true)}>إضافة موظف</Button>
          </DialogTrigger>

          {/* ✅ مهم: نرندر المحتوى فقط عند الفتح */}
          {open && (
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>إضافة موظف جديد</DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم المستخدم</Label>
                  <Input
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>كلمة المرور</Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>الاسم الكامل</Label>
                  <Input
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>البريد</Label>
                  <Input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>الدور</Label>
                  <Select
                    value={form.role}
                    onValueChange={(v) =>
                      setForm({ ...form, role: v as User["role"] })
                    }
                  >
                    <SelectTrigger className="text-right">
                      <SelectValue placeholder="اختر" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">موظف</SelectItem>
                      <SelectItem value="admin">أدمن</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>رقم الموظف</Label>
                  <Input
                    value={form.employeeId}
                    onChange={(e) =>
                      setForm({ ...form, employeeId: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={create}>حفظ</Button>
              </div>
            </DialogContent>
          )}
        </Dialog>
      </CardHeader>

      <CardContent>
        <div className="overflow-auto border rounded-lg bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="p-3 text-right">username</th>
                <th className="p-3 text-right">الاسم</th>
                <th className="p-3 text-right">البريد</th>
                <th className="p-3 text-right">الدور</th>
                <th className="p-3 text-right">إجراء</th>
              </tr>
            </thead>

            <tbody>
              {items.map((u) => (
                <tr key={u._id} className="border-t">
                  <td className="p-3">{u.username}</td>
                  <td className="p-3">{u.fullName}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{u.role}</td>
                  <td className="p-3">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => remove(u._id)}
                    >
                      حذف
                    </Button>
                  </td>
                </tr>
              ))}

              {!items.length && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">
                    لا يوجد موظفين
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
