// src/components/TokenTest.jsx
import React from "react";
import {
  genralGetReq,
  patchReq,
  postReq,
  putReq,
} from "../../src/apiReqHandle/getapiServices"; // adjust path if needed

const TokenTest = () => {
  const sampleToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NDBhM2UzYjQyMjk1NTQxOGU0Y2FjMSIsImlhdCI6MTc0OTY3ODM2MCwiZXhwIjoxNzUwMjgzMTYwfQ.dyCerRl34fX-8TZV2-jJi_OTo3KdHnpW5MoMXjfSFto"; // replace with a valid token

  // Simulate Login
  const handleSetToken = () => {
    localStorage.setItem("token", sampleToken);
    console.log("✅ Token set in localStorage");
  };

  // Simulate Logout
  const handleClearToken = () => {
    localStorage.removeItem("token");
    console.log("🚪 Token removed from localStorage");
  };

  // General GET request
  const handlePublicGet = async () => {
    try {
      const data = await genralGetReq("products"); // Your endpoint
      console.log("🟢 Public GET Success:", data);
    } catch (err) {
      console.error("🔴 GET Failed:", err.message);
    }
  };

  // Private POST request
  const handlePrivatePost = async () => {
    try {
      const data = {
        name: "Demo Product",
        price: 999,
      };
      const res = await postReq("products", data);
      console.log("🟢 Private POST Success:", res.data);
    } catch (err) {
      console.error("🔴 POST Failed:", err.message);
    }
  };
  // Sample PUT request (full update)
  const handlePut = async () => {
    try {
      const updatedData = {
        name: "Updated Product",
        price: 1234,
      };
      const res = await putReq("products/123", updatedData); // 123 = example product ID
      console.log("🟢 PUT Success:", res);
    } catch (err) {
      console.error("🔴 PUT Failed:", err.message);
    }
  };

  // Sample PATCH request (partial update)
  const handlePatch = async () => {
    try {
      const updatedField = {
        price: "",
      };
      const res = await patchReq("products/123", updatedField); // 123 = example product ID
      console.log("🟢 PATCH Success:", res);
    } catch (err) {
      console.error("🔴 PATCH Failed:", err.message);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>🔐 Token & Request Tester</h2>
      <button onClick={handleSetToken}>Set Token (Login)</button>
      <button onClick={handleClearToken}>Clear Token (Logout)</button>
      <button onClick={handlePublicGet}>GET Products (Public/Private)</button>
      <button onClick={handlePrivatePost}>POST Product (Private)</button>
      <button onClick={handlePut}>put Product (Private)</button>
      <button onClick={handlePatch}>Patch Product (Private)</button>
    </div>
  );
};

export default TokenTest;
