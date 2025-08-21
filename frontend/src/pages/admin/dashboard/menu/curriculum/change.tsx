import React, { useState } from "react";
import {
  Layout,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Table,
  Typography,
  Select,
  DatePicker,
} from "antd";
import type { ColumnsType, ColumnType } from "antd/es/table";
import dayjs from "dayjs";
import { SearchOutlined } from "@ant-design/icons";
const { Content } = Layout;

interface DataType {
  key: string;
  subjectName: string;
  credit: number;
  studyTime: { start: string; end: string }[] | null; // Allow null for studyTime
  major: string;
}
interface EditableColumnType extends ColumnType<DataType> {
  editable?: boolean;
  inputType?: "number" | "text" | "time" | "select";
}

const originData: DataType[] = [
  {
    key: "1",
    subjectName: "Computer Science",
    credit: 3,
    studyTime: [
      { start: "2025-08-10 15:00", end: "2025-08-10 18:00" },
      { start: "2025-08-14 09:00", end: "2025-08-14 12:00" },
    ],
    major: "Artificial Intelligence",
  },
  {
    key: "2",
    subjectName: "Mathematics",
    credit: 4,
    studyTime: [
      { start: "2025-08-10 15:00", end: "2025-08-10 18:00" },
      { start: "2025-08-12 09:00", end: "2025-08-12 12:00" },
    ],
    major: "Computer Science",
  },
  {
    key: "3",
    subjectName: "Physics",
    credit: 3,
    studyTime: [
      { start: "2025-08-10 15:00", end: "2025-08-10 18:00" },
      { start: "2025-08-12 09:00", end: "2025-08-12 12:00" },
    ],
    major: "Virtual Reality",
  },
  {
    key: "4",
    subjectName: "Chemistry",
    credit: 4,
    studyTime: [
      { start: "2025-08-10 15:00", end: "2025-08-10 18:00" },
      { start: "2025-08-12 09:00", end: "2025-08-12 12:00" },
    ],
    major: "Physics",
  },
  {
    key: "5",
    subjectName: "English Literature",
    credit: 2,
    studyTime: [
      { start: "2025-08-10 15:00", end: "2025-08-10 18:00" },
      { start: "2025-08-12 09:00", end: "2025-08-12 12:00" },
    ],
    major: "fac-3",
  },
];

interface EditableCellProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  editing: boolean;
  dataIndex: string;
  columnTitle: React.ReactNode;
  inputType: "number" | "text" | "time" | "select";
  record: DataType;
  index: number;
  setData: React.Dispatch<React.SetStateAction<DataType[]>>;
  data: DataType[];
}

const EditableCell: React.FC<EditableCellProps> = ({
  editing,
  dataIndex,
  columnTitle,
  inputType,
  record,
  index,
  children,
  setData,
  data,
  ...restProps
}) => {
  const inputNode =
    inputType === "number" ? (
      <InputNumber min={1} max={5} style={{ width: 50 }} />
    ) : inputType === "time" ? (
      <div>
        {/* Loop through all studyTime sessions and create a RangePicker for each session */}
        {record.studyTime?.map((session, sessionIndex) => (
          <div key={sessionIndex}>
            <DatePicker.RangePicker
              format="YYYY-MM-DD HH:mm"
              showTime
              value={
                session ? [dayjs(session.start), dayjs(session.end)] : null
              }
              onChange={(value) => {
                if (value && value[0] && value[1]) {
                  const start = value[0];
                  const end = value[1];

                  // Check if both dates are valid
                  if (start.isValid() && end.isValid()) {
                    const newData = [...data]; // Copy the existing data

                    // Ensure the specific session is updated
                    if (newData[index].studyTime) {
                      newData[index].studyTime = newData[index].studyTime.map(
                        (existingSession, sessionIdx) => {
                          if (sessionIdx === sessionIndex) {
                            // Update the selected session with the new time
                            return {
                              start: start.format("YYYY-MM-DD HH:mm"),
                              end: end.format("YYYY-MM-DD HH:mm"),
                            };
                          }
                          return existingSession; // Keep the other sessions intact
                        }
                      );
                    }

                    setData(newData); // Update the state with the modified data
                  } else {
                    console.error("Invalid date range selected.");
                  }
                }
              }}
            />
          </div>
        ))}
      </div>
    ) : inputType === "select" ? (
      <Select
        defaultValue={record.major}
        style={{ width: 150 }}
        onChange={(value) => {
          const newData = [...data];
          newData[index].major = value;
          setData(newData);
        }}
      >
        <Select.Option value="Information Technology">
          Information Technology
        </Select.Option>
        <Select.Option value="Engineering">Engineering</Select.Option>
        <Select.Option value="Science">Science</Select.Option>
        <Select.Option value="Arts">Arts</Select.Option>
      </Select>
    ) : (
      <Input />
    );

  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          rules={[{ required: true, message: `Please Input ${columnTitle}!` }]}
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

const CHANGE: React.FC = () => {
  const [form] = Form.useForm();
  const [data, setData] = useState<DataType[]>(originData);
  const [editingKey, setEditingKey] = useState("");
  const [searchText, setSearchText] = useState(""); // เพิ่ม state สำหรับค้นหา

  const isEditing = (record: DataType) => record.key === editingKey;

  const edit = (record: Partial<DataType> & { key: React.Key }) => {
    form.setFieldsValue({
      subjectName: record.subjectName,
      credit: record.credit,
      studyTime: record.studyTime,
      major: record.major,
      ...record,
    });
    setEditingKey(record.key);
  };

  const cancel = () => {
    setEditingKey("");
  };

  const save = async (key: React.Key) => {
    try {
      const row = (await form.validateFields()) as DataType;
      const newData = [...data]; // ใช้ข้อมูลจาก state (data)
      const index = newData.findIndex((item) => key === item.key);

      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, {
          ...item,
          ...row, // อัปเดตข้อมูลจาก row ที่แก้ไข
          studyTime: item.studyTime, // คงค่า studyTime เดิมไว้
        });
        setData(newData); // อัปเดตข้อมูลใน state
        setEditingKey(""); // ปิดการแก้ไข
      } else {
        newData.push(row);
        setData(newData);
        setEditingKey("");
      }
    } catch (errInfo) {
      console.log("Validate Failed:", errInfo);
    }
  };

  const handleDelete = (key: React.Key) => {
    const newData = data.filter((item) => item.key !== key);
    setData(newData);
  };

  // กรองข้อมูลตาม searchText
  const filteredData = data.filter(
    (item) =>
      item.subjectName.toLowerCase().includes(searchText.toLowerCase()) ||
      item.major.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns: EditableColumnType[] = [
    {
      title: "Subject Name",
      dataIndex: "subjectName",
      width: "20%",
      editable: true,
    },
    {
      title: "Credit",
      dataIndex: "credit",
      width: "10%",
      editable: true,
    },
    {
      title: "Study Time",
      dataIndex: "studyTime",
      width: "20%",
      editable: true,
      render: (studyTime: { start: string; end: string }[] | null) => {
        if (studyTime && studyTime.length > 0) {
          return (
            <>
              {studyTime.map((session, index) => {
                const startDay = dayjs(session.start).format("dddd");
                const endDay = dayjs(session.end).format("dddd");
                const startTime = dayjs(session.start).format("HH:mm");
                const endTime = dayjs(session.end).format("HH:mm");

                return (
                  <div key={index} style={{ fontSize: "10px" }}>
                    {`${startDay} ${startTime} - ${endDay} ${endTime}`}
                  </div>
                );
              })}
            </>
          );
        }
        return <span style={{ fontSize: "10px" }}>Not set</span>;
      },
    },
    {
      title: "Major",
      dataIndex: "major",
      width: "20%",
      editable: true,
      inputType: "select",
    },
    {
      title: "Edit",
      dataIndex: "edit",
      width: "10%",
      render: (_: unknown, record: DataType) => {
        const editable = isEditing(record);
        return editable ? (
          <span>
            <Typography.Link
              onClick={() => save(record.key)}
              style={{ marginInlineEnd: 8, fontSize: "10px" }}
            >
              Save
            </Typography.Link>
            <Popconfirm title="Sure to cancel?" onConfirm={cancel}>
              <a style={{ fontSize: "10px" }}>Cancel</a>
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
      width: "10%",
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

  const mergedColumns: ColumnsType<DataType> = columns.map((col) => ({
    ...col,
    onCell: col.editable
      ? (record: DataType, rowIndex?: number) =>
          ({
            record,
            inputType:
              col.dataIndex === "studyTime"
                ? "time"
                : col.dataIndex === "credit"
                ? "number"
                : col.dataIndex === "major"
                ? "select"
                : "text",
            dataIndex: col.dataIndex,
            columnTitle: col.title,
            editing: isEditing(record),
            setData, // Pass setData as prop
            data, // Pass the current data
            index: rowIndex!, // Pass the row index
          } as EditableCellProps)
      : undefined,
  }));

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ padding: "24px" }}>
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
              border-bottom: 2px solid #ffffffff;
              border-right: 2px solid #ffffffff;
            }
            .custom-table-header .ant-table-tbody > tr > td {
              border-bottom: 2px solid #ffffffff;
              border-right: 2px solid #ffffffff;
            }
            .custom-table-header .ant-table-tbody > tr > td:last-child {
              border-right: none;
            }
            .custom-table-header .ant-table-thead > tr > th {
              border-right: 2px solid #ffffffff;
            }
            .custom-table-header .ant-table-thead > tr > th:last-child {
              border-right: none;
            }
            .custom-table-header .ant-table-tbody > tr:hover > td {
              background-color: #dad1d1ff !important;
              transition: background 0.2s;
            }
          `}
        </style>
        <Form form={form} component={false}>
          <Input
            placeholder="ค้นหาวิชา หรือ สาขา"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ marginBottom: 16, width: 300, height: 40, fontSize: 16 }}
            prefix={<SearchOutlined />}
          />
          <Table<DataType>
            components={{
              body: { cell: EditableCell },
            }}
            bordered
            dataSource={filteredData}
            columns={mergedColumns}
            rowClassName={(_record, index) =>
              index % 2 === 0 ? "table-row-light" : "table-row-dark"
            }
            className="custom-table-header"
            pagination={{ onChange: cancel }}
          />
        </Form>
      </Content>
    </Layout>
  );
};

export default CHANGE;
