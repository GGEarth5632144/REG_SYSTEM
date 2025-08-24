// ====================================================================
// AddCurriculum.tsx — เพิ่ม/แสดง "หลักสูตร" จากหลังบ้านจริง (No mock, No any)
// - โหลดคณะ/สาขา/หนังสือ/หลักสูตร จาก services จริง
// - สร้างหลักสูตรด้วย snake_case DTO ให้ตรง backend (เหมือนหน้า CHANGE)
// - ล่างสุดมีตาราง "หลักสูตรที่เพิ่มแล้ว" + ช่องค้นหา (ชื่อ/รหัส/คณะ/สาขา)
// - ไม่มี any: ใช้ helper pickString/pickNumber/pickArray สำหรับ normalize
// ====================================================================

import React, { useEffect, useMemo, useState } from "react";
import {
  Layout,
  Form,
  Input,
  Select,
  Button,
  Typography,
  InputNumber,
  message,
  Table,
} from "antd";

import { type CurriculumInterface } from "../../../../../interfaces/Curriculum"; // ถ้ามี
// ถ้าไม่มี interface นี้ สามารถใช้ Local Interface ด้านล่างแทนได้ (CurriculumCreateForm)

import { getFacultyAll } from "../../../../../services/https/faculty/faculty";
import { getMajorAll } from "../../../../../services/https/major/major";
import {
  createCurriculum,
  getCurriculumAll,
} from "../../../../../services/https/curriculum/curriculum";
import { getBookAll } from "../../../../../services/https/bookpath/bookpath"; // ชี้ไป services ที่คุณเพิ่งแก้

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

/* -----------------------------------------
 * Types — options สำหรับ select
 * ----------------------------------------- */
type Faculty = { id: string; name: string };
type Major = { id: string; name: string; facultyId?: string };
type Book = {
  id: number;
  originalName?: string;
  storedName?: string;
  path?: string;
  publicPath?: string;
};

/* -----------------------------------------
 * รูปแบบ API response (รองรับหลายคีย์)
 * ----------------------------------------- */
type FacultyAPI = {
  faculty_id?: string;
  facultyId?: string;
  FacultyID?: string;
  id?: string;
  faculty_name?: string;
  facultyName?: string;
  FacultyName?: string;
  name?: string;
};
type MajorAPI = {
  major_id?: string;
  majorId?: string;
  MajorID?: string;
  id?: string;
  major_name?: string;
  majorName?: string;
  MajorName?: string;
  name?: string;
  faculty_id?: string;
  facultyId?: string;
  FacultyID?: string;
};
type BookAPI = {
  id?: number | string;
  original_name?: string;
  stored_name?: string;
  path?: string;
  public_path?: string;
};
type CurriculumAPI = {
  curriculum_id?: string;
  CurriculumID?: string;
  id?: string;

  curriculum_name?: string;
  CurriculumName?: string;
  name?: string;

  total_credit?: number | string;
  TotalCredit?: number | string;
  credit?: number | string;

  start_year?: number | string;
  StartYear?: number | string;

  faculty_id?: string;
  FacultyID?: string;
  faculty_name?: string;
  FacultyName?: string;

  major_id?: string;
  MajorID?: string;
  major_name?: string;
  MajorName?: string;

  book_id?: number | string;
  BookID?: number | string;
  book_path?: string;     // จาก preload Book.Path
  description?: string;
};

/* -----------------------------------------
 * Helper: type-safe extractors
 * ----------------------------------------- */
const pickString = (o: Record<string, unknown>, keys: string[], def = ""): string => {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" || typeof v === "number") return String(v);
  }
  return def;
};
const pickNumber = (o: Record<string, unknown>, keys: string[], def = 0): number => {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return def;
};

/* -----------------------------------------
 * แถวตารางหลักสูตร (ด้านล่างหน้า)
 * ----------------------------------------- */
type CurriculumRow = {
  CurriculumID: string;
  CurriculumName: string;
  TotalCredit: number;
  StartYear: number;
  FacultyID: string;
  FacultyName?: string;
  MajorID?: string;
  MajorName?: string;
  BookID?: number;
  BookPath?: string;
  Description?: string;
};

const toCurriculumRow = (raw: unknown): CurriculumRow => {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    CurriculumID: pickString(r, ["curriculum_id", "CurriculumID", "id"], ""),
    CurriculumName: pickString(r, ["curriculum_name", "CurriculumName", "name"], ""),
    TotalCredit: pickNumber(r, ["total_credit", "TotalCredit", "credit"], 0),
    StartYear: pickNumber(r, ["start_year", "StartYear"], 0),
    FacultyID: pickString(r, ["faculty_id", "FacultyID"], ""),
    FacultyName: pickString(r, ["faculty_name", "FacultyName"], ""),
    MajorID: pickString(r, ["major_id", "MajorID"], ""),
    MajorName: pickString(r, ["major_name", "MajorName"], ""),
    BookID: pickNumber(r, ["book_id", "BookID"], 0) || undefined,
    BookPath: pickString(r, ["book_path"], ""),
    Description: pickString(r, ["description"], ""),
  };
};

/* -----------------------------------------
 * แบบฟอร์มที่ส่งขึ้น (snake_case ให้ตรงหลังบ้าน)
 * ----------------------------------------- */
type CurriculumCreateDTO = {
  curriculum_id: string;
  curriculum_name: string;
  total_credit: number;
  start_year: number;
  faculty_id: string;
  major_id?: string;
  book_id?: number; // ตาม controller ใหม่: int (อ้าง BookPath.ID)
  description?: string;
};

/* -----------------------------------------
 * Form values บนหน้า (ตัวพิมพ์ใหญ่ตาม interface ฝั่ง FE)
 * ----------------------------------------- */
type CurriculumCreateForm = {
  CurriculumID: string;
  CurriculumName: string;
  TotalCredit: number;
  StartYear: number;
  FacultyID: string;
  MajorID?: string;
  BookID?: number;
  Description?: string;
};

/* -----------------------------------------
 * สไตล์หน้า
 * ----------------------------------------- */
const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  background: "#f5f5f5",
};
const contentStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  padding: 24,
};
const formShell: React.CSSProperties = {
  flex: 1,
  background: "#fff",
  borderRadius: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  padding: 24,
  display: "flex",
  flexDirection: "column",
};

/* ====================================================================
 * Component
 * ==================================================================== */
const Add: React.FC = () => {
  const [form] = Form.useForm<CurriculumCreateForm>();

  // options
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [books, setBooks] = useState<Book[]>([]);

  // table
  const [curriculums, setCurriculums] = useState<CurriculumRow[]>([]);

  // ui state
  const [loadingFaculties, setLoadingFaculties] = useState(false);
  const [loadingMajors, setLoadingMajors] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState<string>("");

  // watch faculty to filter majors
  const selectedFacultyId = Form.useWatch("FacultyID", form);

  /* ---------- loaders ---------- */
  const fetchFaculties = async () => {
    try {
      setLoadingFaculties(true);
      const data = await getFacultyAll();
      const arr = (Array.isArray(data) ? data : []) as FacultyAPI[];
      const mapped: Faculty[] = arr.map((f) => ({
        id: f.faculty_id ?? f.facultyId ?? f.FacultyID ?? f.id ?? "",
        name: f.faculty_name ?? f.facultyName ?? f.FacultyName ?? f.name ?? "",
      }));
      setFaculties(mapped);
    } catch (err) {
      console.error("fetchFaculties error:", err);
      message.error("โหลดรายชื่อคณะไม่สำเร็จ");
    } finally {
      setLoadingFaculties(false);
    }
  };

  const fetchMajors = async () => {
    try {
      setLoadingMajors(true);
      const data = await getMajorAll();
      const arr = (Array.isArray(data) ? data : []) as MajorAPI[];
      const mapped: Major[] = arr.map((m) => ({
        id: m.major_id ?? m.majorId ?? m.MajorID ?? m.id ?? "",
        name: m.major_name ?? m.majorName ?? m.MajorName ?? m.name ?? "",
        facultyId: m.faculty_id ?? m.facultyId ?? m.FacultyID ?? "",
      }));
      setMajors(mapped);
    } catch (err) {
      console.error("fetchMajors error:", err);
      message.error("โหลดรายชื่อสาขาไม่สำเร็จ");
    } finally {
      setLoadingMajors(false);
    }
  };

  const fetchBooks = async () => {
    try {
      setLoadingBooks(true);
      const data = await getBookAll();
      const arr = (Array.isArray(data) ? data : []) as BookAPI[];
      const mapped: Book[] = arr.map((b) => ({
        id: Number(b.id ?? 0),
        originalName: b.original_name,
        storedName: b.stored_name,
        path: b.path,
        publicPath: b.public_path,
      })).filter((b) => Number.isFinite(b.id) && b.id > 0);
      setBooks(mapped);
    } catch (err) {
      console.error("fetchBooks error:", err);
      message.error("โหลดรายชื่อเอกสาร (book) ไม่สำเร็จ");
    } finally {
      setLoadingBooks(false);
    }
  };

  const fetchCurriculums = async () => {
    try {
      const data = await getCurriculumAll();
      const arr = (Array.isArray(data) ? data : []) as CurriculumAPI[];
      setCurriculums(arr.map((c) => toCurriculumRow(c)));
    } catch (err) {
      console.error("fetchCurriculums error:", err);
      message.error("โหลดหลักสูตรไม่สำเร็จ");
    }
  };

  useEffect(() => {
    fetchFaculties();
    fetchMajors();
    fetchBooks();
    fetchCurriculums();
  }, []);

  /* ---------- filter majors by faculty ---------- */
  const filteredMajors = useMemo(() => {
    if (!selectedFacultyId) return majors;
    return majors.filter((m) => !m.facultyId || m.facultyId === selectedFacultyId);
  }, [majors, selectedFacultyId]);

  /* ---------- search table ---------- */
  const tableRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return curriculums;
    return curriculums.filter((c) => {
      const fields = [
        c.CurriculumName,
        c.CurriculumID,
        c.FacultyName ?? "",
        c.MajorName ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return fields.includes(q);
    });
  }, [curriculums, query]);

  /* ---------- submit ---------- */
  const onFinish = async (values: CurriculumCreateForm) => {
    setSubmitting(true);
    try {
      // map → snake_case DTO (ให้ตรง controller ที่หน้า CHANGE ใช้)
      const dto: CurriculumCreateDTO = {
        curriculum_id: values.CurriculumID,
        curriculum_name: values.CurriculumName,
        total_credit: Number(values.TotalCredit),
        start_year: Number(values.StartYear),
        faculty_id: values.FacultyID,
      };
      if (values.MajorID) dto.major_id = values.MajorID;
      if (Number.isFinite(values.BookID ?? NaN)) dto.book_id = values.BookID;
      if (values.Description && values.Description.trim() !== "") dto.description = values.Description.trim();

      await createCurriculum(dto);
      message.success("บันทึกหลักสูตรสำเร็จ");

      form.resetFields();
      await fetchCurriculums();
    } catch (err) {
      console.error("[CreateCurriculum] error:", err);
      message.error("เพิ่มหลักสูตรไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  /* ====================================================================
   * Render
   * ==================================================================== */
  return (
    <Layout style={pageStyle}>
      <Content style={contentStyle}>
        {/* -------------------- ฟอร์มเพิ่มหลักสูตร -------------------- */}
        <div style={formShell}>
          <div style={{ marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0 }}>
              เพิ่มหลักสูตรใหม่
            </Title>
            <Text type="secondary">กรอกข้อมูลหลักสูตรให้ครบ แล้วกด “เพิ่มหลักสูตร”</Text>
          </div>

          <Form<CurriculumCreateForm>
            form={form}
            layout="vertical"
            onFinish={onFinish}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 12,
              width: "100%",
            }}
          >
            {/* รหัสหลักสูตร */}
            <Form.Item
              label="รหัสหลักสูตร (Curriculum ID)"
              name="CurriculumID"
              rules={[{ required: true, message: "กรุณากรอกรหัสหลักสูตร" }]}
              style={{ width: "100%" }}
            >
              <Input placeholder="เช่น CURR-2025-CS" style={{ height: 44, maxWidth: 320 }} />
            </Form.Item>

            {/* ชื่อหลักสูตร */}
            <Form.Item
              label="ชื่อหลักสูตร (Curriculum Name)"
              name="CurriculumName"
              rules={[{ required: true, message: "กรุณากรอกชื่อหลักสูตร" }]}
              style={{ width: "100%" }}
            >
              <Input placeholder="เช่น Bachelor of Computer Science" style={{ height: 44, maxWidth: 600 }} />
            </Form.Item>

            {/* หน่วยกิตรวม */}
            <Form.Item
              label="หน่วยกิตรวม (Total Credit)"
              name="TotalCredit"
              rules={[
                { required: true, message: "กรุณากรอกหน่วยกิตรวม" },
                { type: "number", min: 1, max: 300, transform: (v) => Number(v), message: "กรอก 1–300" },
              ]}
              style={{ width: "100%" }}
            >
              <InputNumber placeholder="เช่น 120" style={{ width: 200, height: 44 }} />
            </Form.Item>

            {/* ปีเริ่มต้นหลักสูตร */}
            <Form.Item
              label="ปีเริ่มหลักสูตร (Start Year)"
              name="StartYear"
              rules={[
                { required: true, message: "กรุณากรอกปีเริ่มหลักสูตร" },
                { type: "number", min: 1900, max: 3000, transform: (v) => Number(v), message: "ปี 1900–3000" },
              ]}
              style={{ width: "100%" }}
            >
              <InputNumber placeholder="เช่น 2025" style={{ width: 200, height: 44 }} />
            </Form.Item>

            {/* คณะ */}
            <Form.Item
              label="คณะ (Faculty)"
              name="FacultyID"
              rules={[{ required: true, message: "กรุณาเลือกคณะ" }]}
              style={{ width: "100%" }}
            >
              <Select
                placeholder="เลือกคณะ"
                loading={loadingFaculties}
                style={{ maxWidth: 320 }}
                allowClear
              >
                {faculties.map((f) => (
                  <Option key={f.id} value={f.id}>
                    {f.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* สาขา (กรองจากคณะที่เลือก) */}
            <Form.Item
              label="สาขา (Major)"
              name="MajorID"
              style={{ width: "100%" }}
              rules={[{ required: false }]}
            >
              <Select
                placeholder="เลือกสาขา (ถ้ามี)"
                loading={loadingMajors}
                style={{ maxWidth: 320 }}
                allowClear
                disabled={!selectedFacultyId}
              >
                {filteredMajors.map((m) => (
                  <Option key={m.id} value={m.id}>
                    {m.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* เอกสารหลักสูตร (Book) */}
            <Form.Item
              label="เอกสารหลักสูตร (Book)"
              name="BookID"
              style={{ width: "100%" }}
            >
              <Select
                placeholder="เลือกไฟล์เอกสารหลักสูตร (ถ้ามี)"
                loading={loadingBooks}
                style={{ maxWidth: 480 }}
                allowClear
                optionFilterProp="label"
                showSearch
              >
                {books.map((b) => (
                  <Option
                    key={b.id}
                    value={b.id}
                    label={b.originalName ?? b.storedName ?? `ID ${b.id}`}
                  >
                    {(b.originalName ?? b.storedName ?? `ID ${b.id}`) +
                      (b.publicPath ? ` — ${b.publicPath}` : "")}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* คำอธิบาย */}
            <Form.Item label="คำอธิบาย (Description)" name="Description" style={{ width: "100%" }}>
              <Input.TextArea rows={4} placeholder="รายละเอียดอื่น ๆ ของหลักสูตร" style={{ maxWidth: 720 }} />
            </Form.Item>

            {/* ปุ่มบันทึก */}
            <Form.Item style={{ marginTop: 8 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                style={{
                  backgroundColor: "#2e236c",
                  height: 44,
                  minWidth: 180,
                  borderRadius: 10,
                  fontWeight: 600,
                }}
              >
                เพิ่มหลักสูตร
              </Button>
            </Form.Item>
          </Form>
        </div>

        {/* -------------------- ค้นหา + ตารางหลักสูตรที่เพิ่มแล้ว -------------------- */}
        <div style={{ marginTop: 24, marginBottom: 8 }}>
          <Input
            allowClear
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหา: ชื่อหลักสูตร / รหัสหลักสูตร / คณะ / สาขา"
            style={{ maxWidth: 460 }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <Title level={4}>หลักสูตรที่เพิ่มแล้ว</Title>
          <Table<CurriculumRow>
            className="custom-table-header"
            columns={[
              { title: "รหัสหลักสูตร", dataIndex: "CurriculumID", width: 160 },
              { title: "ชื่อหลักสูตร", dataIndex: "CurriculumName" },
              { title: "หน่วยกิตรวม", dataIndex: "TotalCredit", width: 120 },
              { title: "ปีเริ่ม", dataIndex: "StartYear", width: 100 },
              {
                title: "คณะ",
                dataIndex: "FacultyName",
                render: (_: unknown, row) =>
                  row.FacultyName ??
                  (faculties.find((f) => f.id === row.FacultyID)?.name || "-"),
                width: 200,
              },
              {
                title: "สาขา",
                dataIndex: "MajorName",
                render: (_: unknown, row) =>
                  row.MajorName ??
                  (majors.find((m) => m.id === row.MajorID)?.name || "-"),
                width: 200,
              },
              {
                title: "เอกสาร",
                dataIndex: "BookPath",
                width: 120,
                render: (p?: string) =>
                  p ? (
                    <a href={p} target="_blank" rel="noopener noreferrer">
                      View
                    </a>
                  ) : (
                    "-"
                  ),
              },
            ]}
            dataSource={tableRows}
            rowKey="CurriculumID"
            pagination={false}
            rowClassName={(_record, index) =>
              index % 2 === 0 ? "table-row-light" : "table-row-dark"
            }
          />
        </div>

        {/* -------------------- Table Styles -------------------- */}
        <style>
          {`
            .table-row-light { background-color: #dad1d1ff; }
            .table-row-dark  { background-color: #dad1d1ff; }

            .custom-table-header .ant-table-thead > tr > th {
              background: #2e236c;
              color: #fff;
              font-weight: bold;
              font-size: 16px;
              border-bottom: 2px solid #ffffffff;
              border-right: 2px solid #ffffffff;
            }
            .custom-table-header .ant-table-tbody > tr > td {
              border-bottom: 2px solid #ffffffff;
              border-right: 2px solid #ffffffff;
            }
            .custom-table-header .ant-table-tbody > tr > td:last-child,
            .custom-table-header .ant-table-thead > tr > th:last-child {
              border-right: none;
            }
            .custom-table-header .ant-table-tbody > tr:hover > td {
              background-color: #dad1d1ff !important;
              transition: background 0.2s;
            }
          `}
        </style>
      </Content>
    </Layout>
  );
};

export default Add;
