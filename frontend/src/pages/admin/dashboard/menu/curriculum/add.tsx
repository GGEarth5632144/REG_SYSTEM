import React, { useEffect, useState } from "react";
import {
  Layout,
  Form,
  Input,
  Select,
  Button,
  Typography,
  message,
  Upload,
  Table,
} from "antd";
import dayjs from "dayjs";
import { InboxOutlined } from "@ant-design/icons";
import { SearchOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

type Faculty = { id: string; name: string };
type Subject = {
  id: string;
  name: string;
  credit: number;
  schedule: { start: string; end: string }[]; // Array of schedule time objects
};

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

const beforeUploadPdf: UploadProps["beforeUpload"] = (file) => {
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    message.error("อัปโหลดได้เฉพาะไฟล์ PDF เท่านั้น");
    return Upload.LIST_IGNORE;
  }
  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    message.error("ขนาดไฟล์ต้องไม่เกิน 10MB");
    return Upload.LIST_IGNORE;
  }
  return false;
};

const normFile = (e: any) => (Array.isArray(e) ? e : e?.fileList);

const ADD: React.FC = () => {
  const [form] = Form.useForm();
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<React.Key[]>([]);
  const [loadingFaculties, setLoadingFaculties] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);

  // ฟังก์ชันค้นหาวิชา
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    const filtered = subjects.filter((subject) =>
      subject.name.toLowerCase().includes(value.toLowerCase())
    );

    const subjectsWithFormatted = filtered.map((subject) => ({
      ...subject,
      formattedSchedule: subject.schedule.map((range: any) => {
        const start = dayjs(range.start, "YYYY-MM-DD HH:mm");
        const end = dayjs(range.end, "YYYY-MM-DD HH:mm");
        return `${start.format("dddd HH:mm")} - ${end.format("dddd HH:mm")}`;
      }),
    }));

    setFilteredSubjects(subjectsWithFormatted);
  };

  // ฟังก์ชันที่แปลงเวลาสำหรับการแสดงผล
  useEffect(() => {
    const subjectsWithFormatted = subjects.map((subject) => ({
      ...subject,
      formattedSchedule: subject.schedule.map((range: any) => {
        const start = dayjs(range.start, "YYYY-MM-DD HH:mm");
        const end = dayjs(range.end, "YYYY-MM-DD HH:mm");
        return `${start.format("dddd HH:mm")} - ${end.format("dddd HH:mm")}`;
      }),
    }));
    setFilteredSubjects(subjectsWithFormatted);
  }, [subjects]); // This ensures the formatted schedule updates on subjects change

  const columns = [
    {
      title: "ชื่อรายวิชา",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "หน่วยกิจ",
      dataIndex: "credit",
      key: "credit",
    },
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
      title: "สาขาวิชา",
      dataIndex: "facultyId",
      render: (value) => {
        const faculty = faculties.find((f) => f.id === value);
        return faculty ? faculty.name : "";
      },
    },
  ];

  const handleSelectionChange = (selectedRowKeys: React.Key[]) => {
    setSelectedSubjects(selectedRowKeys);
  };

  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        setLoadingFaculties(true);
        setTimeout(
          () =>
            setFaculties([
              { id: "fac-1", name: "วิศวกรรมศาสตร์" },
              { id: "fac-2", name: "เทคโนโลยีสารสนเทศ" },
              { id: "fac-3", name: "บริหารธุรกิจ" },
            ]),
          300
        );
      } catch {
        message.error("โหลดรายชื่อคณะไม่สำเร็จ");
      } finally {
        setLoadingFaculties(false);
      }
    };

    const fetchSubjects = async () => {
      try {
        const subjectsData = [
          {
            id: "1",
            name: "Computer Science",
            credit: 3,
            facultyId: "fac-1",
            schedule: [
              { start: "2025-08-10 15:00", end: "2025-08-10 18:00" },
              { start: "2025-08-12 09:00", end: "2025-08-12 12:00" },
            ],
          },
          {
            id: "2",
            name: "Mathematics",
            credit: 4,
            facultyId: "fac-1",
            schedule: [
              { start: "2025-08-11 13:00", end: "2025-08-11 15:00" },
              { start: "2025-08-12 09:00", end: "2025-08-12 12:00" },
            ],
          },
          {
            id: "3",
            name: "Physics",
            credit: 3,
            facultyId: "fac-2",
            schedule: [{ start: "2025-08-13 10:00", end: "2025-08-13 12:00" }],
          },
          {
            id: "4",
            name: "Chemistry",
            credit: 4,
            facultyId: "fac-2",
            schedule: [{ start: "2025-08-14 09:00", end: "2025-08-14 11:00" }],
          },
          {
            id: "5",
            name: "English Literature",
            credit: 2,
            facultyId: "fac-3",
            schedule: [{ start: "2025-08-15 14:00", end: "2025-08-15 16:00" }],
          },
        ];

        setSubjects(subjectsData);
      } catch {
        message.error("โหลดข้อมูลรายวิชาไม่สำเร็จ");
      }
    };

    fetchFaculties();
    fetchSubjects();
  }, []);

  const onFinish = async (values: any) => {
    try {
      const fileObj: File | undefined = values?.syllabus?.[0]?.originFileObj;
      if (!fileObj) {
        message.error("กรุณาอัปโหลดไฟล์ PDF");
        return;
      }

      const fd = new FormData();
      fd.append("syllabus", fileObj);
      fd.append("name", values.name);
      fd.append("credit", String(values.credit));
      fd.append("startYear", String(values.startYear));
      fd.append("facultyId", values.facultyId);

      if (categoryId) fd.append("categoryId", categoryId);

      (values.subjectIds ?? []).forEach((id: string) =>
        fd.append("subjectIds[]", id)
      );
      if (values.description) fd.append("description", values.description);

      const resp = await fetch("/api/curriculums", {
        method: "POST",
        body: fd,
      });
      if (!resp.ok) throw new Error("Create failed");

      message.success("เพิ่มหลักสูตรสำเร็จ 🎉");
      form.resetFields();
      setCategoryId(undefined);
    } catch {
      message.error("บันทึกข้อมูลไม่สำเร็จ");
    }
  };

  return (
    <Layout style={pageStyle}>
      <Content style={contentStyle}>
        <div style={formShell}>
          <div style={{ marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0 }}>
              เพิ่มหลักสูตรใหม่
            </Title>
            <Text type="secondary">กรอกข้อมูลให้ครบ แล้วกด เพิ่มข้อมูล</Text>
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
            <Form.Item
              label="ชื่อหลักสูตร"
              name="name"
              rules={[{ required: true, message: "กรุณากรอกชื่อหลักสูตร" }]}
              style={{ width: "100%" }}
            >
              <Input
                placeholder="เช่น วิทยาการข้อมูล"
                style={{ height: 44, maxWidth: 600, fontSize: 15 }}
                maxLength={100}
                showCount
              />
            </Form.Item>
            <Form.Item
              label="หน่วยกิตทั้งหมด"
              name="credit"
              rules={[{ required: true, message: "กรุณากรอกหน่วยกิต" }]}
              style={{ width: "100%" }}
            >
              <Input
                placeholder="เช่น 120"
                inputMode="numeric"
                style={{ height: 44, maxWidth: 300, fontSize: 15 }}
              />
            </Form.Item>
            <Form.Item
              label="ปีที่เริ่มหลักสูตร (ค.ศ.)"
              name="startYear"
              rules={[{ required: true, message: "กรุณากรอกปีที่เริ่ม" }]}
              style={{ width: "100%" }}
            >
              <Input
                placeholder="2025"
                inputMode="numeric"
                style={{ height: 44, maxWidth: 300, fontSize: 15 }}
              />
            </Form.Item>
            <Form.Item
              label="คณะของหลักสูตร"
              name="facultyId"
              rules={[{ required: true, message: "กรุณาเลือกคณะ" }]}
              style={{ width: "100%" }}
            >
              <Select
                placeholder="เลือกคณะ"
                loading={loadingFaculties}
                style={{ maxWidth: 300, fontSize: 15, width: "100%" }}
                showSearch
                optionFilterProp="children"
              >
                {faculties.map((f) => (
                  <Option key={f.id} value={f.id}>
                    {f.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="รายวิชาที่สาขานี้เปิดสอน"
              name="subjectIds"
              rules={[
                { required: true, message: "กรุณาเลือกอย่างน้อย 1 วิชา" },
              ]}
              style={{ width: "100%" }}
            >
              <Input
                placeholder="ค้นหารายวิชา"
                onChange={(e) => handleSearch(e.target.value)}
                style={{
                  height: 44,
                  maxWidth: 400,
                  fontSize: 15,
                  marginBottom: 16,
                }}
                prefix={<SearchOutlined />}
              />

              <Table
                rowSelection={{
                  selectedRowKeys: selectedSubjects,
                  onChange: handleSelectionChange,
                  type: "checkbox",
                  hideSelectAll: true,
                }}
                columns={columns}
                dataSource={filteredSubjects}
                rowKey="id"
                pagination={{
                  pageSize: 5,
                  total: filteredSubjects.length,
                }}
              />
            </Form.Item>

            <Form.Item
              label="เล่มหลักสูตร (PDF เท่านั้น)"
              name="syllabus"
              valuePropName="fileList"
              getValueFromEvent={normFile}
              rules={[{ required: true, message: "กรุณาอัปโหลดไฟล์ PDF" }]}
              style={{ width: "100%" }}
            >
              <Upload.Dragger
                accept=".pdf,application/pdf"
                multiple={false}
                maxCount={1}
                beforeUpload={beforeUploadPdf}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">
                  ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือก
                </p>
                <p className="ant-upload-hint">รองรับ .pdf ขนาดไม่เกิน 10MB</p>
              </Upload.Dragger>
            </Form.Item>

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
                เพิ่มข้อมูล
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Content>
    </Layout>
  );
};

export default ADD;
