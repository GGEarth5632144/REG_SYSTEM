// ====================================================================
// AddSubject.tsx — หน้าเพิ่มรายวิชา + แสดงรายวิชาที่มีอยู่
// - ดึง Faculties และ Majors แยกกัน
// - ส่งค่า subject_name, credit, major_id, faculty_id ไปหลังบ้าน
// - แสดงชื่อคณะ (faculty_name) และสาขา (major_name) ในตาราง
// - แก้ Form.List schedule + รวม useEffect เดียวให้ถูกวงเล็บ
// ====================================================================

import React, { useState, useEffect, useMemo } from "react";
import {
  Layout,
  Form,
  Input,
  Select,
  Button,
  Typography,
  DatePicker,
  Space,
  Popconfirm,
  Table,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

// -----------------------------
// Types (ฝั่ง FE เก็บแบบง่าย แล้ว map จาก API ให้ตรง)
// -----------------------------
type Faculty = { id: string; name: string };
type Major = { id: string; name: string; facultyId?: string };

type SubjectRow = {
  subjectId: string;
  name: string;
  credit: number;
  schedule: { start: string; end: string }[];
  formattedSchedule?: string[];
  facultyId: string;
  facultyName?: string;
  majorId: string;
  majorName?: string;
};

type FormValues = {
  subjectId?: string;
  name: string;
  credit: number;
  facultyId: string;
  majorId: string;
  schedule: [dayjs.Dayjs, dayjs.Dayjs][];
};

// -----------------------------
// Styles
// -----------------------------
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

// ====================================================================
// Component
// ====================================================================
const ADD: React.FC = () => {
  const [form] = Form.useForm<FormValues>();

  // lists
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);

  // loading flags
  const [loadingFaculties, setLoadingFaculties] = useState(false);
  const [loadingMajors, setLoadingMajors] = useState(false);

  // faculty selection (เพื่อ filter major)
  const selectedFacultyId = Form.useWatch("facultyId", form);

  // -----------------------------
  // Helpers: fetch & map
  // -----------------------------
  const fetchFaculties = async () => {
    try {
      setLoadingFaculties(true);
      const resp = await fetch("/api/faculties");
      if (!resp.ok) throw new Error("Failed to load faculties");
      // สมมติ backend คืน snake_case: [{ faculty_id, faculty_name }]
      const data = await resp.json();
      const mapped: Faculty[] = (Array.isArray(data) ? data : []).map((f: any) => ({
        id: f.faculty_id ?? f.FacultyID ?? f.id,
        name: f.faculty_name ?? f.FacultyName ?? f.name,
      }));
      setFaculties(mapped);
    } catch {
      message.error("โหลดรายชื่อคณะไม่สำเร็จ");
    } finally {
      setLoadingFaculties(false);
    }
  };

  const fetchMajors = async () => {
    try {
      setLoadingMajors(true);
      const resp = await fetch("/api/majors");
      if (!resp.ok) throw new Error("Failed to load majors");
      // สมมติ backend คืน snake_case: [{ major_id, major_name, faculty_id }]
      const data = await resp.json();
      const mapped: Major[] = (Array.isArray(data) ? data : []).map((m: any) => ({
        id: m.major_id ?? m.MajorID ?? m.id,
        name: m.major_name ?? m.MajorName ?? m.name,
        facultyId: m.faculty_id ?? m.FacultyID,
      }));
      setMajors(mapped);
    } catch {
      message.error("โหลดรายชื่อสาขาไม่สำเร็จ");
    } finally {
      setLoadingMajors(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const resp = await fetch("/api/subjects");
      if (!resp.ok) throw new Error("Failed to load subjects");
      const data = await resp.json();

      // สมมติ backend คืน snake_case: subject_id, subject_name, credit, major_id, faculty_id, study_times, major_name, faculty_name
      const mapped: SubjectRow[] = (Array.isArray(data) ? data : []).map((s: any) => {
        const schedule = (s.study_times ?? s.schedule ?? []) as { start: string; end: string }[];
        const formattedSchedule = schedule.map((range) => {
          const start = dayjs(range.start, "YYYY-MM-DD HH:mm");
          const end = dayjs(range.end, "YYYY-MM-DD HH:mm");
          return `${start.format("dddd HH:mm")} - ${end.format("dddd HH:mm")}`;
        });
        return {
          subjectId: s.subject_id ?? s.SubjectID ?? s.id,
          name: s.subject_name ?? s.SubjectName ?? s.name,
          credit: s.credit,
          schedule,
          formattedSchedule,
          facultyId: s.faculty_id ?? s.FacultyID,
          facultyName: s.faculty_name ?? s.FacultyName,
          majorId: s.major_id ?? s.MajorID,
          majorName: s.major_name ?? s.MajorName,
        };
      });

      setSubjects(mapped);
    } catch {
      message.error("โหลดข้อมูลรายวิชาไม่สำเร็จ");
    }
  };

  // -----------------------------
  // Effects: load lists & subjects
  // -----------------------------
  useEffect(() => {
    fetchFaculties();
    fetchMajors();
    fetchSubjects();
  }, []);

  // -----------------------------
  // Derived: filter majors by selected faculty
  // -----------------------------
  const filteredMajors = useMemo(() => {
    if (!selectedFacultyId) return majors;
    return majors.filter((m) => !m.facultyId || m.facultyId === selectedFacultyId);
  }, [majors, selectedFacultyId]);

  // -----------------------------
  // Submit
  // -----------------------------
  const onFinish = async (values: FormValues) => {
    try {
      // 1) สร้างวิชา
      const resp = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_id: values.subjectId, // ถ้า backend gen เอง ตัดออกได้
          subject_name: values.name,
          credit: values.credit,
          major_id: values.majorId,
          faculty_id: values.facultyId,
        }),
      });
      if (!resp.ok) throw new Error("Failed to create subject");
      const data = await resp.json();
      const subjectId = data.subject_id ?? data.SubjectID ?? values.subjectId;
      if (!subjectId) throw new Error("Missing subject_id from response");

      // 2) สร้างช่วงเวลาเรียน
      await Promise.all(
        (values.schedule || []).map((range) =>
          fetch(`/api/subjects/${subjectId}/times`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              start: range[0].format("YYYY-MM-DD HH:mm"),
              end: range[1].format("YYYY-MM-DD HH:mm"),
            }),
          }).then((res) => {
            if (!res.ok) throw new Error("Failed to create time");
          })
        )
      );

      message.success("เพิ่มรายวิชาสำเร็จ");
      form.resetFields();
      fetchSubjects();
    } catch (e) {
      console.error(e);
      message.error("เพิ่มรายวิชาไม่สำเร็จ");
    }
  };

  // ====================================================================
  // Render
  // ====================================================================
  return (
    <Layout style={pageStyle}>
      <Content style={contentStyle}>
        {/* -------------------- ฟอร์มเพิ่มรายวิชา -------------------- */}
        <div style={formShell}>
          <div style={{ marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0 }}>
              เพิ่มรายวิชาใหม่
            </Title>
            <Text type="secondary">กรอกข้อมูลให้ครบ แล้วกด “เพิ่มรายวิชา”</Text>
          </div>

          <Form
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
            {/* ชื่อรายวิชา */}
            <Form.Item
              label="ชื่อรายวิชา"
              name="name"
              rules={[{ required: true, message: "กรุณากรอกชื่อรายวิชา" }]}
              style={{ width: "100%" }}
            >
              <Input placeholder="เช่น คณิตศาสตร์เบื้องต้น" style={{ height: 44, maxWidth: 600, fontSize: 15 }} />
            </Form.Item>

            {/* หน่วยกิต */}
            <Form.Item
              label="หน่วยกิจ"
              name="credit"
              rules={[
                { required: true, message: "กรุณากรอกหน่วยกิจ" },
                {
                  validator: (_, v) =>
                    v && Number(v) >= 1 && Number(v) <= 5
                      ? Promise.resolve()
                      : Promise.reject("หน่วยกิจต้องเป็นตัวเลข 1–5"),
                },
              ]}
              style={{ width: "100%" }}
            >
              <>
                <Typography.Text type="danger">
                  หมายเหตุ: หน่วยกิจต้องเป็นตัวเลขระหว่าง 1 ถึง 5
                </Typography.Text>
                <div style={{ height: 5 }} aria-hidden="true" />
                <Input placeholder="เช่น 3" inputMode="numeric" style={{ height: 44, maxWidth: 300, fontSize: 15 }} />
              </>
            </Form.Item>

            {/* เวลาเรียน (แก้ name ให้ถูก + เก็บเป็นคู่ [start, end]) */}
            <Form.Item
              label="เวลาเรียน"
              name="schedule"
              rules={[{ required: true, message: "กรุณากรอกเวลาเรียน" }]}
              style={{ width: "100%" }}
            >
              <>
                <Typography.Text type="danger">
                  หมายเหตุ: เพิ่มได้หลายช่วงเวลา
                </Typography.Text>
                <div style={{ height: 5 }} aria-hidden="true" />
                <Form.List name="schedule">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name }) => (
                        <Space key={key} style={{ display: "flex", marginBottom: 8 }} align="baseline">
                          <Form.Item
                            name={name}
                            rules={[{ required: true, message: "กรุณากรอกเวลาเรียน" }]}
                            style={{ width: "100%" }}
                          >
                            <DatePicker.RangePicker format="YYYY-MM-DD HH:mm" showTime minuteStep={1} />
                          </Form.Item>
                          <Popconfirm title="ลบช่วงเวลานี้?" onConfirm={() => remove(name)}>
                            <Button type="link" danger>ลบ</Button>
                          </Popconfirm>
                        </Space>
                      ))}
                      <Form.Item>
                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                          เพิ่มเวลาเรียน
                        </Button>
                      </Form.Item>
                    </>
                  )}
                </Form.List>
              </>
            </Form.Item>

            {/* เลือกคณะ */}
            <Form.Item
              label="คณะ (Faculty)"
              name="facultyId"
              rules={[{ required: true, message: "กรุณาเลือกคณะ" }]}
              style={{ width: "100%" }}
            >
              <Select
                placeholder="เลือกคณะ"
                loading={loadingFaculties}
                style={{ maxWidth: 300, fontSize: 15, width: "100%" }}
                allowClear
              >
                {faculties.map((f) => (
                  <Option key={f.id} value={f.id}>
                    {f.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* เลือกสาขา (filter ตามคณะที่เลือก) */}
            <Form.Item
              label="สาขา (Major)"
              name="majorId"
              rules={[{ required: true, message: "กรุณาเลือกสาขา" }]}
              style={{ width: "100%" }}
            >
              <Select
                placeholder="เลือกสาขา"
                loading={loadingMajors}
                style={{ maxWidth: 300, fontSize: 15, width: "100%" }}
                disabled={!selectedFacultyId}
                allowClear
              >
                {filteredMajors.map((m) => (
                  <Option key={m.id} value={m.id}>
                    {m.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* ปุ่มบันทึก */}
            <Form.Item style={{ marginTop: 8 }}>
              <Button
                type="primary"
                htmlType="submit"
                style={{
                  backgroundColor: "#2e236c",
                  height: 44,
                  minWidth: 160,
                  borderRadius: 10,
                  fontWeight: 600,
                }}
              >
                เพิ่มรายวิชา
              </Button>
            </Form.Item>
          </Form>
        </div>

        {/* -------------------- ตารางรายวิชาที่เพิ่มแล้ว -------------------- */}
        <div style={{ marginTop: 40 }}>
          <Title level={4}>รายวิชาที่เพิ่มแล้ว</Title>
          <Table
            className="custom-table-header"
            columns={[
              { title: "ชื่อรายวิชา", dataIndex: "name" },
              { title: "หน่วยกิจ", dataIndex: "credit" },
              {
                title: "เวลาเรียน",
                dataIndex: "formattedSchedule",
                render: (formattedSchedule: string[] = []) =>
                  formattedSchedule.map((entry, idx) => (
                    <span key={idx}>
                      {entry}
                      {idx !== formattedSchedule.length - 1 && <br />}
                    </span>
                  )),
              },
              {
                title: "คณะ",
                dataIndex: "facultyName",
                render: (_: unknown, row: SubjectRow) => row.facultyName ?? (faculties.find(f => f.id === row.facultyId)?.name || ""),
              },
              {
                title: "สาขา",
                dataIndex: "majorName",
                render: (_: unknown, row: SubjectRow) => row.majorName ?? (majors.find(m => m.id === row.majorId)?.name || ""),
              },
            ]}
            dataSource={subjects}
            rowKey="subjectId"
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

export default ADD;
