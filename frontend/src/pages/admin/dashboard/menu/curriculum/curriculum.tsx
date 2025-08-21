// src/pages/dashboard/menu/register.tsx
import React, { useState } from "react";
import { Layout, Button } from "antd";
import "./curriculum.css";
import ADD from "./add";
import CHANGE from "./change";

const { Header, Content, Footer } = Layout;

const wrapperStyle: React.CSSProperties = {
  borderRadius: 8,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  width: "100%",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};
const headerStyle: React.CSSProperties = {
  height: 64,
  display: "flex",           // ⬅️ ต้องเป็น flex ไม่ใช่ "center"
  alignItems: "center",      // จัดกึ่งกลางแนวตั้ง
  justifyContent: "center",  // จัดกึ่งกลางแนวนอน
  background: "#2e236c",
  color: "white",
  padding: "0 16px",
  fontSize: 20,
  zIndex: 1000,
};
const contentStyle: React.CSSProperties = {
  background: "#f5f5f5",
  padding: 24,
  minHeight: 400,
  color: "#333",
  overflowY: "auto",
};
const footerStyle: React.CSSProperties = {
  background: "#1890ff",
  color: "white",
  textAlign: "center",
  padding: 12,
};
// --- Center box for buttons ---
const centerBox: React.CSSProperties = {
  minHeight: "50vh", // ensures vertical space to truly center
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const Curriculum: React.FC = () => {
  const [active, setActive] = useState<"add" | "change" | null>(null);

  return (
    <Layout style={wrapperStyle}>
      <Header style={headerStyle}>
        <div style={{ color: "white", fontWeight: "bold" ,justifyContent: "center", }}>
          Curriculum – ระบบจัดการหลักสูตร
        </div>
      </Header>
      <Content style={contentStyle}>
        {active === null ? (
          // 🔹 ยังไม่กดปุ่มใด ๆ → แสดงปุ่ม ADD + CHANGE
          <div style={centerBox}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Button
                type="primary"
                style={{
                  width: 250,
                  height: 70,
                  fontSize: 22,
                  backgroundColor: "#2e236c",
                }}
                onClick={() => setActive("add")}
              >
                ADD
              </Button>
              <Button
                type="primary"
                style={{
                  width: 250,
                  height: 70,
                  fontSize: 22,
                  backgroundColor: "#2e236c",
                }}
                onClick={() => setActive("change")}
              >
                CHANGE
              </Button>
            </div>
          </div>
        ) : (
          // 🔹 ถ้ากด ADD หรือ CHANGE → แสดงปุ่มกลับ
          <Button onClick={() => setActive(null)} type="dashed">
            ← กลับ
          </Button>
        )}

        <div style={{ marginTop: 16 }}>
          {active === "add" && <ADD />}
          {active === "change" && <CHANGE />}
        </div>
      </Content>
      <Footer style={footerStyle}>Arcana University © 2025</Footer>
    </Layout>
  );
};

export default Curriculum;
