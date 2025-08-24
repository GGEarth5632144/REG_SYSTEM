// ====================================================================
// CHANGE.tsx — ดึง/แก้/ลบ "หลักสูตร" จาก backend จริง (พร้อมคอมเมนต์ไทย)
// ====================================================================

import React, { useEffect, useMemo, useState, useContext } from "react";
import {
  Layout,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Table,
  Typography,
  Select,
  message,
} from "antd";
import type { ColumnsType, ColumnType } from "antd/es/table";
import { SearchOutlined } from "@ant-design/icons";

const { Content } = Layout;

// ====================== 1) แบบข้อมูลที่ใช้บนตาราง (Frontend) ======================
interface DataType {
  key: string; // ใช้กับ Table
  id: string; // curriculum_id จากหลังบ้าน
  name: string; // curriculum_name
  credit: number; // total_credit
  startYear: number; // start_year
  facultyId: string; // faculty_id
  subjectIds: string[]; // (ใช้แสดงเฉยๆ ถ้ามี)
  syllabusUrl: string; // (book_path เพื่อแสดง View)
}

// ====== ใช้กำหนดชนิดคอลัมน์ editable ของ AntD Table ======
interface EditableColumnType extends ColumnType<DataType> {
  editable?: boolean;
  inputType?: "number" | "text" | "select" | "multiselect";
}

// ====================== 2) Services (เรียก API) ======================
// NOTE: ปรับ path import ให้ตรงโปรเจ็กต์จริงของคุณ
import { getFacultyAll } from "../../../../../services/https/faculty/faculty";
import { getSubjectAll } from "../../../../../services/https/subject/subjects";
import type { CurriculumUpdateDTO } from "../../../../../services/https/curriculum/curriculum";
import {
  getCurriculumAll,
  updateCurriculum, // (id: string, dto: Partial<CurriculumUpdateDTO>)
  deleteCurriculum, // (id: string)
} from "../../../../../services/https/curriculum/curriculum";

// ====================== 3) Normalizer: แปลง backend → frontend ======================
type FacultyOpt = { id: string; name: string };
type SubjectOpt = { id: string; name: string };

// แปลง faculty จาก API → option
const toFacultyOpt = (raw: unknown): FacultyOpt => {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? r.FacultyID ?? r.facultyId ?? r.faculty_id ?? ""),
    name: String(
      r.name ?? r.FacultyName ?? r.facultyName ?? r.faculty_name ?? ""
    ),
  };
};

// แปลง subject จาก API → option
const toSubjectOpt = (raw: unknown): SubjectOpt => {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? r.SubjectID ?? r.subjectId ?? r.subject_id ?? ""),
    name: String(
      r.name ?? r.SubjectName ?? r.subjectName ?? r.subject_name ?? ""
    ),
  };
};

// ---------- helpers: type-safe extractors ----------
const pickString = (
  o: Record<string, unknown>,
  keys: string[],
  def = ""
): string => {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" || typeof v === "number") return String(v);
  }
  return def;
};

const pickNumber = (
  o: Record<string, unknown>,
  keys: string[],
  def = 0
): number => {
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

const pickArray = (o: Record<string, unknown>, keys: string[]): unknown[] => {
  for (const k of keys) {
    const v = o[k];
    if (Array.isArray(v)) return v as unknown[];
  }
  return [];
};

const toStringId = (x: unknown): string => {
  if (typeof x === "string" || typeof x === "number") return String(x);
  if (typeof x === "object" && x !== null) {
    const rec = x as Record<string, unknown>;
    if (typeof rec.id === "string" || typeof rec.id === "number")
      return String(rec.id);
    if (typeof rec.SubjectID === "string" || typeof rec.SubjectID === "number")
      return String(rec.SubjectID);
    if (
      typeof rec.subject_id === "string" ||
      typeof rec.subject_id === "number"
    )
      return String(rec.subject_id);
  }
  return "";
};

// ---------- toCurriculumRow: ไม่มี any ----------
const toCurriculumRow = (raw: unknown): DataType => {
  const r = (raw ?? {}) as Record<string, unknown>;
  const subjectList = pickArray(r, ["subjectIds", "subjects"])
    .map(toStringId)
    .filter(Boolean);

  return {
    key: pickString(
      r,
      ["curriculum_id", "CurriculumID", "id"],
      String(Date.now())
    ),
    id: pickString(r, ["curriculum_id", "CurriculumID", "id"], ""),
    name: pickString(r, ["curriculum_name", "CurriculumName", "name"], ""),
    credit: pickNumber(r, ["total_credit", "TotalCredit", "credit"], 0),
    startYear: pickNumber(r, ["start_year", "StartYear", "startYear"], 0),
    facultyId: pickString(r, ["faculty_id", "FacultyID"], ""),
    subjectIds: subjectList,
    syllabusUrl: pickString(r, ["book_path", "syllabusUrl", "url"], ""),
  };
};

// ====================== 4) Context สำหรับ options ของ Select ======================
const OptionsCtx = React.createContext<{
  faculties: FacultyOpt[];
  subjects: SubjectOpt[];
}>({
  faculties: [],
  subjects: [],
});

// ====================== 5) Editable Cell (ควบคุม input ต่อเซลล์) ======================
// ❗️อย่า extends HTMLAttributes เพราะ title:string ทำให้ชนกับ ReactNode ของ AntD
type EditableCellProps = {
  record: DataType;
  editing: boolean;
  dataIndex: keyof DataType;
  title: React.ReactNode;
  inputType: "number" | "text" | "select" | "multiselect";
  children?: React.ReactNode;
};

const EditableCell: React.FC<EditableCellProps> = ({
  editing,
  dataIndex,
  title,
  inputType,
  children,
  ...restProps
}) => {
  const { faculties, subjects } = useContext(OptionsCtx);

  // เลือกชนิด input ตามคอลัมน์
  let inputNode: React.ReactNode;
  if (inputType === "number")
    inputNode = <InputNumber style={{ width: "100%" }} />;
  else if (inputType === "text") inputNode = <Input />;
  else if (inputType === "select")
    inputNode = (
      <Select
        options={faculties.map((f) => ({ label: f.name, value: f.id }))}
        showSearch
        optionFilterProp="label"
        allowClear
      />
    );
  else if (inputType === "multiselect")
    inputNode = (
      <Select
        mode="multiple"
        options={subjects.map((s) => ({ label: s.name, value: s.id }))}
        showSearch
        optionFilterProp="label"
        allowClear
      />
    );
  else inputNode = <Input />;

  return (
    <td {...(restProps as React.HTMLAttributes<HTMLTableCellElement>)}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          rules={[{ required: true, message: `Please Input ${title}!` }]}
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

// ====================== 6) Component หลัก ======================
const CHANGE: React.FC = () => {
  const [form] = Form.useForm();

  // ------- data & options state -------
  const [data, setData] = useState<DataType[]>([]);
  const [faculties, setFaculties] = useState<FacultyOpt[]>([]);
  const [subjects, setSubjects] = useState<SubjectOpt[]>([]);

  // ------- ui state -------
  const [loading, setLoading] = useState(false);
  const [editingKey, setEditingKey] = useState<React.Key>("");
  const [searchText, setSearchText] = useState<string>("");

  // map สำหรับแปลง id → ชื่อเวลา render
  const facultyMap = useMemo(
    () =>
      faculties.reduce(
        (acc, cur) => ({ ...acc, [cur.id]: cur.name }),
        {} as Record<string, string>
      ),
    [faculties]
  );
  const subjectMap = useMemo(
    () =>
      subjects.reduce(
        (acc, cur) => ({ ...acc, [cur.id]: cur.name }),
        {} as Record<string, string>
      ),
    [subjects]
  );

  const isEditing = (record: DataType) => record.key === editingKey;

  // ------- โหลดข้อมูลจริงทั้งหมด -------
  const loadAll = async () => {
    setLoading(true);
    try {
      const [facRes, subRes, curRes] = await Promise.all([
        getFacultyAll(),
        getSubjectAll(),
        getCurriculumAll(),
      ]);
      setFaculties((Array.isArray(facRes) ? facRes : []).map(toFacultyOpt));
      setSubjects((Array.isArray(subRes) ? subRes : []).map(toSubjectOpt));
      setData((Array.isArray(curRes) ? curRes : []).map(toCurriculumRow));
    } catch (err) {
      console.error(err);
      message.error("โหลดข้อมูลล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // ------- ฟังก์ชันแก้ไขแถว -------
  const edit = (record: DataType) => {
    form.setFieldsValue({
      name: record.name,
      credit: record.credit,
      startYear: record.startYear,
      facultyId: record.facultyId,
      subjectIds: record.subjectIds,
      syllabusUrl: record.syllabusUrl,
    });
    setEditingKey(record.key);
  };

  const cancel = () => setEditingKey("");

  // บันทึกแก้ไข → map เป็น DTO ให้ตรง API แล้วค่อยส่ง
  const save = async (key: React.Key) => {
    try {
      const row = (await form.validateFields()) as Partial<DataType>;
      const current = data.find((d) => d.key === key);
      if (!current) return;

      // สร้าง patch เป็น snake_case ให้ตรงกับ CurriculumUpdateDTO
      const patch: CurriculumUpdateDTO = {
        curriculum_name: (row.name ?? current.name) || undefined,
        total_credit: row.credit ?? current.credit ?? undefined,
        start_year: row.startYear ?? current.startYear ?? undefined,
        faculty_id: (row.facultyId ?? current.facultyId) || undefined,
        // ถ้าคุณมี field เพิ่มใน UI ค่อย map เพิ่ม:
        // major_id: ...,
        // book_id:  ...,
        // description: ...,
      };

      // ลบ key ที่เป็น undefined ออกจาก object (กันส่งค่าเปล่าๆไปทับ)
      Object.keys(patch).forEach((k) => {
        const keyK = k as keyof CurriculumUpdateDTO;
        if (patch[keyK] === undefined) delete patch[keyK];
      });

      await updateCurriculum(current.id, patch);

      // อัปเดต state ฝั่ง frontend ให้สะท้อนค่าที่เพิ่งบันทึก
      setData((prev) =>
        prev.map((it) =>
          it.key === key
            ? {
                ...it,
                name: patch.curriculum_name ?? it.name,
                credit: (patch.total_credit as number | undefined) ?? it.credit,
                startYear:
                  (patch.start_year as number | undefined) ?? it.startYear,
                facultyId: patch.faculty_id ?? it.facultyId,
              }
            : it
        )
      );

      setEditingKey("");
      message.success("บันทึกสำเร็จ");
    } catch (err) {
      console.error(err);
      message.error("บันทึกไม่สำเร็จ");
    }
  };
  // ลบแถวจริงจาก backend + ลบในตาราง
  const handleDelete = async (key: React.Key) => {
    const target = data.find((d) => d.key === key);
    if (!target) return;
    try {
      await deleteCurriculum(target.id);
      setData((prev) => prev.filter((item) => item.key !== key));
      message.success("ลบสำเร็จ");
    } catch (err) {
      console.error(err);
      message.error("ลบไม่สำเร็จ");
    }
  };

  // กรองข้อมูลตามคำค้นหา
  const filteredData = useMemo(
    () =>
      data.filter(
        (item) =>
          item.name.toLowerCase().includes(searchText.toLowerCase()) ||
          (facultyMap[item.facultyId] || "")
            .toLowerCase()
            .includes(searchText.toLowerCase())
      ),
    [data, facultyMap, searchText]
  );

  // ------- คอลัมน์ตาราง -------
  const columns: EditableColumnType[] = [
    {
      title: "Curriculum Name",
      dataIndex: "name",
      width: "20%",
      editable: true,
    },
    {
      title: "Total Credit",
      dataIndex: "credit",
      width: "10%",
      editable: true,
    },
    {
      title: "Start Year",
      dataIndex: "startYear",
      width: "15%",
      editable: true,
    },
    {
      title: "Faculty",
      dataIndex: "facultyId",
      width: "15%",
      editable: true,
      render: (facultyId: string) => facultyMap[facultyId] || "-",
    },
    {
      title: "Subjects",
      dataIndex: "subjectIds",
      width: "20%",
      editable: true,
      render: (ids: string[]) =>
        (ids || []).map((id) => subjectMap[id] || id).join(", "),
    },
    {
      title: "Book",
      dataIndex: "syllabusUrl",
      width: "10%",
      editable: true,
      render: (url: string) =>
        url ? (
          <a href={url} target="_blank" rel="noopener noreferrer">
            View
          </a>
        ) : (
          "-"
        ),
    },
    {
      title: "Edit",
      dataIndex: "edit",
      width: "5%",
      render: (_: unknown, record: DataType) => {
        const editable = isEditing(record);
        return editable ? (
          <span>
            <Typography.Link
              onClick={() => save(record.key)}
              style={{ marginInlineEnd: 8, fontSize: 12 }}
            >
              Save
            </Typography.Link>
            <Popconfirm title="Sure to cancel?" onConfirm={cancel}>
              <a style={{ fontSize: 12 }}>Cancel</a>
            </Popconfirm>
          </span>
        ) : (
          <Typography.Link
            disabled={editingKey !== ""}
            onClick={() => edit(record)}
          >
            Edit
          </Typography.Link>
        );
      },
    },
    {
      title: "Delete",
      dataIndex: "delete",
      width: "5%",
      render: (_: unknown, record: DataType) => (
        <Popconfirm
          title="Sure to delete?"
          onConfirm={() => handleDelete(record.key)}
        >
          <a>Delete</a>
        </Popconfirm>
      ),
    },
  ];

  // ----- แยกชนิดคอลัมน์ที่เป็น data column (ไม่ใช่ group) ก่อนใช้ dataIndex -----
  type DataColumn = Extract<
    ColumnsType<DataType>[number],
    ColumnType<DataType>
  > & {
    editable?: boolean;
  };
  const isDataColumn = (
    col: ColumnsType<DataType>[number]
  ): col is DataColumn => (col as ColumnType<DataType>).dataIndex !== undefined;

  // ----- ผูก onCell สำหรับ editable (คืน HTMLAttributes แต่สอดไส้ props ให้ EditableCell) -----
  const mergedColumns: ColumnsType<DataType> = columns.map((col) => {
    if (!isDataColumn(col) || !col.editable) return col;

    const getInputType = (dataIndex: keyof DataType) =>
      dataIndex === "credit" || dataIndex === "startYear"
        ? "number"
        : dataIndex === "facultyId"
        ? "select"
        : dataIndex === "subjectIds"
        ? "multiselect"
        : "text";

    // cast ผ่าน unknown เพื่อเลี่ยง any และให้ TS ยอมรับ HTMLAttributes
    return {
      ...col,
      onCell: (record: DataType) =>
        ({
          record,
          inputType: getInputType(col.dataIndex as keyof DataType),
          dataIndex: col.dataIndex as keyof DataType,
          title: col.title as React.ReactNode,
          editing: record.key === editingKey,
        } as unknown as React.HTMLAttributes<HTMLTableCellElement>),
    } as ColumnType<DataType>;
  });

  // ====================== 7) Render ======================
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ padding: 24 }}>
        <OptionsCtx.Provider value={{ faculties, subjects }}>
          <Form form={form} component={false}>
            <Input
              placeholder="Search curriculum or faculty"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ marginBottom: 16, width: 320 }}
              prefix={<SearchOutlined />}
              allowClear
            />
            <Table<DataType>
              components={{ body: { cell: EditableCell } }}
              bordered
              dataSource={filteredData}
              columns={mergedColumns}
              rowKey="key"
              loading={loading}
              pagination={{ onChange: () => setEditingKey("") }}
            />
          </Form>
        </OptionsCtx.Provider>
      </Content>
    </Layout>
  );
};

export default CHANGE;
