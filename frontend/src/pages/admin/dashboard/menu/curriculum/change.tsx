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
} from "antd";
import type { ColumnsType, ColumnType } from "antd/es/table";
import { SearchOutlined } from "@ant-design/icons";

const { Content } = Layout;

interface DataType {
  key: string;
  name: string;
  credit: number;
  startYear: number;
  facultyId: string;
  subjectIds: string[];
  syllabusUrl: string;
}

interface EditableColumnType extends ColumnType<DataType> {
  editable?: boolean;
  inputType?: "number" | "text" | "select" | "multiselect";
}

const faculties = [
  { id: "fac-1", name: "Engineering" },
  { id: "fac-2", name: "Science" },
  { id: "fac-3", name: "Arts" },
];

const facultyMap = faculties.reduce((acc, cur) => {
  acc[cur.id] = cur.name;
  return acc;
}, {} as Record<string, string>);

const subjects = [
  { id: "sub-1", name: "Algorithms" },
  { id: "sub-2", name: "Databases" },
  { id: "sub-3", name: "Calculus" },
  { id: "sub-4", name: "Physics" },
];

const originData: DataType[] = [
  {
    key: "1",
    name: "Computer Science",
    credit: 120,
    startYear: 2020,
    facultyId: "fac-1",
    subjectIds: ["sub-1", "sub-2"],
    syllabusUrl: "https://example.com/cs.pdf",
  },
  {
    key: "2",
    name: "Mathematics",
    credit: 110,
    startYear: 2019,
    facultyId: "fac-2",
    subjectIds: ["sub-3"],
    syllabusUrl: "https://example.com/math.pdf",
  },
  {
    key: "3",
    name: "Physics",
    credit: 130,
    startYear: 2021,
    facultyId: "fac-3",
    subjectIds: ["sub-4"],
    syllabusUrl: "https://example.com/physics.pdf",
  },
];

interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
  editing: boolean;
  dataIndex: keyof DataType;
  columnTitle: React.ReactNode;
  inputType: "number" | "text" | "select" | "multiselect";
}

const EditableCell: React.FC<EditableCellProps> = ({
  editing,
  dataIndex,
  columnTitle,
  inputType,
  children,
  ...restProps
}) => {
  let inputNode: React.ReactNode;
  if (inputType === "number") {
    inputNode = <InputNumber />;
  } else if (inputType === "select") {
    inputNode = (
      <Select>
        {faculties.map((fac) => (
          <Select.Option key={fac.id} value={fac.id}>
            {fac.name}
          </Select.Option>
        ))}
      </Select>
    );
  } else if (inputType === "multiselect") {
    inputNode = (
      <Select mode="multiple">
        {subjects.map((sub) => (
          <Select.Option key={sub.id} value={sub.id}>
            {sub.name}
          </Select.Option>
        ))}
      </Select>
    );
  } else {
    inputNode = <Input />;
  }

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
  const [searchText, setSearchText] = useState("");

  const isEditing = (record: DataType) => record.key === editingKey;

  const edit = (record: Partial<DataType> & { key: React.Key }) => {
    form.setFieldsValue({
      name: "",
      credit: 0,
      startYear: 0,
      facultyId: "",
      subjectIds: [],
      syllabusUrl: "",
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
      const newData = [...data];
      const index = newData.findIndex((item) => key === item.key);

      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, { ...item, ...row });
        setData(newData);
        setEditingKey("");
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

  const filteredData = data.filter(
    (item) =>
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      facultyMap[item.facultyId]
        .toLowerCase()
        .includes(searchText.toLowerCase())
  );

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
      title: "Curriculum Start Year",
      dataIndex: "startYear",
      width: "15%",
      editable: true,
    },
    {
      title: "Faculty",
      dataIndex: "facultyId",
      width: "15%",
      editable: true,
      render: (facultyId: string) => facultyMap[facultyId] || facultyId,
    },
    {
      title: "Subjects in Curriculum",
      dataIndex: "subjectIds",
      width: "20%",
      editable: true,
      render: (subjectIds: string[]) => subjectIds.join(", "),
    },
    {
      title: "Curriculum Book",
      dataIndex: "syllabusUrl",
      width: "10%",
      editable: true,
      render: (url: string) =>
        url ? (
          <a href={url} target="_blank" rel="noopener noreferrer">
            View
          </a>
        ) : null,
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

  const mergedColumns: ColumnsType<DataType> = columns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: DataType) => ({
        record,
        inputType:
          col.dataIndex === "credit" || col.dataIndex === "startYear"
            ? "number"
            : col.dataIndex === "facultyId"
            ? "select"
            : col.dataIndex === "subjectIds"
            ? "multiselect"
            : "text",
        dataIndex: col.dataIndex,
        columnTitle: col.title,
        editing: isEditing(record),
      }),
    };
  });

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
            placeholder="Search curriculum or faculty"
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
