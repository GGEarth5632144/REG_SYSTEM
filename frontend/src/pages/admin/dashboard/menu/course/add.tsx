import React, { useState, useEffect } from "react";
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
import { PlusOutlined } from "@ant-design/icons"; // Import Plus icon
import dayjs from "dayjs"; // ใช้ dayjs ในการจัดการวัน

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

type Faculty = { id: string; name: string };

type Subject = {
  id: string;
  name: string;
  credit: number;
  schedule: { start: string; end: string }[]; // Array of objects with start and end strings
  formattedSchedule?: string[]; // Optional property for formatted schedule
  facultyId: string;
};

type FormValues = {
  name: string;
  credit: number;
  facultyId: string;
  schedule: [dayjs.Dayjs, dayjs.Dayjs][];
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

const ADD: React.FC = () => {
  const [form] = Form.useForm();
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingFaculties, setLoadingFaculties] = useState(false);
  // ให้ useEffect แปลงข้อมูลทุกตัว ไม่ใช่แค่ id = "1"
  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        setLoadingFaculties(true);
        const resp = await fetch("/api/faculties");
        if (!resp.ok) throw new Error("Failed to load faculties");
        const data = await resp.json();
        setFaculties(data);
      } catch {
        message.error("โหลดรายชื่อคณะไม่สำเร็จ");
      } finally {
        setLoadingFaculties(false);
      }
    };

    const fetchSubjects = async () => {
      try {
        const resp = await fetch("/api/subjects");
        if (!resp.ok) throw new Error("Failed to load subjects");
        const subjectsData: Subject[] = await resp.json();
        const subjectsWithFormatted = subjectsData.map((subject) => ({
          ...subject,
          formattedSchedule: subject.schedule.map(
            (range: { start: string; end: string }) => {
              const start = dayjs(range.start, "YYYY-MM-DD HH:mm");
              const end = dayjs(range.end, "YYYY-MM-DD HH:mm");
              return `${start.format("dddd HH:mm")} - ${end.format(
                "dddd HH:mm"
              )}`;
            }
          ),
        }));
        setSubjects(subjectsWithFormatted);
      } catch {
        message.error("โหลดข้อมูลรายวิชาไม่สำเร็จ");
      }
    };

    fetchFaculties();
    fetchSubjects();
  }, []);
  // Handle form submission
  const onFinish = async (values: FormValues) => {
    const payload = {
      name: values.name,
      credit: values.credit,
      facultyId: values.facultyId,
      schedule: values.schedule.map((range) => ({
        start: range[0].format("YYYY-MM-DD HH:mm"),
        end: range[1].format("YYYY-MM-DD HH:mm"),
      })),
    };
    console.log(payload);
  };

  return (
    <Layout style={pageStyle}>
      <Content style={contentStyle}>
        <div style={formShell}>
          <div style={{ marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0 }}>
              เพิ่มรายวิชาใหม่
            </Title>
            <Text type="secondary">กรอกข้อมูลให้ครบ แล้วกด เพิ่มรายวิชา</Text>
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
              label="ชื่อรายวิชา"
              name="name"
              rules={[{ required: true, message: "กรุณากรอกชื่อรายวิชา" }]}
              style={{ width: "100%" }}
            >
              <Input
                placeholder="เช่น คณิตศาสตร์เบื้องต้น"
                style={{ height: 44, maxWidth: 600, fontSize: 15 }}
              />
            </Form.Item>

            <Form.Item
              label="หน่วยกิจ"
              name="credit"
              rules={[{ required: true, message: "กรุณากรอกหน่วยกิจ" }]}
              style={{ width: "100%" }}
            >
              <Typography.Text type="danger">
                หมายเหตุ: หน่วยกิจต้องเป็นตัวเลขระหว่าง 1 ถึง 5
              </Typography.Text>
              <div style={{ height: 5 }} aria-hidden="true" />
              <Input
                placeholder="เช่น 3"
                inputMode="numeric"
                maxLength={5}
                minLength={1}
                style={{ height: 44, maxWidth: 300, fontSize: 15 }}
              />
            </Form.Item>

            <Form.Item
              label="เวลาเรียน"
              name={name}
              rules={[{ required: true, message: "กรุณากรอกเวลาเรียน" }]}
              style={{ width: "100%" }}
            >
              <Typography.Text type="danger">
                หมายเหตุ: เวลาเรียนจะคิดแค่วัน อาทิตย์-เสาร์ เวลา 00:00 - 23:59
                เท่านั้นไม่รวมวันที่
              </Typography.Text>
              <div style={{ height: 5 }} aria-hidden="true" />
              <Form.List name="schedule">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name }) => (
                      <Space
                        key={key}
                        style={{ display: "flex", marginBottom: 8 }}
                        align="baseline"
                      >
                        <Form.Item
                          name={[name, "time"]}
                          rules={[
                            { required: true, message: "กรุณากรอกเวลาเรียน" },
                          ]}
                          style={{ width: "100%" }}
                        >
                          <DatePicker.RangePicker
                            format="YYYY-MM-DD HH:mm"
                            showTime
                            minuteStep={1}
                          />
                        </Form.Item>
                        <Popconfirm
                          title="Are you sure you want to delete this time?"
                          onConfirm={() => remove(name)}
                        >
                          <Button
                            type="link"
                            icon={
                              <Typography.Text type="danger">
                                Delete
                              </Typography.Text>
                            }
                          />
                        </Popconfirm>
                      </Space>
                    ))}
                    <Form.Item>
                      <Button
                        type="dashed"
                        onClick={() => add()}
                        block
                        icon={<PlusOutlined />}
                      >
                        เพิ่มเวลาเรียน
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </Form.Item>

            <Form.Item
              label="เลือกสาขาของรายวิชา"
              name="facultyId"
              rules={[{ required: true, message: "กรุณาเลือกสาขา" }]}
              style={{ width: "100%" }}
            >
              <Select
                placeholder="เลือกสาขา"
                loading={loadingFaculties}
                style={{ maxWidth: 300, fontSize: 15, width: "100%" }}
              >
                {faculties.map((f) => (
                  <Option key={f.id} value={f.id}>
                    {f.name}
                  </Option>
                ))}
              </Select>
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
                เพิ่มรายวิชา
              </Button>
            </Form.Item>
          </Form>
        </div>
        <div style={{ marginTop: 40 }}>
          <Title level={4}>รายวิชาที่เพิ่มแล้ว</Title>
          <Table
            className="custom-table-header"
            columns={[
              {
                title: "ชื่อรายวิชา",
                dataIndex: "name",
              },
              {
                title: "หน่วยกิจ",
                dataIndex: "credit",
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
            ]}
            dataSource={subjects}
            rowKey="id"
            pagination={false}
            rowClassName={(record, index) =>
              index % 2 === 0 ? "table-row-light" : "table-row-dark"
            }
          />
        </div>
        <style>
          {`
            .table-row-light {
              background-color: #dad1d1ff;
            }
            .table-row-dark {
              background-color: #dad1d1ff;
            }
            .custom-table-header .ant-table-thead > tr > th {
              background: #2e236c;
              color: #fff;
              font-weight: bold;
              font-size: 16px;
              border-bottom: 2px solid #ffffffff; /* header bottom border */
              border-right: 2px solid #ffffffff;  /* vertical grid */
            }
            .custom-table-header .ant-table-tbody > tr > td {
              border-bottom: 2px solid #ffffffff; /* row bottom border */
              border-right: 2px solid #ffffffff;  /* vertical grid */
            }
            .custom-table-header .ant-table-tbody > tr > td:last-child {
              border-right: none; /* remove right border for last column */
            }
            .custom-table-header .ant-table-thead > tr > th {
              border-right: 2px solid #ffffffff; /* header vertical grid */
            }
            .custom-table-header .ant-table-thead > tr > th:last-child {
              border-right: none;
            }
              .custom-table-header .ant-table-tbody > tr:hover > td {
              background-color: #dad1d1ff !important; /* light purple, change as you like */
              transition: background 0.2s;
            }
          `}
        </style>
      </Content>
    </Layout>
  );
};

export default ADD;
